import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, Building, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
  level: string;
  parent_id?: string;
  created_at: string;
}

interface DataPermission {
  id: string;
  name: string;
  permission_type: string;
  conditions: any;
  created_at: string;
}

const DataPermissionConfig = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [dataPermissions, setDataPermissions] = useState<DataPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // 新增部门表单
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  // 新增区域表单
  const [newRegion, setNewRegion] = useState({ name: '', code: '', level: 'city' });
  // 新增数据权限表单
  const [newDataPerm, setNewDataPerm] = useState({ 
    name: '', 
    permission_type: 'department', 
    conditions: { department_ids: [], region_ids: [], data_scope: 'own' }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 模拟获取部门数据 - 实际应该从新创建的表中获取
      const mockDepartments: Department[] = [
        { id: '1', name: '技术部', description: '负责技术开发', created_at: new Date().toISOString() },
        { id: '2', name: '销售部', description: '负责销售业务', created_at: new Date().toISOString() },
      ];

      // 模拟获取区域数据
      const mockRegions: Region[] = [
        { id: '1', name: '北京', code: 'BJ', level: 'city', created_at: new Date().toISOString() },
        { id: '2', name: '上海', code: 'SH', level: 'city', created_at: new Date().toISOString() },
      ];

      // 模拟获取数据权限配置
      const mockDataPermissions: DataPermission[] = [
        { 
          id: '1', 
          name: '部门数据权限', 
          permission_type: 'department', 
          conditions: { department_ids: ['1'], data_scope: 'department' },
          created_at: new Date().toISOString() 
        },
      ];

      setDepartments(mockDepartments);
      setRegions(mockRegions);
      setDataPermissions(mockDataPermissions);
    } catch (error) {
      console.error('获取数据权限配置失败:', error);
      toast.error('获取数据权限配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加部门
  const handleAddDepartment = async () => {
    if (!newDept.name.trim()) {
      toast.error('请输入部门名称');
      return;
    }

    // 模拟添加成功
    const newDepartment: Department = {
      id: Date.now().toString(),
      name: newDept.name,
      description: newDept.description,
      created_at: new Date().toISOString()
    };

    setDepartments(prev => [...prev, newDepartment]);
    setNewDept({ name: '', description: '' });
    toast.success('部门添加成功');
  };

  // 添加区域
  const handleAddRegion = async () => {
    if (!newRegion.name.trim() || !newRegion.code.trim()) {
      toast.error('请输入区域名称和代码');
      return;
    }

    // 模拟添加成功
    const newRegionData: Region = {
      id: Date.now().toString(),
      name: newRegion.name,
      code: newRegion.code,
      level: newRegion.level,
      created_at: new Date().toISOString()
    };

    setRegions(prev => [...prev, newRegionData]);
    setNewRegion({ name: '', code: '', level: 'city' });
    toast.success('区域添加成功');
  };

  // 添加数据权限规则
  const handleAddDataPermission = async () => {
    if (!newDataPerm.name.trim()) {
      toast.error('请输入权限规则名称');
      return;
    }

    // 模拟添加成功
    const newPermission: DataPermission = {
      id: Date.now().toString(),
      name: newDataPerm.name,
      permission_type: newDataPerm.permission_type,
      conditions: newDataPerm.conditions,
      created_at: new Date().toISOString()
    };

    setDataPermissions(prev => [...prev, newPermission]);
    setNewDataPerm({ 
      name: '', 
      permission_type: 'department', 
      conditions: { department_ids: [], region_ids: [], data_scope: 'own' }
    });
    toast.success('数据权限规则添加成功');
  };

  // 删除部门
  const handleDeleteDepartment = async (id: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== id));
    toast.success('部门删除成功');
  };

  // 删除区域
  const handleDeleteRegion = async (id: string) => {
    setRegions(prev => prev.filter(region => region.id !== id));
    toast.success('区域删除成功');
  };

  if (loading) {
    return <div className="flex justify-center p-4">加载中...</div>;
  }

  return (
    <Tabs defaultValue="departments" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="departments" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          部门管理
        </TabsTrigger>
        <TabsTrigger value="regions" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          区域管理
        </TabsTrigger>
        <TabsTrigger value="data-permissions" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          数据权限
        </TabsTrigger>
      </TabsList>

      {/* 部门管理 */}
      <TabsContent value="departments" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>部门管理</CardTitle>
            <CardDescription>
              管理组织部门结构，用于数据权限控制
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 添加部门表单 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="dept-name">部门名称</Label>
                <Input
                  id="dept-name"
                  value={newDept.name}
                  onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入部门名称"
                />
              </div>
              <div>
                <Label htmlFor="dept-desc">部门描述</Label>
                <Input
                  id="dept-desc"
                  value={newDept.description}
                  onChange={(e) => setNewDept(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入部门描述"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddDepartment} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  添加部门
                </Button>
              </div>
            </div>

            {/* 部门列表 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部门名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>{new Date(dept.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 区域管理 */}
      <TabsContent value="regions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>区域管理</CardTitle>
            <CardDescription>
              管理地理区域结构，用于数据权限控制
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 添加区域表单 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="region-name">区域名称</Label>
                <Input
                  id="region-name"
                  value={newRegion.name}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入区域名称"
                />
              </div>
              <div>
                <Label htmlFor="region-code">区域代码</Label>
                <Input
                  id="region-code"
                  value={newRegion.code}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="输入区域代码"
                />
              </div>
              <div>
                <Label htmlFor="region-level">区域级别</Label>
                <Select
                  value={newRegion.level}
                  onValueChange={(value) => setNewRegion(prev => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="country">国家</SelectItem>
                    <SelectItem value="province">省份</SelectItem>
                    <SelectItem value="city">城市</SelectItem>
                    <SelectItem value="district">区县</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddRegion} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  添加区域
                </Button>
              </div>
            </div>

            {/* 区域列表 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域名称</TableHead>
                  <TableHead>区域代码</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>{region.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {region.level === 'country' ? '国家' :
                         region.level === 'province' ? '省份' :
                         region.level === 'city' ? '城市' : '区县'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(region.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRegion(region.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 数据权限规则 */}
      <TabsContent value="data-permissions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>数据权限规则</CardTitle>
            <CardDescription>
              配置基于部门、区域和数据所有权的权限规则
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 添加权限规则表单 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="perm-name">规则名称</Label>
                <Input
                  id="perm-name"
                  value={newDataPerm.name}
                  onChange={(e) => setNewDataPerm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入权限规则名称"
                />
              </div>
              <div>
                <Label htmlFor="perm-type">权限类型</Label>
                <Select
                  value={newDataPerm.permission_type}
                  onValueChange={(value) => setNewDataPerm(prev => ({ ...prev, permission_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">部门权限</SelectItem>
                    <SelectItem value="region">区域权限</SelectItem>
                    <SelectItem value="ownership">数据所有权</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddDataPermission} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  添加规则
                </Button>
              </div>
            </div>

            {/* 权限规则列表 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>规则名称</TableHead>
                  <TableHead>权限类型</TableHead>
                  <TableHead>条件配置</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataPermissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-medium">{perm.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {perm.permission_type === 'department' ? '部门权限' :
                         perm.permission_type === 'region' ? '区域权限' : '数据所有权'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {JSON.stringify(perm.conditions)}
                      </code>
                    </TableCell>
                    <TableCell>{new Date(perm.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DataPermissionConfig;