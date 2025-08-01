-- 创建API密钥管理表
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]'::jsonb,
  rate_limit INTEGER DEFAULT 1000, -- 每小时请求限制
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 创建API使用日志表
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_ip TEXT,
  request_method TEXT NOT NULL,
  request_params JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Admins can manage API keys" 
ON public.api_keys FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view API logs" 
ON public.api_usage_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 创建更新时间戳触发器
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 创建索引
CREATE INDEX idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX idx_api_usage_logs_api_key_id ON public.api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);

-- 生成示例API密钥
INSERT INTO public.api_keys (name, api_key, permissions) VALUES 
(
  '测试API密钥', 
  'sk-' || encode(gen_random_bytes(32), 'hex'),
  '["orders.read"]'::jsonb
);