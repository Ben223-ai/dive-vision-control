import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Shield, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  created_at: string;
  profiles?: Profile;
}

const roleLabels = {
  admin: '管理员',
  manager: '经理',
  operator: '操作员',
  viewer: '查看者'
};

const roleDescriptions = {
  admin: '拥有系统所有权限，可以管理用户、配置系统',
  manager: '可以管理订单、查看分析报告、管理团队',
  operator: '可以处理订单、更新状态、查看基本数据',
  viewer: '只能查看订单信息和基本报告'
};

const roleColors = {
  admin: 'destructive',
  manager: 'default',
  operator: 'secondary',
  viewer: 'outline'
} as const;

export default function PermissionManagement() {
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchData();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取所有用户资料
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 获取用户角色（简化查询避免外键问题）
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // 手动关联用户资料数据
      const rolesWithProfiles = rolesData?.map(role => {
        const profile = profilesData?.find(p => p.id === role.user_id);
        return {
          ...role,
          profiles: profile
        };
      }) || [];

      setProfiles(profilesData || []);
      setUserRoles(rolesWithProfiles);
    } catch (error: any) {
      console.error('获取数据失败:', error);
      setError(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: '请选择用户和角色',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole as 'admin' | 'manager' | 'operator' | 'viewer',
          created_by: currentUser?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: '该用户已有此角色',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: '角色分配成功',
          description: '用户角色已更新'
        });
        setSelectedUser('');
        setSelectedRole('');
        fetchData();
      }
    } catch (error: any) {
      console.error('分配角色失败:', error);
      toast({
        title: '分配角色失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: '角色移除成功',
        description: '用户角色已更新'
      });
      fetchData();
    } catch (error: any) {
      console.error('移除角色失败:', error);
      toast({
        title: '移除角色失败',
        description: error.message,
        variant: 'destructive'
      });
    }
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
      {/* 角色说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            角色权限说明
          </CardTitle>
          <CardDescription>
            系统中不同角色的权限范围
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge variant={roleColors[role as keyof typeof roleColors]}>
                  {label}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {roleDescriptions[role as keyof typeof roleDescriptions]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 分配角色 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            分配用户角色
          </CardTitle>
          <CardDescription>
            为用户分配系统角色
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
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
            </div>
            <div className="flex-1">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
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
            </div>
            <Button onClick={handleAddRole} disabled={!selectedUser || !selectedRole}>
              <Plus className="h-4 w-4 mr-2" />
              分配角色
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 用户角色列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户角色管理
          </CardTitle>
          <CardDescription>
            查看和管理所有用户的角色分配
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无用户角色数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>分配时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {userRole.profiles?.display_name || userRole.profiles?.username || '未知用户'}
                        </div>
                        {userRole.profiles?.username && userRole.profiles?.display_name && (
                          <div className="text-sm text-muted-foreground">
                            @{userRole.profiles.username}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleColors[userRole.role]}>
                        {roleLabels[userRole.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}