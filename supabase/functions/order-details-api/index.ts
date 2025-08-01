import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  permissions: string[];
  rate_limit: number;
  last_used_at: string | null;
  expires_at: string | null;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  origin: string;
  destination: string;
  carrier: string | null;
  status: string;
  progress: number | null;
  total_amount: number | null;
  weight: number | null;
  volume: number | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    item_name: string;
    item_description: string | null;
    quantity: number;
    unit_price: number;
    weight: number | null;
    volume: number | null;
    sku: string | null;
    category: string | null;
  }>;
}

// 创建Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function validateApiKey(apiKey: string): Promise<ApiKey | null> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // 检查是否过期
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

async function checkRateLimit(apiKeyId: string, rateLimit: number): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  try {
    const { count, error } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Rate limit check error:', error);
      return false;
    }

    return (count || 0) < rateLimit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return false;
  }
}

async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  requestIp: string | null,
  method: string,
  params: any,
  status: number,
  responseTime: number
) {
  try {
    await supabase
      .from('api_usage_logs')
      .insert([{
        api_key_id: apiKeyId,
        endpoint,
        request_ip: requestIp,
        request_method: method,
        request_params: params,
        response_status: status,
        response_time_ms: responseTime
      }]);
  } catch (error) {
    console.error('Log API usage error:', error);
  }
}

async function updateLastUsed(apiKeyId: string) {
  try {
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId);
  } catch (error) {
    console.error('Update last used error:', error);
  }
}

async function getOrderDetails(orderNumber: string): Promise<OrderDetails | null> {
  try {
    // 获取订单基本信息
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !orderData) {
      return null;
    }

    // 获取订单明细
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return null;
    }

    return {
      ...orderData,
      order_items: itemsData || []
    };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
}

serve(async (req) => {
  const startTime = Date.now();
  const requestIp = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        message: '只支持GET请求'
      }),
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
        JSON.stringify({ 
          error: 'API key required',
          message: '请在请求头中提供x-api-key'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const validApiKey = await validateApiKey(apiKey);
    if (!validApiKey) {
      await logApiUsage('', 'order-details', requestIp, req.method, {}, 401, Date.now() - startTime);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key',
          message: 'API密钥无效或已过期'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 检查权限
    if (!validApiKey.permissions.includes('orders.read')) {
      await logApiUsage(validApiKey.id, 'order-details', requestIp, req.method, {}, 403, Date.now() - startTime);
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient permissions',
          message: '没有读取订单的权限'
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 检查频率限制
    const canProceed = await checkRateLimit(validApiKey.id, validApiKey.rate_limit);
    if (!canProceed) {
      await logApiUsage(validApiKey.id, 'order-details', requestIp, req.method, {}, 429, Date.now() - startTime);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `请求频率超限，每小时最多${validApiKey.rate_limit}次请求`
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 获取订单号参数
    const url = new URL(req.url);
    const orderNumber = url.searchParams.get('order_number');

    if (!orderNumber) {
      await logApiUsage(validApiKey.id, 'order-details', requestIp, req.method, {}, 400, Date.now() - startTime);
      return new Response(
        JSON.stringify({ 
          error: 'Missing parameter',
          message: '缺少order_number参数'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 获取订单详情
    const orderDetails = await getOrderDetails(orderNumber);
    const responseTime = Date.now() - startTime;

    if (!orderDetails) {
      await logApiUsage(validApiKey.id, 'order-details', requestIp, req.method, { order_number: orderNumber }, 404, responseTime);
      return new Response(
        JSON.stringify({ 
          error: 'Order not found',
          message: '订单不存在'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 更新API密钥最后使用时间
    await updateLastUsed(validApiKey.id);

    // 记录API使用
    await logApiUsage(validApiKey.id, 'order-details', requestIp, req.method, { order_number: orderNumber }, 200, responseTime);

    // 返回订单详情（移除敏感信息）
    const safeOrderDetails = {
      ...orderDetails,
      // 移除内部ID等敏感信息
      id: undefined,
      order_items: orderDetails.order_items.map(item => ({
        ...item,
        id: undefined,
        order_id: undefined
      }))
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: safeOrderDetails,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('API error:', error);
    const responseTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: '服务器内部错误'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});