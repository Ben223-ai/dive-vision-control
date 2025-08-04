import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ApiKey {
  id: string;
  permissions: string[];
  rate_limit: number;
}

interface OrderItem {
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  weight?: number;
  volume?: number;
  sku?: string;
  category?: string;
}

interface CreateOrderRequest {
  order_number?: string;
  customer_name: string;
  origin: string;
  destination: string;
  carrier?: string;
  estimated_delivery?: string;
  custom_fields?: Record<string, any>;
  order_items: OrderItem[];
}

interface CreateOrderResponse {
  success: boolean;
  data?: {
    order_id: string;
    order_number: string;
  };
  message?: string;
  error?: string;
}

// 初始化Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// 验证API密钥
async function validateApiKey(apiKey: string): Promise<ApiKey | null> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, permissions, rate_limit')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.log('API key validation failed:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

// 检查速率限制
async function checkRateLimit(apiKeyId: string, rateLimit: number): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { count, error } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', oneHourAgo.toISOString());

    if (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }

    return (count || 0) < rateLimit;
  } catch (error) {
    console.error('Error in rate limit check:', error);
    return false;
  }
}

// 记录API使用情况
async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  responseStatus: number,
  responseTime: number,
  requestParams?: any
) {
  try {
    await supabase.from('api_usage_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      request_method: method,
      response_status: responseStatus,
      response_time_ms: responseTime,
      request_params: requestParams || {}
    });
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
}

// 更新API密钥最后使用时间
async function updateLastUsed(apiKeyId: string) {
  try {
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId);
  } catch (error) {
    console.error('Error updating last used:', error);
  }
}

// 生成订单号
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.toString().slice(-8)}${random}`;
}

// 创建订单
async function createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
  try {
    // 验证必要字段
    if (!orderData.customer_name || !orderData.origin || !orderData.destination) {
      return {
        success: false,
        error: '缺少必要字段: customer_name, origin, destination'
      };
    }

    if (!orderData.order_items || orderData.order_items.length === 0) {
      return {
        success: false,
        error: '订单必须包含至少一个商品'
      };
    }

    // 验证订单商品
    for (const item of orderData.order_items) {
      if (!item.item_name || item.quantity <= 0 || item.unit_price < 0) {
        return {
          success: false,
          error: '订单商品信息不完整或无效'
        };
      }
    }

    // 计算总金额
    const totalAmount = orderData.order_items.reduce(
      (total, item) => total + (item.quantity * item.unit_price), 
      0
    );

    // 准备订单数据
    const orderInsertData = {
      order_number: orderData.order_number || generateOrderNumber(),
      customer_name: orderData.customer_name,
      origin: orderData.origin,
      destination: orderData.destination,
      carrier: orderData.carrier || null,
      estimated_delivery: orderData.estimated_delivery || null,
      total_amount: totalAmount,
      status: 'pending',
      progress: 0,
      custom_fields: orderData.custom_fields || {}
    };

    // 创建订单
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([orderInsertData])
      .select('id, order_number')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return {
        success: false,
        error: '创建订单失败: ' + orderError.message
      };
    }

    // 创建订单商品
    const itemsData = orderData.order_items.map(item => ({
      order_id: orderResult.id,
      item_name: item.item_name,
      item_description: item.item_description || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      weight: item.weight || null,
      volume: item.volume || null,
      sku: item.sku || null,
      category: item.category || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsData);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // 如果商品创建失败，删除已创建的订单
      await supabase.from('orders').delete().eq('id', orderResult.id);
      return {
        success: false,
        error: '创建订单商品失败: ' + itemsError.message
      };
    }

    return {
      success: true,
      data: {
        order_id: orderResult.id,
        order_number: orderResult.order_number
      },
      message: '订单创建成功'
    };

  } catch (error) {
    console.error('Unexpected error creating order:', error);
    return {
      success: false,
      error: '系统错误，请稍后重试'
    };
  }
}

serve(async (req) => {
  const startTime = Date.now();
  
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: '只允许POST请求' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // 验证API密钥
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少API密钥' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const validatedKey = await validateApiKey(apiKey);
    if (!validatedKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API密钥无效' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 检查权限
    if (!validatedKey.permissions.includes('orders.create')) {
      const responseTime = Date.now() - startTime;
      await logApiUsage(validatedKey.id, '/create-order-api', 'POST', 403, responseTime);
      
      return new Response(
        JSON.stringify({ success: false, error: '权限不足' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 检查速率限制
    const withinRateLimit = await checkRateLimit(validatedKey.id, validatedKey.rate_limit);
    if (!withinRateLimit) {
      const responseTime = Date.now() - startTime;
      await logApiUsage(validatedKey.id, '/create-order-api', 'POST', 429, responseTime);
      
      return new Response(
        JSON.stringify({ success: false, error: '请求频率过高，请稍后重试' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 解析请求体
    const requestBody = await req.json();
    console.log('Create order request:', requestBody);

    // 创建订单
    const result = await createOrder(requestBody);
    
    // 记录API使用情况
    const responseTime = Date.now() - startTime;
    const responseStatus = result.success ? 200 : 400;
    await logApiUsage(validatedKey.id, '/create-order-api', 'POST', responseStatus, responseTime, {
      order_number: requestBody.order_number,
      customer_name: requestBody.customer_name,
      items_count: requestBody.order_items?.length || 0
    });

    // 更新最后使用时间
    await updateLastUsed(validatedKey.id);

    return new Response(
      JSON.stringify(result),
      {
        status: responseStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-order-api:', error);
    const responseTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '服务器内部错误' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});