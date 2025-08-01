import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 异常检测算法
class AnomalyDetector {
  // Z-Score异常检测
  static detectZScoreAnomalies(data: number[], threshold = 2.5) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return data.map((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      return {
        index,
        value,
        zScore,
        isAnomaly: zScore > threshold,
        severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low'
      };
    });
  }

  // IQR异常检测
  static detectIQRAnomalies(data: number[]) {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return data.map((value, index) => ({
      index,
      value,
      isAnomaly: value < lowerBound || value > upperBound,
      bounds: { lower: lowerBound, upper: upperBound },
      severity: value < (q1 - 3 * iqr) || value > (q3 + 3 * iqr) ? 'high' : 'medium'
    }));
  }

  // 移动平均异常检测
  static detectMovingAverageAnomalies(data: number[], windowSize = 7, threshold = 2) {
    const anomalies = [];
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
      const stdDev = Math.sqrt(window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length);
      
      const currentValue = data[i];
      const deviation = Math.abs((currentValue - mean) / stdDev);
      
      anomalies.push({
        index: i,
        value: currentValue,
        expectedRange: { min: mean - threshold * stdDev, max: mean + threshold * stdDev },
        deviation,
        isAnomaly: deviation > threshold,
        severity: deviation > 3 ? 'high' : deviation > 2 ? 'medium' : 'low'
      });
    }
    
    return anomalies;
  }

  // 趋势异常检测
  static detectTrendAnomalies(data: number[], sensitivity = 0.1) {
    const trends = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = (data[i] - data[i - 1]) / data[i - 1];
      const isAnomaly = Math.abs(change) > sensitivity;
      
      trends.push({
        index: i,
        value: data[i],
        previousValue: data[i - 1],
        changePercent: change * 100,
        isAnomaly,
        type: change > 0 ? 'spike' : 'drop',
        severity: Math.abs(change) > 0.5 ? 'high' : Math.abs(change) > 0.2 ? 'medium' : 'low'
      });
    }
    
    return trends;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { detectionType, metricType, timeRange, sensitivity } = await req.json();

    let anomalies = [];
    let metadata = {};

    switch (metricType) {
      case 'delivery_times':
        anomalies = await detectDeliveryTimeAnomalies(supabase, detectionType, timeRange, sensitivity);
        break;
      case 'order_volume':
        anomalies = await detectOrderVolumeAnomalies(supabase, detectionType, timeRange, sensitivity);
        break;
      case 'carrier_performance':
        anomalies = await detectCarrierPerformanceAnomalies(supabase, detectionType, timeRange, sensitivity);
        break;
      case 'system_alerts':
        anomalies = await detectSystemAlertAnomalies(supabase, detectionType, timeRange, sensitivity);
        break;
      case 'cost_analysis':
        anomalies = await detectCostAnomalies(supabase, detectionType, timeRange, sensitivity);
        break;
      default:
        throw new Error('Unsupported metric type');
    }

    // 生成异常报告
    const report = generateAnomalyReport(anomalies, metricType, detectionType);
    
    // 如果发现高严重性异常，创建系统告警
    const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
    if (highSeverityAnomalies.length > 0) {
      await createSystemAlert(supabase, highSeverityAnomalies, metricType);
    }

    return new Response(
      JSON.stringify({
        success: true,
        anomalies,
        report,
        metadata: {
          totalAnomalies: anomalies.length,
          highSeverity: anomalies.filter(a => a.severity === 'high').length,
          mediumSeverity: anomalies.filter(a => a.severity === 'medium').length,
          lowSeverity: anomalies.filter(a => a.severity === 'low').length,
          detectionType,
          metricType,
          timeRange
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in anomaly detection:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function detectDeliveryTimeAnomalies(supabase: any, detectionType: string, timeRange: number, sensitivity: number) {
  // 获取交付时间数据
  const { data: orders } = await supabase
    .from('orders')
    .select('estimated_delivery, actual_delivery, created_at')
    .not('actual_delivery', 'is', null)
    .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());

  if (!orders || orders.length === 0) return [];

  // 计算交付时间偏差（小时）
  const deviations = orders.map(order => {
    const estimated = new Date(order.estimated_delivery).getTime();
    const actual = new Date(order.actual_delivery).getTime();
    return (actual - estimated) / (1000 * 60 * 60); // 转换为小时
  });

  let anomalies = [];
  switch (detectionType) {
    case 'zscore':
      anomalies = AnomalyDetector.detectZScoreAnomalies(deviations, sensitivity || 2.5);
      break;
    case 'iqr':
      anomalies = AnomalyDetector.detectIQRAnomalies(deviations);
      break;
    case 'moving_average':
      anomalies = AnomalyDetector.detectMovingAverageAnomalies(deviations, 7, sensitivity || 2);
      break;
    case 'trend':
      anomalies = AnomalyDetector.detectTrendAnomalies(deviations, sensitivity || 0.1);
      break;
  }

  return anomalies.filter(a => a.isAnomaly).map(a => ({
    ...a,
    metricType: 'delivery_times',
    order: orders[a.index],
    description: `交付时间偏差异常: ${a.value.toFixed(2)}小时`,
    timestamp: orders[a.index]?.created_at
  }));
}

async function detectOrderVolumeAnomalies(supabase: any, detectionType: string, timeRange: number, sensitivity: number) {
  // 按日统计订单量
  const { data: dailyOrders } = await supabase
    .from('orders')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());

  if (!dailyOrders || dailyOrders.length === 0) return [];

  // 按日期分组统计
  const ordersByDate = dailyOrders.reduce((acc: any, order: any) => {
    const date = new Date(order.created_at).toDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const volumes = Object.values(ordersByDate) as number[];
  const dates = Object.keys(ordersByDate);

  let anomalies = [];
  switch (detectionType) {
    case 'zscore':
      anomalies = AnomalyDetector.detectZScoreAnomalies(volumes, sensitivity || 2.5);
      break;
    case 'iqr':
      anomalies = AnomalyDetector.detectIQRAnomalies(volumes);
      break;
    case 'moving_average':
      anomalies = AnomalyDetector.detectMovingAverageAnomalies(volumes, 7, sensitivity || 2);
      break;
    case 'trend':
      anomalies = AnomalyDetector.detectTrendAnomalies(volumes, sensitivity || 0.1);
      break;
  }

  return anomalies.filter(a => a.isAnomaly).map(a => ({
    ...a,
    metricType: 'order_volume',
    date: dates[a.index],
    description: `订单量异常: ${a.value}单`,
    timestamp: new Date(dates[a.index]).toISOString()
  }));
}

async function detectCarrierPerformanceAnomalies(supabase: any, detectionType: string, timeRange: number, sensitivity: number) {
  // 获取承运商性能数据
  const { data: orders } = await supabase
    .from('orders')
    .select('carrier, estimated_delivery, actual_delivery, created_at')
    .not('carrier', 'is', null)
    .not('actual_delivery', 'is', null)
    .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());

  if (!orders || orders.length === 0) return [];

  // 按承运商计算平均延迟
  const carrierPerformance = orders.reduce((acc: any, order: any) => {
    const carrier = order.carrier;
    const estimated = new Date(order.estimated_delivery).getTime();
    const actual = new Date(order.actual_delivery).getTime();
    const delay = (actual - estimated) / (1000 * 60 * 60); // 小时

    if (!acc[carrier]) {
      acc[carrier] = { delays: [], totalOrders: 0 };
    }
    acc[carrier].delays.push(delay);
    acc[carrier].totalOrders++;
    return acc;
  }, {});

  const carrierAvgDelays = Object.entries(carrierPerformance).map(([carrier, data]: [string, any]) => ({
    carrier,
    avgDelay: data.delays.reduce((sum: number, delay: number) => sum + delay, 0) / data.delays.length,
    totalOrders: data.totalOrders
  }));

  const delays = carrierAvgDelays.map(c => c.avgDelay);

  let anomalies = [];
  switch (detectionType) {
    case 'zscore':
      anomalies = AnomalyDetector.detectZScoreAnomalies(delays, sensitivity || 2.5);
      break;
    case 'iqr':
      anomalies = AnomalyDetector.detectIQRAnomalies(delays);
      break;
  }

  return anomalies.filter(a => a.isAnomaly).map(a => ({
    ...a,
    metricType: 'carrier_performance',
    carrier: carrierAvgDelays[a.index],
    description: `承运商性能异常: ${carrierAvgDelays[a.index].carrier} 平均延迟${a.value.toFixed(2)}小时`,
    timestamp: new Date().toISOString()
  }));
}

async function detectSystemAlertAnomalies(supabase: any, detectionType: string, timeRange: number, sensitivity: number) {
  // 获取系统告警数据
  const { data: alerts } = await supabase
    .from('alerts')
    .select('severity, created_at, alert_type')
    .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());

  if (!alerts || alerts.length === 0) return [];

  // 按小时统计告警数量
  const alertsByHour = alerts.reduce((acc: any, alert: any) => {
    const hour = new Date(alert.created_at).toISOString().substring(0, 13);
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const alertCounts = Object.values(alertsByHour) as number[];
  const hours = Object.keys(alertsByHour);

  let anomalies = [];
  switch (detectionType) {
    case 'zscore':
      anomalies = AnomalyDetector.detectZScoreAnomalies(alertCounts, sensitivity || 2.5);
      break;
    case 'iqr':
      anomalies = AnomalyDetector.detectIQRAnomalies(alertCounts);
      break;
    case 'moving_average':
      anomalies = AnomalyDetector.detectMovingAverageAnomalies(alertCounts, 24, sensitivity || 2);
      break;
  }

  return anomalies.filter(a => a.isAnomaly).map(a => ({
    ...a,
    metricType: 'system_alerts',
    hour: hours[a.index],
    description: `系统告警数量异常: ${a.value}个/小时`,
    timestamp: new Date(hours[a.index]).toISOString()
  }));
}

async function detectCostAnomalies(supabase: any, detectionType: string, timeRange: number, sensitivity: number) {
  // 获取订单成本数据
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, created_at, weight, volume')
    .not('total_amount', 'is', null)
    .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());

  if (!orders || orders.length === 0) return [];

  // 计算单位成本（元/公斤）
  const unitCosts = orders
    .filter(order => order.weight && order.weight > 0)
    .map(order => parseFloat(order.total_amount) / parseFloat(order.weight));

  let anomalies = [];
  switch (detectionType) {
    case 'zscore':
      anomalies = AnomalyDetector.detectZScoreAnomalies(unitCosts, sensitivity || 2.5);
      break;
    case 'iqr':
      anomalies = AnomalyDetector.detectIQRAnomalies(unitCosts);
      break;
  }

  return anomalies.filter(a => a.isAnomaly).map(a => ({
    ...a,
    metricType: 'cost_analysis',
    description: `运输成本异常: ${a.value.toFixed(2)}元/公斤`,
    timestamp: new Date().toISOString()
  }));
}

function generateAnomalyReport(anomalies: any[], metricType: string, detectionType: string) {
  const highSeverity = anomalies.filter(a => a.severity === 'high').length;
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;
  const lowSeverity = anomalies.filter(a => a.severity === 'low').length;

  const riskLevel = highSeverity > 0 ? 'high' : mediumSeverity > 5 ? 'medium' : 'low';
  
  return {
    summary: `检测到 ${anomalies.length} 个异常，其中高风险 ${highSeverity} 个`,
    riskLevel,
    recommendations: generateRecommendations(anomalies, metricType, riskLevel),
    detectionMethod: detectionType,
    analysisTime: new Date().toISOString()
  };
}

function generateRecommendations(anomalies: any[], metricType: string, riskLevel: string) {
  const recommendations = [];
  
  if (riskLevel === 'high') {
    recommendations.push('立即调查高风险异常情况');
    recommendations.push('启动应急预案和风险缓解措施');
  }
  
  switch (metricType) {
    case 'delivery_times':
      recommendations.push('检查运输路线和承运商性能');
      recommendations.push('优化配送计划和资源分配');
      break;
    case 'order_volume':
      recommendations.push('分析市场需求波动原因');
      recommendations.push('调整库存和产能规划');
      break;
    case 'carrier_performance':
      recommendations.push('与异常承运商沟通改进措施');
      recommendations.push('考虑备选承运商方案');
      break;
    case 'system_alerts':
      recommendations.push('检查系统监控配置');
      recommendations.push('优化告警阈值设置');
      break;
    case 'cost_analysis':
      recommendations.push('审查成本结构和定价策略');
      recommendations.push('寻找成本优化机会');
      break;
  }
  
  return recommendations;
}

async function createSystemAlert(supabase: any, anomalies: any[], metricType: string) {
  const alert = {
    title: `${metricType}异常检测告警`,
    description: `检测到${anomalies.length}个高风险异常，需要立即关注`,
    severity: 'high',
    alert_type: 'anomaly_detection',
    status: 'active',
    metadata: {
      anomalies: anomalies.slice(0, 5), // 只保存前5个异常详情
      metricType,
      detectionTime: new Date().toISOString()
    }
  };

  await supabase.from('alerts').insert([alert]);
}