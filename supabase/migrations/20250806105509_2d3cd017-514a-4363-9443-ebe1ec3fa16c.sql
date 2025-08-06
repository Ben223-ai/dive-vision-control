-- 创建测试用户账号 (需要通过 Supabase Auth 注册)
-- 由于不能直接插入到 auth.users 表，我们先创建一个说明文档

-- 创建测试数据表来存储初始用户信息
CREATE TABLE IF NOT EXISTS public.initial_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  brand_access TEXT[] NOT NULL,
  role TEXT NOT NULL DEFAULT 'brand_user',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 插入测试用户信息
INSERT INTO public.initial_users (email, password, brand_access, role, notes)
VALUES 
  ('hennessy@test.com', 'Hennessy123!', ARRAY['hennessy'], 'brand_user', '轩尼诗品牌测试账号'),
  ('lv@test.com', 'LouisVuitton123!', ARRAY['louis-vuitton'], 'brand_user', '路易威登品牌测试账号'),
  ('moet@test.com', 'MoetChandon123!', ARRAY['moet-chandon'], 'brand_user', '酩悦香槟品牌测试账号'),
  ('tagheuer@test.com', 'TagHeuer123!', ARRAY['tag-heuer'], 'brand_user', '豪雅表品牌测试账号'),
  ('admin@test.com', 'Admin123!', ARRAY['hennessy', 'louis-vuitton', 'moet-chandon', 'tag-heuer'], 'admin', '管理员账号，可访问所有品牌');

-- 启用行级安全
ALTER TABLE public.initial_users ENABLE ROW LEVEL SECURITY;

-- 创建查看权限策略（仅管理员可查看）
CREATE POLICY "Admin can view initial users" 
ON public.initial_users 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));