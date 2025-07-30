import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DelayPredictionRequest {
  order_id: string;
  factors: {
    route_complexity: number;     // 1-10 scale
    weather_severity: number;     // 1-10 scale  
    traffic_density: number;      // 1-10 scale
    carrier_performance: number;  // 1-10 scale
    distance_km: number;
    current_hour: number;         // 0-23
  };
}

interface PredictionResult {
  predicted_delay_hours: number;
  confidence_score: number;
  risk_factors: string[];
  recommendation: string;
}

// Simple AI model for delay prediction
function predictDelay(factors: DelayPredictionRequest["factors"]): PredictionResult {
  // Weighted factors for delay prediction
  const weights = {
    route_complexity: 0.15,
    weather_severity: 0.25,
    traffic_density: 0.20,
    carrier_performance: 0.25,
    distance_factor: 0.10,
    time_factor: 0.05
  };

  // Normalize distance factor (assume baseline 100km)
  const distance_factor = Math.min(factors.distance_km / 100, 5);
  
  // Time factor (rush hours have higher risk)
  const time_factor = (factors.current_hour >= 7 && factors.current_hour <= 9) || 
                     (factors.current_hour >= 17 && factors.current_hour <= 19) ? 8 : 3;

  // Calculate weighted risk score (0-10 scale)
  const risk_score = 
    weights.route_complexity * factors.route_complexity +
    weights.weather_severity * factors.weather_severity +
    weights.traffic_density * factors.traffic_density +
    weights.carrier_performance * (10 - factors.carrier_performance) + // invert carrier performance
    weights.distance_factor * distance_factor +
    weights.time_factor * time_factor;

  // Convert risk score to delay hours (non-linear mapping)
  let predicted_delay_hours = 0;
  if (risk_score > 7) {
    predicted_delay_hours = 2 + (risk_score - 7) * 2; // 2-8 hours
  } else if (risk_score > 5) {
    predicted_delay_hours = 0.5 + (risk_score - 5) * 0.75; // 0.5-2 hours
  } else if (risk_score > 3) {
    predicted_delay_hours = (risk_score - 3) * 0.25; // 0-0.5 hours
  }

  // Calculate confidence score based on factor consistency
  const factor_variance = calculateVariance([
    factors.route_complexity,
    factors.weather_severity,
    factors.traffic_density,
    10 - factors.carrier_performance
  ]);
  
  const confidence_score = Math.max(0.3, Math.min(0.95, 0.8 - (factor_variance / 20)));

  // Identify risk factors
  const risk_factors = [];
  if (factors.weather_severity > 6) risk_factors.push("恶劣天气");
  if (factors.traffic_density > 7) risk_factors.push("交通拥堵");
  if (factors.carrier_performance < 5) risk_factors.push("承运商表现不佳");
  if (factors.route_complexity > 7) risk_factors.push("复杂路线");
  if (time_factor > 5) risk_factors.push("高峰时段");

  // Generate recommendation
  let recommendation = "建议正常监控";
  if (predicted_delay_hours > 3) {
    recommendation = "建议立即联系承运商确认状态，考虑启用备用方案";
  } else if (predicted_delay_hours > 1) {
    recommendation = "建议加强监控，提前通知客户可能延误";
  } else if (predicted_delay_hours > 0.5) {
    recommendation = "建议密切关注运输进展";
  }

  return {
    predicted_delay_hours: Math.round(predicted_delay_hours * 100) / 100,
    confidence_score: Math.round(confidence_score * 100) / 100,
    risk_factors,
    recommendation
  };
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    if (req.method === 'POST') {
      const { order_id, factors }: DelayPredictionRequest = await req.json();

      console.log(`Processing delay prediction for order: ${order_id}`);
      
      // Run AI prediction
      const prediction = predictDelay(factors);
      
      console.log(`Prediction result:`, prediction);

      // If significant delay risk, create alert
      if (prediction.predicted_delay_hours > 0.5 && prediction.confidence_score > 0.6) {
        const alert = {
          order_id,
          alert_type: 'delay_prediction',
          severity: prediction.predicted_delay_hours > 2 ? 'high' : 'medium',
          title: `预计延误${prediction.predicted_delay_hours}小时`,
          description: `AI模型预测该订单有${Math.round(prediction.confidence_score * 100)}%概率延误${prediction.predicted_delay_hours}小时。主要风险因素：${prediction.risk_factors.join(', ')}`,
          predicted_delay_hours: prediction.predicted_delay_hours,
          confidence_score: prediction.confidence_score,
          metadata: {
            model_version: 'v1.0',
            factors: prediction.risk_factors,
            recommendation: prediction.recommendation,
            input_factors: factors
          }
        };

        const { error: alertError } = await supabaseClient
          .from('alerts')
          .insert([alert]);

        if (alertError) {
          console.error('Error creating alert:', alertError);
        } else {
          console.log('Alert created successfully');
        }
      }

      return new Response(JSON.stringify(prediction), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET request - return model status
    if (req.method === 'GET') {
      const status = {
        model_version: 'v1.0',
        status: 'active',
        supported_predictions: ['delay_prediction'],
        last_updated: new Date().toISOString()
      };

      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error in ai-alert-engine function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'AI预警引擎处理错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});