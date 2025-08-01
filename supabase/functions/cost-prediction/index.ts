import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 成本预测模型
class CostPredictionModel {
  // 基于历史数据的线性回归预测
  static linearRegression(data: Array<{x: number, y: number}>) {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = data.reduce((sum, point) => sum + point.x * point.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  // 多元线性回归预测
  static multipleRegression(features: number[][], targets: number[]) {
    // 简化的多元回归实现
    const n = features.length;
    const m = features[0].length;
    
    // 添加偏置项
    const X = features.map(row => [1, ...row]);
    
    // 计算权重 (X^T * X)^(-1) * X^T * y
    // 这里使用简化算法，实际应用中可以使用更高级的数值方法
    const weights = new Array(m + 1).fill(0);
    
    // 使用梯度下降近似
    const learningRate = 0.001;
    const iterations = 1000;
    
    for (let iter = 0; iter < iterations; iter++) {
      const predictions = X.map(row => 
        row.reduce((sum, val, idx) => sum + val * weights[idx], 0)
      );
      
      const errors = predictions.map((pred, idx) => pred - targets[idx]);
      
      // 更新权重
      for (let j = 0; j < weights.length; j++) {
        const gradient = errors.reduce((sum, error, idx) => 
          sum + error * X[idx][j], 0
        ) / n;
        weights[j] -= learningRate * gradient;
      }
    }
    
    return weights;
  }

  // 基于距离的成本预测
  static distanceBasedPrediction(distance: number, baseRate: number, distanceRate: number) {
    return baseRate + distance * distanceRate;
  }

  // 基于重量和体积的成本预测
  static weightVolumePrediction(weight: number, volume: number, weightRate: number, volumeRate: number) {
    const weightCost = weight * weightRate;
    const volumeCost = volume * volumeRate;
    return Math.max(weightCost, volumeCost); // 取较大值
  }

  // 季节性调整
  static seasonalAdjustment(baseCost: number, month: number) {
    // 季节性因子 (1月=1, 12月=12)
    const seasonalFactors = [1.1, 1.0, 0.95, 0.9, 0.85, 0.9, 1.05, 1.1, 1.0, 0.95, 1.05, 1.2];
    const factor = seasonalFactors[month - 1] || 1.0;
    return baseCost * factor;
  }

  // 承运商性能调整
  static carrierAdjustment(baseCost: number, carrierPerformance: number) {
    // 性能分数 0-100，分数越高成本可能越高但质量更好
    const performanceFactor = 0.8 + (carrierPerformance / 100) * 0.4; // 0.8 - 1.2
    return baseCost * performanceFactor;
  }

  // 路况和天气调整
  static conditionalAdjustment(baseCost: number, weatherFactor: number, trafficFactor: number) {
    const adjustment = 1 + (weatherFactor - 1) * 0.1 + (trafficFactor - 1) * 0.05;
    return baseCost * Math.max(0.9, Math.min(1.3, adjustment));
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

    const { 
      predictionType, 
      origin, 
      destination, 
      weight, 
      volume, 
      carrier,
      urgency,
      weatherConditions,
      trafficConditions 
    } = await req.json();

    let prediction;
    
    switch (predictionType) {
      case 'single_order':
        prediction = await predictSingleOrderCost(supabase, {
          origin, destination, weight, volume, carrier, urgency,
          weatherConditions, trafficConditions
        });
        break;
      case 'batch_analysis':
        prediction = await batchCostAnalysis(supabase);
        break;
      case 'trend_forecast':
        prediction = await costTrendForecast(supabase);
        break;
      case 'optimization':
        prediction = await costOptimization(supabase, { origin, destination, weight, volume });
        break;
      default:
        throw new Error('Unsupported prediction type');
    }

    return new Response(
      JSON.stringify({
        success: true,
        prediction,
        metadata: {
          predictionType,
          timestamp: new Date().toISOString(),
          model: 'cost-prediction-v1.0'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cost prediction:', error);
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

async function predictSingleOrderCost(supabase: any, orderData: any) {
  console.log('Predicting cost for single order:', orderData);
  
  // 获取历史数据进行训练
  const { data: historicalOrders } = await supabase
    .from('orders')
    .select('origin, destination, weight, volume, total_amount, carrier, created_at')
    .not('total_amount', 'is', null)
    .not('weight', 'is', null)
    .limit(1000);

  if (!historicalOrders || historicalOrders.length === 0) {
    throw new Error('Insufficient historical data for prediction');
  }

  // 基础成本计算
  const similarOrders = historicalOrders.filter(order => 
    order.carrier === orderData.carrier || 
    Math.abs(parseFloat(order.weight) - orderData.weight) < orderData.weight * 0.2
  );

  let baseCost = 0;
  
  if (similarOrders.length > 0) {
    // 使用相似订单的平均成本
    baseCost = similarOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_amount), 0
    ) / similarOrders.length;
  } else {
    // 使用回归模型
    const features = historicalOrders.map(order => [
      parseFloat(order.weight) || 0,
      parseFloat(order.volume) || 0
    ]);
    const targets = historicalOrders.map(order => parseFloat(order.total_amount));
    
    const weights = CostPredictionModel.multipleRegression(features, targets);
    baseCost = weights[0] + weights[1] * orderData.weight + weights[2] * (orderData.volume || 0);
  }

  // 应用各种调整因子
  const currentMonth = new Date().getMonth() + 1;
  let adjustedCost = CostPredictionModel.seasonalAdjustment(baseCost, currentMonth);

  // 承运商调整
  if (orderData.carrier) {
    const carrierPerformance = await getCarrierPerformance(supabase, orderData.carrier);
    adjustedCost = CostPredictionModel.carrierAdjustment(adjustedCost, carrierPerformance);
  }

  // 紧急程度调整
  if (orderData.urgency === 'urgent') {
    adjustedCost *= 1.3; // 紧急订单增加30%
  } else if (orderData.urgency === 'express') {
    adjustedCost *= 1.15; // 快递增加15%
  }

  // 天气和路况调整
  const weatherFactor = orderData.weatherConditions === 'bad' ? 1.2 : 1.0;
  const trafficFactor = orderData.trafficConditions === 'heavy' ? 1.1 : 1.0;
  adjustedCost = CostPredictionModel.conditionalAdjustment(adjustedCost, weatherFactor, trafficFactor);

  // 计算置信区间
  const variance = similarOrders.length > 1 ? 
    similarOrders.reduce((sum, order) => 
      sum + Math.pow(parseFloat(order.total_amount) - baseCost, 2), 0
    ) / (similarOrders.length - 1) : 0;
  
  const standardError = Math.sqrt(variance / similarOrders.length);
  const confidenceInterval = {
    lower: Math.max(0, adjustedCost - 1.96 * standardError),
    upper: adjustedCost + 1.96 * standardError
  };

  return {
    predictedCost: Math.round(adjustedCost * 100) / 100,
    confidenceInterval,
    confidence: Math.min(95, 60 + similarOrders.length * 2), // 置信度基于数据量
    factors: {
      baseCost: Math.round(baseCost * 100) / 100,
      seasonalAdjustment: currentMonth,
      carrierAdjustment: orderData.carrier,
      urgencyAdjustment: orderData.urgency,
      weatherAdjustment: orderData.weatherConditions,
      trafficAdjustment: orderData.trafficConditions
    },
    recommendations: generateCostRecommendations(adjustedCost, orderData)
  };
}

async function batchCostAnalysis(supabase: any) {
  console.log('Performing batch cost analysis');
  
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .not('total_amount', 'is', null)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (!recentOrders || recentOrders.length === 0) {
    throw new Error('No recent orders for analysis');
  }

  // 按承运商分析
  const carrierAnalysis = {};
  recentOrders.forEach(order => {
    if (!order.carrier) return;
    
    if (!carrierAnalysis[order.carrier]) {
      carrierAnalysis[order.carrier] = {
        orders: [],
        totalCost: 0,
        avgCost: 0,
        costPerKg: []
      };
    }
    
    carrierAnalysis[order.carrier].orders.push(order);
    carrierAnalysis[order.carrier].totalCost += parseFloat(order.total_amount);
    
    if (order.weight && parseFloat(order.weight) > 0) {
      carrierAnalysis[order.carrier].costPerKg.push(
        parseFloat(order.total_amount) / parseFloat(order.weight)
      );
    }
  });

  // 计算平均值和趋势
  Object.keys(carrierAnalysis).forEach(carrier => {
    const analysis = carrierAnalysis[carrier];
    analysis.avgCost = analysis.totalCost / analysis.orders.length;
    analysis.avgCostPerKg = analysis.costPerKg.length > 0 ?
      analysis.costPerKg.reduce((sum, cost) => sum + cost, 0) / analysis.costPerKg.length : 0;
  });

  // 成本趋势分析
  const dailyCosts = {};
  recentOrders.forEach(order => {
    const date = new Date(order.created_at).toDateString();
    if (!dailyCosts[date]) {
      dailyCosts[date] = { total: 0, count: 0 };
    }
    dailyCosts[date].total += parseFloat(order.total_amount);
    dailyCosts[date].count += 1;
  });

  const trendData = Object.entries(dailyCosts).map(([date, data]: [string, any]) => ({
    date,
    avgCost: data.total / data.count,
    totalCost: data.total,
    orderCount: data.count
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    summary: {
      totalOrders: recentOrders.length,
      totalCost: recentOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
      avgOrderCost: recentOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) / recentOrders.length,
      dateRange: {
        start: recentOrders[recentOrders.length - 1]?.created_at,
        end: recentOrders[0]?.created_at
      }
    },
    carrierAnalysis,
    trendData,
    insights: generateBatchInsights(carrierAnalysis, trendData)
  };
}

async function costTrendForecast(supabase: any) {
  console.log('Forecasting cost trends');
  
  // 获取历史数据
  const { data: historicalData } = await supabase
    .from('orders')
    .select('total_amount, created_at, weight, volume')
    .not('total_amount', 'is', null)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  if (!historicalData || historicalData.length < 10) {
    throw new Error('Insufficient data for trend forecasting');
  }

  // 按周聚合数据
  const weeklyData = {};
  historicalData.forEach(order => {
    const week = getWeekKey(new Date(order.created_at));
    if (!weeklyData[week]) {
      weeklyData[week] = { costs: [], totalCost: 0, count: 0 };
    }
    weeklyData[week].costs.push(parseFloat(order.total_amount));
    weeklyData[week].totalCost += parseFloat(order.total_amount);
    weeklyData[week].count += 1;
  });

  const weeklyAvgs = Object.entries(weeklyData)
    .map(([week, data]: [string, any]) => ({
      week,
      avgCost: data.totalCost / data.count,
      timestamp: new Date(week).getTime()
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // 线性回归预测
  const regressionData = weeklyAvgs.map((item, index) => ({
    x: index,
    y: item.avgCost
  }));

  const { slope, intercept } = CostPredictionModel.linearRegression(regressionData);

  // 预测未来4周
  const predictions = [];
  const lastIndex = weeklyAvgs.length - 1;
  
  for (let i = 1; i <= 4; i++) {
    const predictedCost = slope * (lastIndex + i) + intercept;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i * 7);
    
    predictions.push({
      week: getWeekKey(futureDate),
      predictedCost: Math.max(0, predictedCost),
      confidence: Math.max(70 - i * 5, 50) // 置信度随时间递减
    });
  }

  return {
    historical: weeklyAvgs,
    predictions,
    trend: {
      direction: slope > 0 ? 'increasing' : 'decreasing',
      rate: Math.abs(slope),
      r_squared: calculateRSquared(regressionData, slope, intercept)
    },
    insights: generateTrendInsights(slope, predictions)
  };
}

async function costOptimization(supabase: any, orderData: any) {
  console.log('Optimizing costs for order:', orderData);
  
  // 获取可用承运商数据
  const { data: carriers } = await supabase
    .from('orders')
    .select('carrier, total_amount, weight, volume, estimated_delivery, actual_delivery')
    .not('carrier', 'is', null)
    .not('total_amount', 'is', null);

  if (!carriers || carriers.length === 0) {
    throw new Error('No carrier data available for optimization');
  }

  // 按承运商分组分析
  const carrierStats = {};
  carriers.forEach(order => {
    const carrier = order.carrier;
    if (!carrierStats[carrier]) {
      carrierStats[carrier] = {
        orders: [],
        totalCost: 0,
        delays: [],
        avgCostPerKg: 0
      };
    }
    
    carrierStats[carrier].orders.push(order);
    carrierStats[carrier].totalCost += parseFloat(order.total_amount);
    
    if (order.estimated_delivery && order.actual_delivery) {
      const estimated = new Date(order.estimated_delivery).getTime();
      const actual = new Date(order.actual_delivery).getTime();
      const delay = (actual - estimated) / (1000 * 60 * 60); // 小时
      carrierStats[carrier].delays.push(delay);
    }
  });

  // 计算每个承运商的性能指标
  const optimizationOptions = Object.entries(carrierStats).map(([carrier, stats]: [string, any]) => {
    const avgCost = stats.totalCost / stats.orders.length;
    const avgDelay = stats.delays.length > 0 ? 
      stats.delays.reduce((sum: number, delay: number) => sum + delay, 0) / stats.delays.length : 0;
    const reliability = stats.delays.length > 0 ? 
      stats.delays.filter((delay: number) => delay <= 0).length / stats.delays.length : 0.5;

    // 预测当前订单的成本
    const similarOrders = stats.orders.filter((order: any) => 
      Math.abs(parseFloat(order.weight) - orderData.weight) < orderData.weight * 0.3
    );
    
    const predictedCost = similarOrders.length > 0 ?
      similarOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0) / similarOrders.length :
      avgCost;

    // 综合评分 (成本越低越好，可靠性越高越好)
    const costScore = Math.max(0, 100 - (predictedCost / avgCost) * 50);
    const reliabilityScore = reliability * 100;
    const overallScore = (costScore * 0.6 + reliabilityScore * 0.4);

    return {
      carrier,
      predictedCost: Math.round(predictedCost * 100) / 100,
      avgDelay: Math.round(avgDelay * 100) / 100,
      reliability: Math.round(reliability * 100),
      overallScore: Math.round(overallScore),
      recommendation: getCarrierRecommendation(costScore, reliabilityScore, predictedCost, avgCost)
    };
  }).sort((a, b) => b.overallScore - a.overallScore);

  // 成本节省建议
  const bestOption = optimizationOptions[0];
  const currentCost = optimizationOptions.find(opt => opt.carrier === orderData.carrier)?.predictedCost || 0;
  const potentialSavings = currentCost > 0 ? currentCost - bestOption.predictedCost : 0;

  return {
    currentCarrier: orderData.carrier,
    recommendedCarrier: bestOption.carrier,
    optimizationOptions: optimizationOptions.slice(0, 5), // 前5个选项
    savings: {
      amount: Math.max(0, potentialSavings),
      percentage: currentCost > 0 ? Math.round((potentialSavings / currentCost) * 100) : 0
    },
    strategies: generateOptimizationStrategies(optimizationOptions, orderData)
  };
}

// 辅助函数
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24) + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function calculateRSquared(data: Array<{x: number, y: number}>, slope: number, intercept: number): number {
  const meanY = data.reduce((sum, point) => sum + point.y, 0) / data.length;
  const totalSumSquares = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const residualSumSquares = data.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  
  return 1 - (residualSumSquares / totalSumSquares);
}

async function getCarrierPerformance(supabase: any, carrier: string): Promise<number> {
  const { data: orders } = await supabase
    .from('orders')
    .select('estimated_delivery, actual_delivery')
    .eq('carrier', carrier)
    .not('actual_delivery', 'is', null)
    .limit(50);

  if (!orders || orders.length === 0) return 70; // 默认分数

  const onTimeDeliveries = orders.filter(order => {
    const estimated = new Date(order.estimated_delivery).getTime();
    const actual = new Date(order.actual_delivery).getTime();
    return actual <= estimated;
  }).length;

  return Math.round((onTimeDeliveries / orders.length) * 100);
}

function generateCostRecommendations(cost: number, orderData: any): string[] {
  const recommendations = [];
  
  if (cost > 1000) {
    recommendations.push('考虑拆分为多个小批次运输以降低成本');
  }
  
  if (orderData.urgency === 'urgent') {
    recommendations.push('如非紧急可改为标准配送节省30%费用');
  }
  
  if (orderData.weatherConditions === 'bad') {
    recommendations.push('恶劣天气可能增加成本，建议推迟发货');
  }
  
  recommendations.push('与多家承运商询价比较获得最优价格');
  
  return recommendations;
}

function generateBatchInsights(carrierAnalysis: any, trendData: any): string[] {
  const insights = [];
  
  const carriers = Object.keys(carrierAnalysis);
  if (carriers.length > 1) {
    const costs = carriers.map(c => carrierAnalysis[c].avgCost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const cheapestCarrier = carriers.find(c => carrierAnalysis[c].avgCost === minCost);
    
    insights.push(`${cheapestCarrier} 是最经济的承运商，平均成本 ¥${minCost.toFixed(2)}`);
    
    if (maxCost / minCost > 1.5) {
      insights.push('承运商间成本差异较大，优化承运商选择可显著节省成本');
    }
  }
  
  if (trendData.length >= 5) {
    const recentAvg = trendData.slice(-3).reduce((sum: number, item: any) => sum + item.avgCost, 0) / 3;
    const earlyAvg = trendData.slice(0, 3).reduce((sum: number, item: any) => sum + item.avgCost, 0) / 3;
    
    if (recentAvg > earlyAvg * 1.1) {
      insights.push('最近成本呈上升趋势，建议关注成本控制');
    } else if (recentAvg < earlyAvg * 0.9) {
      insights.push('成本控制效果良好，保持当前策略');
    }
  }
  
  return insights;
}

function generateTrendInsights(slope: number, predictions: any[]): string[] {
  const insights = [];
  
  if (slope > 0) {
    insights.push(`成本预计将继续上升，月增长率约 ${(slope * 4).toFixed(1)}%`);
    insights.push('建议提前锁定价格或寻找替代方案');
  } else {
    insights.push(`成本预计将下降，月降幅约 ${Math.abs(slope * 4).toFixed(1)}%`);
    insights.push('当前是采购运输服务的好时机');
  }
  
  const maxPrediction = Math.max(...predictions.map(p => p.predictedCost));
  const minPrediction = Math.min(...predictions.map(p => p.predictedCost));
  
  if ((maxPrediction - minPrediction) / minPrediction > 0.2) {
    insights.push('未来成本波动较大，建议制定灵活的预算策略');
  }
  
  return insights;
}

function generateOptimizationStrategies(options: any[], orderData: any): string[] {
  const strategies = [];
  
  const bestOption = options[0];
  const currentOption = options.find(opt => opt.carrier === orderData.carrier);
  
  if (currentOption && bestOption.overallScore > currentOption.overallScore) {
    strategies.push(`切换到 ${bestOption.carrier} 可提升 ${(bestOption.overallScore - currentOption.overallScore).toFixed(1)} 分综合表现`);
  }
  
  const reliableCarriers = options.filter(opt => opt.reliability >= 80);
  if (reliableCarriers.length > 0) {
    strategies.push(`考虑高可靠性承运商: ${reliableCarriers.slice(0, 3).map(c => c.carrier).join(', ')}`);
  }
  
  const economicCarriers = options.filter(opt => opt.predictedCost < options[0].predictedCost * 1.1);
  if (economicCarriers.length > 1) {
    strategies.push('在保证质量前提下选择经济型承运商');
  }
  
  strategies.push('建立承运商绩效评估体系，定期优化选择');
  
  return strategies;
}

function getCarrierRecommendation(costScore: number, reliabilityScore: number, predictedCost: number, avgCost: number): string {
  if (costScore >= 80 && reliabilityScore >= 80) {
    return '强烈推荐 - 成本低且可靠性高';
  } else if (costScore >= 70) {
    return '推荐 - 成本优势明显';
  } else if (reliabilityScore >= 80) {
    return '可考虑 - 可靠性高但成本较高';
  } else {
    return '谨慎选择 - 成本高且可靠性一般';
  }
}