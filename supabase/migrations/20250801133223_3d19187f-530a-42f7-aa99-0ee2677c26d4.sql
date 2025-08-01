-- 创建权限资源类型枚举
CREATE TYPE public.permission_type AS ENUM ('module', 'page', 'action', 'button');

-- 创建权限资源表
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 权限编码，如 'orders.view', 'orders.create', 'orders.delete.button'
  name TEXT NOT NULL, -- 权限名称
  description TEXT, -- 权限描述
  type permission_type NOT NULL, -- 权限类型
  parent_id UUID REFERENCES public.permissions(id), -- 父权限ID，用于构建权限树
  module TEXT, -- 所属模块
  resource TEXT, -- 资源标识
  sort_order INTEGER DEFAULT 0, -- 排序
  is_active BOOLEAN DEFAULT true, -- 是否启用
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建角色权限映射表
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true, -- 是否授予权限
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(role, permission_id)
);

-- 创建用户权限映射表（用于特殊权限覆盖）
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true, -- 是否授予权限
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE, -- 权限过期时间
  UNIQUE(user_id, permission_id)
);

-- 启用RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 权限表RLS策略
CREATE POLICY "Permissions are viewable by everyone" 
ON public.permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage permissions" 
ON public.permissions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 角色权限RLS策略
CREATE POLICY "Role permissions are viewable by everyone" 
ON public.role_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 用户权限RLS策略
CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user permissions" 
ON public.user_permissions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 创建权限检查函数
CREATE OR REPLACE FUNCTION public.check_permission(_user_id UUID, _permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- 首先检查用户特殊权限
  WITH user_perm AS (
    SELECT up.granted
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = _user_id 
      AND p.code = _permission_code
      AND (up.expires_at IS NULL OR up.expires_at > now())
    LIMIT 1
  ),
  -- 然后检查角色权限
  role_perm AS (
    SELECT rp.granted
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id 
      AND p.code = _permission_code
      AND p.is_active = true
    LIMIT 1
  )
  -- 用户权限优先于角色权限
  SELECT COALESCE(
    (SELECT granted FROM user_perm),
    (SELECT granted FROM role_perm),
    false
  );
$$;

-- 创建获取用户权限列表函数
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(
  permission_code TEXT,
  permission_name TEXT,
  permission_type permission_type,
  module TEXT,
  granted BOOLEAN,
  source TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  -- 获取用户的所有权限（角色权限 + 用户特殊权限）
  WITH role_permissions AS (
    SELECT 
      p.code,
      p.name,
      p.type,
      p.module,
      rp.granted,
      'role' as source
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id 
      AND p.is_active = true
  ),
  user_permissions AS (
    SELECT 
      p.code,
      p.name,
      p.type,
      p.module,
      up.granted,
      'user' as source
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = _user_id
      AND (up.expires_at IS NULL OR up.expires_at > now())
      AND p.is_active = true
  )
  -- 合并权限，用户权限优先
  SELECT DISTINCT ON (code)
    code as permission_code,
    name as permission_name,
    type as permission_type,
    module,
    granted,
    source
  FROM (
    SELECT * FROM user_permissions
    UNION ALL
    SELECT * FROM role_permissions
  ) combined
  ORDER BY code, source DESC; -- user权限在前，优先级更高
$$;

-- 创建更新时间戳触发器
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 插入基础权限数据
INSERT INTO public.permissions (code, name, description, type, module, sort_order) VALUES
-- 订单模块
('orders', '订单管理', '订单管理模块访问权限', 'module', 'orders', 100),
('orders.view', '查看订单', '查看订单列表和详情', 'page', 'orders', 101),
('orders.create', '创建订单', '创建新订单', 'action', 'orders', 102),
('orders.edit', '编辑订单', '编辑订单信息', 'action', 'orders', 103),
('orders.delete', '删除订单', '删除订单', 'action', 'orders', 104),
('orders.export', '导出订单', '导出订单数据', 'button', 'orders', 105),
('orders.tracking', 'TMS查询', 'TMS订单查询功能', 'page', 'orders', 106),

-- 告警模块
('alerts', '告警管理', '告警管理模块访问权限', 'module', 'alerts', 200),
('alerts.view', '查看告警', '查看告警列表和详情', 'page', 'alerts', 201),
('alerts.manage', '管理告警', '确认、解决告警', 'action', 'alerts', 202),
('alerts.rules', '告警规则', '管理告警规则配置', 'page', 'alerts', 203),

-- 分析模块
('analytics', '数据分析', '数据分析模块访问权限', 'module', 'analytics', 300),
('analytics.view', '查看分析', '查看分析报表', 'page', 'analytics', 301),
('analytics.export', '导出报表', '导出分析报表', 'button', 'analytics', 302),

-- 地图模块
('map', '实时地图', '实时地图模块访问权限', 'module', 'map', 400),
('map.view', '查看地图', '查看实时地图', 'page', 'map', 401),

-- 沟通模块
('communication', '团队沟通', '团队沟通模块访问权限', 'module', 'communication', 500),
('communication.chat', '聊天', '团队聊天功能', 'page', 'communication', 501),
('communication.tasks', '任务管理', '任务管理功能', 'page', 'communication', 502),
('communication.issues', '问题跟踪', '问题跟踪功能', 'page', 'communication', 503),

-- 设置模块
('settings', '系统设置', '系统设置模块访问权限', 'module', 'settings', 600),
('settings.profile', '个人资料', '个人资料设置', 'page', 'settings', 601),
('settings.system', '系统配置', '系统配置管理', 'page', 'settings', 602),
('settings.integrations', '集成设置', '第三方集成设置', 'page', 'settings', 603),
('settings.permissions', '权限管理', '用户权限管理', 'page', 'settings', 604);

-- 为现有角色分配默认权限
-- 管理员：全部权限
INSERT INTO public.role_permissions (role, permission_id, granted) 
SELECT 'admin', id, true FROM public.permissions;

-- 经理：大部分权限，不包括系统配置和权限管理
INSERT INTO public.role_permissions (role, permission_id, granted) 
SELECT 'manager', id, true FROM public.permissions 
WHERE code NOT IN ('settings.system', 'settings.permissions');

-- 操作员：基本操作权限
INSERT INTO public.role_permissions (role, permission_id, granted) 
SELECT 'operator', id, true FROM public.permissions 
WHERE code IN (
  'orders', 'orders.view', 'orders.edit', 'orders.tracking',
  'alerts', 'alerts.view', 'alerts.manage',
  'map', 'map.view',
  'communication', 'communication.chat', 'communication.tasks',
  'settings', 'settings.profile'
);

-- 查看者：只读权限
INSERT INTO public.role_permissions (role, permission_id, granted) 
SELECT 'viewer', id, true FROM public.permissions 
WHERE code IN (
  'orders', 'orders.view', 'orders.tracking',
  'alerts', 'alerts.view', 
  'analytics', 'analytics.view',
  'map', 'map.view',
  'settings', 'settings.profile'
);