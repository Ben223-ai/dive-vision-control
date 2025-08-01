-- 将当前用户角色从 viewer 升级为 admin
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = 'a3bc83fd-fe0e-47a3-9ad1-e2f9693af4bb' AND role = 'viewer'::app_role;