import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, Shield, Users, Settings, ChevronDown, ChevronRight, 
  Layers, FileText, MousePointer, Wrench, AlertCircle, Save, RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'module' | 'page' | 'action' | 'button';
  module: string;
  sort_order: number;
  is_active: boolean;
}

interface RolePermission {
  id: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  permission_id: string;
  granted: boolean;
}

interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  expires_at?: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
}

const roleLabels = {
  admin: '管理员',
  manager: '经理',
  operator: '操作员',
  viewer: '查看者'
};

const typeIcons = {
  module: Layers,
  page: FileText,
  action: Wrench,
  button: MousePointer
};

const typeLabels = {
  module: '模块',
  page: '页面',
  action: '操作',
  button: '按钮'
};

const typeColors = {
  module: 'default',
  page: 'secondary',
  action: 'outline',
  button: 'destructive'
} as const;

export default function AdvancedPermissionConfig() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取所有权限
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('sort_order');

      if (permissionsError) throw permissionsError;

      // 获取角色权限
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermissionsError) throw rolePermissionsError;

      // 获取用户权限
      const { data: userPermissionsData, error: userPermissionsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (userPermissionsError) throw userPermissionsError;

      // 获取用户资料
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setPermissions(permissionsData || []);
      setRolePermissions(rolePermissionsData || []);
      setUserPermissions(userPermissionsData || []);
      setProfiles(profilesData || []);

      // 默认展开所有模块
      const modules = new Set(permissionsData?.map(p => p.module) || []);
      setExpandedModules(modules);
    } catch (error: any) {
      console.error('获取数据失败:', error);
      setError(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 按模块分组权限
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.module;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // 检查角色是否有某权限
  const hasRolePermission = (role: string, permissionId: string) => {
    const rolePermission = rolePermissions.find(
      rp => rp.role === role && rp.permission_id === permissionId
    );
    return rolePermission?.granted || false;
  };

  // 检查用户是否有某权限
  const hasUserPermission = (userId: string, permissionId: string) => {
    const userPermission = userPermissions.find(
      up => up.user_id === userId && up.permission_id === permissionId
    );
    return userPermission?.granted;
  };

  // 切换角色权限
  const toggleRolePermission = async (role: string, permissionId: string, granted: boolean) => {
    try {
      const existingPermission = rolePermissions.find(
        rp => rp.role === role && rp.permission_id === permissionId
      );

      if (existingPermission) {
        const { error } = await supabase
          .from('role_permissions')
          .update({ granted })
          .eq('id', existingPermission.id);

        if (error) throw error;

        setRolePermissions(prev => 
          prev.map(rp => 
            rp.id === existingPermission.id ? { ...rp, granted } : rp
          )
        );
      } else {
        const { data, error } = await supabase
          .from('role_permissions')
          .insert({
            role: role as any,
            permission_id: permissionId,
            granted
          })
          .select()
          .single();

        if (error) throw error;

        setRolePermissions(prev => [...prev, data]);
      }

      setHasChanges(true);
      toast({
        title: '权限已更新',
        description: `${roleLabels[role as keyof typeof roleLabels]}权限已更新`,
      });
    } catch (error: any) {
      console.error('更新权限失败:', error);
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 切换用户权限
  const toggleUserPermission = async (userId: string, permissionId: string, granted: boolean | null) => {
    try {
      const existingPermission = userPermissions.find(
        up => up.user_id === userId && up.permission_id === permissionId
      );

      if (granted === null) {
        // 删除用户特殊权限，使用角色权限
        if (existingPermission) {
          const { error } = await supabase
            .from('user_permissions')
            .delete()
            .eq('id', existingPermission.id);

          if (error) throw error;

          setUserPermissions(prev => 
            prev.filter(up => up.id !== existingPermission.id)
          );
        }
      } else {
        if (existingPermission) {
          const { error } = await supabase
            .from('user_permissions')
            .update({ granted })
            .eq('id', existingPermission.id);

          if (error) throw error;

          setUserPermissions(prev => 
            prev.map(up => 
              up.id === existingPermission.id ? { ...up, granted } : up
            )
          );
        } else {
          const { data, error } = await supabase
            .from('user_permissions')
            .insert({
              user_id: userId,
              permission_id: permissionId,
              granted
            })
            .select()
            .single();

          if (error) throw error;

          setUserPermissions(prev => [...prev, data]);
        }
      }

      setHasChanges(true);
      toast({
        title: '用户权限已更新',
        description: '用户特殊权限已更新',
      });
    } catch (error: any) {
      console.error('更新用户权限失败:', error);
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 切换模块展开状态
  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                className="ml-2"
              >
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            权限配置管理
          </CardTitle>
          <CardDescription>
            管理系统角色和用户的细粒度权限配置
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">角色权限</TabsTrigger>
          <TabsTrigger value="users">用户权限</TabsTrigger>
          <TabsTrigger value="permissions">权限列表</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                角色权限配置
              </CardTitle>
              <CardDescription>
                为不同角色配置模块、页面、操作和按钮级别的权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <SelectItem key={role} value={role}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasChanges && (
                    <Badge variant="secondary">
                      有未保存的更改
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                    const modulePermission = modulePermissions.find(p => p.type === 'module');
                    const isExpanded = expandedModules.has(module);
                    
                    return (
                      <Card key={module} className="border">
                        <Collapsible open={isExpanded} onOpenChange={() => toggleModule(module)}>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <Layers className="h-5 w-5" />
                                  <div>
                                    <h4 className="font-semibold">{modulePermission?.name || module}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {modulePermission?.description}
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={modulePermission ? hasRolePermission(selectedRole, modulePermission.id) : false}
                                  onCheckedChange={(checked) => {
                                    if (modulePermission) {
                                      toggleRolePermission(selectedRole, modulePermission.id, checked);
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="grid gap-3">
                                {modulePermissions
                                  .filter(p => p.type !== 'module')
                                  .map((permission) => {
                                    const Icon = typeIcons[permission.type];
                                    const isGranted = hasRolePermission(selectedRole, permission.id);
                                    
                                    return (
                                      <div
                                        key={permission.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon className="h-4 w-4" />
                                          <div className="flex items-center gap-2">
                                            <Badge variant={typeColors[permission.type]}>
                                              {typeLabels[permission.type]}
                                            </Badge>
                                            <span className="font-medium">{permission.name}</span>
                                          </div>
                                          {permission.description && (
                                            <span className="text-sm text-muted-foreground">
                                              - {permission.description}
                                            </span>
                                          )}
                                        </div>
                                        <Switch
                                          checked={isGranted}
                                          onCheckedChange={(checked) => 
                                            toggleRolePermission(selectedRole, permission.id, checked)
                                          }
                                        />
                                      </div>
                                    );
                                  })}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户特殊权限
              </CardTitle>
              <CardDescription>
                为特定用户配置覆盖角色权限的特殊权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="选择用户" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name || profile.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedUser && (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                      const isExpanded = expandedModules.has(module);
                      
                      return (
                        <Card key={module} className="border">
                          <Collapsible open={isExpanded} onOpenChange={() => toggleModule(module)}>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <Layers className="h-5 w-5" />
                                  <span className="font-semibold">{module}</span>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="grid gap-3">
                                  {modulePermissions.map((permission) => {
                                    const Icon = typeIcons[permission.type];
                                    const userPerm = hasUserPermission(selectedUser, permission.id);
                                    const rolePerm = hasRolePermission(selectedRole, permission.id);
                                    
                                    return (
                                      <div
                                        key={permission.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon className="h-4 w-4" />
                                          <Badge variant={typeColors[permission.type]}>
                                            {typeLabels[permission.type]}
                                          </Badge>
                                          <span className="font-medium">{permission.name}</span>
                                          <span className="text-sm text-muted-foreground">
                                            (角色默认: {rolePerm ? '允许' : '禁止'})
                                          </span>
                                        </div>
                                        <Select
                                          value={
                                            userPerm === undefined ? 'inherit' : 
                                            userPerm ? 'allow' : 'deny'
                                          }
                                          onValueChange={(value) => {
                                            const granted = value === 'inherit' ? null : value === 'allow';
                                            toggleUserPermission(selectedUser, permission.id, granted);
                                          }}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="inherit">继承角色</SelectItem>
                                            <SelectItem value="allow">允许</SelectItem>
                                            <SelectItem value="deny">禁止</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>权限列表</CardTitle>
              <CardDescription>
                查看系统中所有可用的权限项
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>权限编码</TableHead>
                    <TableHead>权限名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>模块</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => {
                    const Icon = typeIcons[permission.type];
                    
                    return (
                      <TableRow key={permission.id}>
                        <TableCell className="font-mono text-xs">
                          {permission.code}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {permission.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeColors[permission.type]}>
                            {typeLabels[permission.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{permission.module}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {permission.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                            {permission.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}