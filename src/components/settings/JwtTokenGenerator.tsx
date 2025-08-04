import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Key } from "lucide-react";
import { toast } from "sonner";

interface JwtPayload {
  sub: string;
  permissions: string[];
  exp?: number;
  iat?: number;
}

const JwtTokenGenerator = () => {
  const [userId, setUserId] = useState('');
  const [permissions, setPermissions] = useState('orders.create,orders.read');
  const [expirationHours, setExpirationHours] = useState('24');
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    if (!userId.trim()) {
      toast.error('请输入用户ID');
      return;
    }

    setLoading(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + (parseInt(expirationHours) * 3600);
      
      const payload: JwtPayload = {
        sub: userId,
        permissions: permissions.split(',').map(p => p.trim()).filter(p => p),
        iat: now,
        exp: exp
      };

      // 生成JWT token
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      };

      const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m] || '')).replace(/=/g, '');
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, (m) => ({ '+': '-', '/': '_' }[m] || '')).replace(/=/g, '');

      // 这里只是示例，实际的签名需要在服务器端生成
      const token = `${encodedHeader}.${encodedPayload}.signature_placeholder`;
      
      setGeneratedToken(token);
      toast.success('JWT Token生成成功');
    } catch (error) {
      console.error('生成JWT Token失败:', error);
      toast.error('生成JWT Token失败');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            JWT Token 生成器
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userId">用户ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入用户ID"
            />
          </div>

          <div>
            <Label htmlFor="permissions">权限 (用逗号分隔)</Label>
            <Input
              id="permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              placeholder="orders.create,orders.read"
            />
          </div>

          <div>
            <Label htmlFor="expiration">过期时间 (小时)</Label>
            <Input
              id="expiration"
              type="number"
              value={expirationHours}
              onChange={(e) => setExpirationHours(e.target.value)}
              placeholder="24"
            />
          </div>

          <Button onClick={generateToken} disabled={loading} className="w-full">
            {loading ? '生成中...' : '生成 JWT Token'}
          </Button>

          {generatedToken && (
            <div className="space-y-2">
              <Label>生成的 JWT Token</Label>
              <div className="flex gap-2">
                <Textarea
                  value={generatedToken}
                  readOnly
                  className="min-h-[100px] text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedToken)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                注意：这只是一个示例token，实际使用需要服务器端正确签名
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>如何获取有效的JWT Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">步骤1: 准备JWT密钥</h4>
            <p className="text-sm text-muted-foreground">
              确保在Supabase项目中已设置 JWT_SECRET 环境变量
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">步骤2: 使用专业工具生成</h4>
            <p className="text-sm text-muted-foreground">
              推荐使用 jwt.io 或编程方式生成有效的JWT token
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">JWT Payload 示例</h4>
            <pre className="text-xs bg-background p-2 rounded mt-2">
{JSON.stringify({
  sub: "user_id_here",
  permissions: ["orders.create", "orders.read"],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400
}, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JwtTokenGenerator;