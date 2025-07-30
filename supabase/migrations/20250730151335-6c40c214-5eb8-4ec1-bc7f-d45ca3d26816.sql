-- Create alerts table for AI-powered warnings
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('delay_prediction', 'route_deviation', 'status_anomaly', 'carrier_issue', 'weather_impact')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  predicted_delay_hours DECIMAL(5,2),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create alert rules table for configurable thresholds
CREATE TABLE public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  thresholds JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for alerts (public access for demo)
CREATE POLICY "Alerts are viewable by everyone" 
ON public.alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Alerts can be created by everyone" 
ON public.alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Alerts can be updated by everyone" 
ON public.alerts 
FOR UPDATE 
USING (true);

-- Create policies for alert rules (public access for demo)
CREATE POLICY "Alert rules are viewable by everyone" 
ON public.alert_rules 
FOR SELECT 
USING (true);

CREATE POLICY "Alert rules can be created by everyone" 
ON public.alert_rules 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Alert rules can be updated by everyone" 
ON public.alert_rules 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates on alerts
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on alert rules
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample alert rules
INSERT INTO public.alert_rules (rule_type, name, description, conditions, thresholds) VALUES
('delay_prediction', '延迟预测规则', '基于AI模型预测订单延迟风险', 
 '{"factors": ["weather", "traffic", "carrier_performance", "route_complexity"]}',
 '{"delay_hours_threshold": 2, "confidence_threshold": 0.7}'
),
('route_deviation', '路线偏离检测', '检测车辆偏离预定路线的情况', 
 '{"max_deviation_km": 5, "check_interval_minutes": 30}',
 '{"deviation_threshold_km": 5, "duration_threshold_minutes": 60}'
),
('status_anomaly', '状态更新异常', '检测订单状态长时间未更新的异常情况', 
 '{"max_idle_hours": 6, "status_transitions": ["confirmed", "in_transit"]}',
 '{"idle_threshold_hours": 6, "escalation_hours": 12}'
);

-- Insert sample alerts
INSERT INTO public.alerts (order_id, alert_type, severity, title, description, predicted_delay_hours, confidence_score, metadata) VALUES
((SELECT id FROM public.orders WHERE order_number = 'TMS2024001'), 'delay_prediction', 'high', '预计延误预警', 'AI模型预测该订单有80%概率延误2小时', 2.0, 0.80, '{"model_version": "v1.0", "factors": ["traffic_congestion", "weather"]}'),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024001'), 'route_deviation', 'medium', '路线偏离', '车辆偏离预定路线超过5公里', null, 0.95, '{"deviation_distance": 5.2, "current_location": "广州市白云区"}'),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024003'), 'status_anomaly', 'high', '状态更新异常', '订单超过6小时未更新状态', null, 1.0, '{"last_update_hours": 8, "expected_status": "in_transit"}'),
((SELECT id FROM public.orders WHERE order_number = 'TMS2024005'), 'delay_prediction', 'medium', '轻微延误风险', 'AI模型预测该订单有65%概率延误1小时', 1.0, 0.65, '{"model_version": "v1.0", "factors": ["carrier_load"]}')