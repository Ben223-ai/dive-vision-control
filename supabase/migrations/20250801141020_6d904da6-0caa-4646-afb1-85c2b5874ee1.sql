-- 创建表单模板表
CREATE TABLE public.form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'order_create',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建表单字段配置表
CREATE TABLE public.form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, select, textarea, date, checkbox, etc.
  field_options JSONB, -- 存储选项、验证规则等配置
  is_required BOOLEAN DEFAULT false,
  is_encrypted BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  grid_column_span INTEGER DEFAULT 1, -- 网格布局列跨度
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建模板角色绑定表
CREATE TABLE public.template_role_bindings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  role app_role NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建模板用户绑定表
CREATE TABLE public.template_user_bindings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_role_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_user_bindings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Form templates are viewable by everyone" 
ON public.form_templates FOR SELECT USING (true);

CREATE POLICY "Form templates can be managed by admins" 
ON public.form_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Form fields are viewable by everyone" 
ON public.form_fields FOR SELECT USING (true);

CREATE POLICY "Form fields can be managed by admins" 
ON public.form_fields FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Template role bindings are viewable by everyone" 
ON public.template_role_bindings FOR SELECT USING (true);

CREATE POLICY "Template role bindings can be managed by admins" 
ON public.template_role_bindings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Template user bindings are viewable by everyone" 
ON public.template_user_bindings FOR SELECT USING (true);

CREATE POLICY "Template user bindings can be managed by admins" 
ON public.template_user_bindings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 创建更新时间戳触发器
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
  BEFORE UPDATE ON public.form_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 创建索引
CREATE INDEX idx_form_fields_template_id ON public.form_fields(template_id);
CREATE INDEX idx_form_fields_sort_order ON public.form_fields(template_id, sort_order);
CREATE INDEX idx_template_role_bindings_template_id ON public.template_role_bindings(template_id);
CREATE INDEX idx_template_user_bindings_template_id ON public.template_user_bindings(template_id);

-- 插入默认模板
INSERT INTO public.form_templates (name, description, template_type, is_default) VALUES 
('默认订单创建模板', '系统默认的订单创建表单模板', 'order_create', true);

-- 获取刚插入的模板ID
DO $$
DECLARE
    template_uuid UUID;
BEGIN
    SELECT id INTO template_uuid FROM public.form_templates WHERE name = '默认订单创建模板';
    
    -- 插入默认字段配置
    INSERT INTO public.form_fields (template_id, field_name, field_label, field_type, is_required, sort_order, grid_column_span) VALUES
    (template_uuid, 'order_number', '订单号', 'text', false, 1, 1),
    (template_uuid, 'customer_name', '客户名称', 'text', true, 2, 1),
    (template_uuid, 'origin', '起点地址', 'text', true, 3, 1),
    (template_uuid, 'destination', '终点地址', 'text', true, 4, 1),
    (template_uuid, 'carrier', '承运商', 'select', true, 5, 1),
    (template_uuid, 'estimated_delivery', '预计送达时间', 'date', false, 6, 1),
    (template_uuid, 'weight', '重量(kg)', 'number', false, 7, 1),
    (template_uuid, 'volume', '体积(m³)', 'number', false, 8, 1);

    -- 为承运商字段设置选项
    UPDATE public.form_fields 
    SET field_options = '{"options": ["顺丰速运", "中通快递", "圆通速递", "申通快递", "韵达速递", "德邦物流", "安能物流", "其他"]}'::jsonb
    WHERE template_id = template_uuid AND field_name = 'carrier';
END $$;