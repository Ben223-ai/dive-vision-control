import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-signature, x-timestamp, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

// HMAC验证
async function verifyHMAC(payload: string, signature: string, timestamp: string): Promise<boolean> {
  try {
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('WEBHOOK_SECRET not configured');
    }

    // 检查时间戳，防止重放攻击（允许5分钟的时间差）
    const requestTime = parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - requestTime) > 300) {
      console.error('Request timestamp too old or too far in future');
      return false;
    }

    // 构造签名字符串
    const signatureString = `${timestamp}.${payload}`;
    
    // 生成HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const hmacBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureString));
    const expectedSignature = 'sha256=' + Array.from(new Uint8Array(hmacBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 比较签名
    return signature === expectedSignature;
  } catch (error) {
    console.error('HMAC verification failed:', error);
    return false;
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
    // 获取请求体
    const rawPayload = await req.text();
    const signature = req.headers.get('x-signature');
    const timestamp = req.headers.get('x-timestamp');

    if (!signature || !timestamp) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少签名或时间戳' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 验证HMAC签名
    const isValidSignature = await verifyHMAC(rawPayload, signature, timestamp);
    if (!isValidSignature) {
      return new Response(
        JSON.stringify({ success: false, error: '签名验证失败' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 解析请求体
    const requestBody = JSON.parse(rawPayload);
    console.log('Create order webhook request:', requestBody);

    // 创建订单
    const result = await createOrder(requestBody);
    
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in webhook-order-api:', error);
    
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