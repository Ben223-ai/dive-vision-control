import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  permissions: string[];
  rate_limit: number;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

const ApiManagement = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data || []).map(key => ({
        ...key,
        permissions: Array.isArray(key.permissions) 
          ? (key.permissions as string[])
          : typeof key.permissions === 'string' 
            ? [key.permissions as string]
            : [],
        is_active: key.is_active ?? true,
        rate_limit: key.rate_limit ?? 1000
      })));
    } catch (error) {
      console.error('加载API密钥失败:', error);
      toast.error('加载API密钥失败');
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('请输入API密钥名称');
      return;
    }

    setLoading(true);
    try {
      // 生成随机API密钥
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const apiKey = 'sk-' + Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from('api_keys')
        .insert([{
          name: newKeyName,
          api_key: apiKey,
          permissions: ['orders.create', 'orders.read'],
          rate_limit: 1000
        }]);

      if (error) throw error;

      toast.success('API密钥创建成功');
      setNewKeyName('');
      loadApiKeys();
    } catch (error) {
      console.error('创建API密钥失败:', error);
      toast.error('创建API密钥失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('API密钥已删除');
      loadApiKeys();
    } catch (error) {
      console.error('删除API密钥失败:', error);
      toast.error('删除API密钥失败');
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const maskedApiKey = (key: string) => {
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* 创建新密钥 */}
      <Card>
        <CardHeader>
          <CardTitle>创建API密钥</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyName">密钥名称</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="输入API密钥名称"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateApiKey} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {loading ? '创建中...' : '创建密钥'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 密钥列表 */}
      <Card>
        <CardHeader>
          <CardTitle>API密钥列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>API密钥</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>限制</TableHead>
                <TableHead>最后使用</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">
                        {showApiKey[key.id] ? key.api_key : maskedApiKey(key.api_key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(key.id)}
                      >
                        {showApiKey[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.api_key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {key.permissions.map(perm => (
                        <Badge key={perm} variant="secondary">{perm}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.is_active ? "default" : "secondary"}>
                      {key.is_active ? '活跃' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>{key.rate_limit}/小时</TableCell>
                  <TableCell>
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : '从未使用'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {apiKeys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无API密钥，点击创建密钥开始使用
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API文档 */}
      <Card>
        <CardHeader>
          <CardTitle>API使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">创建订单API</h4>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>端点:</strong> <code>POST https://dvrnufiqmqcziqpnehyz.supabase.co/functions/v1/create-order-api</code></p>
                <p><strong>请求头:</strong> <code>x-api-key: your_api_key_here</code></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">示例请求</h4>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`curl -X POST https://dvrnufiqmqcziqpnehyz.supabase.co/functions/v1/create-order-api \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your_api_key_here" \\
  -d '{
    "customer_name": "张三",
    "origin": "北京市朝阳区",
    "destination": "上海市浦东新区",
    "order_items": [{
      "item_name": "手机",
      "quantity": 2,
      "unit_price": 3000
    }]
  }'`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiManagement;