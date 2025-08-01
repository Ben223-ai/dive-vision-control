-- 修改订单表的RLS策略，允许用户创建和更新订单
DROP POLICY IF EXISTS "Orders are publicly viewable" ON public.orders;

-- 创建新的RLS策略
CREATE POLICY "Orders are viewable by everyone" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- 确保orders表启用了RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;