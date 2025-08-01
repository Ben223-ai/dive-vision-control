-- 创建预测相关的表
CREATE TABLE IF NOT EXISTS public.delivery_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  predicted_delivery TIMESTAMP WITH TIME ZONE NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  prediction_factors JSONB DEFAULT '{}',
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建模型训练数据表
CREATE TABLE IF NOT EXISTS public.prediction_training_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  features JSONB NOT NULL, -- 特征数据：距离、重量、天气、承运商等
  actual_delivery TIMESTAMP WITH TIME ZONE,
  predicted_delivery TIMESTAMP WITH TIME ZONE,
  prediction_error_hours NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.delivery_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_training_data ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Delivery predictions are viewable by everyone" 
ON public.delivery_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Delivery predictions can be created by everyone" 
ON public.delivery_predictions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Delivery predictions can be updated by everyone" 
ON public.delivery_predictions 
FOR UPDATE 
USING (true);

CREATE POLICY "Training data is viewable by everyone" 
ON public.prediction_training_data 
FOR SELECT 
USING (true);

CREATE POLICY "Training data can be created by everyone" 
ON public.prediction_training_data 
FOR INSERT 
WITH CHECK (true);

-- 创建更新时间触发器
CREATE TRIGGER update_delivery_predictions_updated_at
BEFORE UPDATE ON public.delivery_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_delivery_predictions_order_id ON public.delivery_predictions(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_predictions_created_at ON public.delivery_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_training_data_order_id ON public.prediction_training_data(order_id);
CREATE INDEX IF NOT EXISTS idx_training_data_created_at ON public.prediction_training_data(created_at);