import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Smartphone, Key } from "lucide-react";

export const SecuritySettings = () => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: true,
    ipRestriction: false,
    deviceTrust: true
  });

  const [loginSessions] = useState([
    {
      id: 1,
      device: "Chrome on Windows",
      location: "北京, 中国",
      lastActive: "5分钟前",
      current: true,
      ip: "192.168.1.100"
    },
    {
      id: 2,
      device: "Safari on iPhone",
      location: "上海, 中国",
      lastActive: "2小时前",
      current: false,
      ip: "192.168.1.101"
    },
    {
      id: 3,
      device: "Firefox on Mac",
      location: "深圳, 中国",
      lastActive: "1天前",
      current: false,
      ip: "192.168.1.102"
    }
  ]);

  const handlePasswordChange = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: "密码不匹配",
        description: "新密码和确认密码不一致",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement password change logic
    toast({
      title: "密码已更新",
      description: "您的密码已成功更改",
    });

    setPasswordForm({ current: "", new: "", confirm: "" });
  };

  const handleEnable2FA = () => {
    // TODO: Implement 2FA setup logic
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
    toast({
      title: securitySettings.twoFactorEnabled ? "两步验证已禁用" : "两步验证已启用",
      description: securitySettings.twoFactorEnabled 
        ? "您的账户安全性已降低" 
        : "您的账户安全性已提升",
    });
  };

  const handleRevokeSession = (sessionId: number) => {
    // TODO: Implement session revocation logic
    toast({
      title: "会话已撤销",
      description: "该设备的登录会话已被终止",
    });
  };

  const handleRevokeAllSessions = () => {
    // TODO: Implement revoke all sessions logic
    toast({
      title: "所有会话已撤销",
      description: "除当前设备外，所有其他设备的登录会话已被终止",
    });
  };

  return (
    <div className="space-y-6">
      {/* 密码管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            密码管理
          </CardTitle>
          <CardDescription>更改您的登录密码</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">当前密码</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                placeholder="请输入当前密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                placeholder="请输入新密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认新密码</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="请再次输入新密码"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button onClick={handlePasswordChange} className="w-full">
            更新密码
          </Button>
        </CardContent>
      </Card>

      {/* 两步验证 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            两步验证
          </CardTitle>
          <CardDescription>
            为您的账户添加额外的安全层
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">身份验证器应用</span>
                {securitySettings.twoFactorEnabled && (
                  <Badge variant="default">已启用</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                使用身份验证器应用生成验证码
              </p>
            </div>
            <Button 
              variant={securitySettings.twoFactorEnabled ? "outline" : "default"}
              onClick={handleEnable2FA}
            >
              {securitySettings.twoFactorEnabled ? "禁用" : "启用"}
            </Button>
          </div>

          {securitySettings.twoFactorEnabled && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>重要：</strong> 请保存您的备份代码，以便在无法访问身份验证器时恢复账户。
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                查看备份代码
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 安全选项 */}
      <Card>
        <CardHeader>
          <CardTitle>安全选项</CardTitle>
          <CardDescription>配置额外的安全设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="login-notifications">登录通知</Label>
              <p className="text-sm text-muted-foreground">新设备登录时接收邮件通知</p>
            </div>
            <Switch
              id="login-notifications"
              checked={securitySettings.loginNotifications}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="session-timeout">自动登出</Label>
              <p className="text-sm text-muted-foreground">长时间不活动时自动登出</p>
            </div>
            <Switch
              id="session-timeout"
              checked={securitySettings.sessionTimeout}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, sessionTimeout: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ip-restriction">IP地址限制</Label>
              <p className="text-sm text-muted-foreground">限制特定IP地址访问</p>
            </div>
            <Switch
              id="ip-restriction"
              checked={securitySettings.ipRestriction}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, ipRestriction: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="device-trust">设备信任</Label>
              <p className="text-sm text-muted-foreground">记住受信任的设备</p>
            </div>
            <Switch
              id="device-trust"
              checked={securitySettings.deviceTrust}
              onCheckedChange={(checked) =>
                setSecuritySettings(prev => ({ ...prev, deviceTrust: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 活动会话 */}
      <Card>
        <CardHeader>
          <CardTitle>活动会话</CardTitle>
          <CardDescription>管理您的登录会话</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {loginSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.device}</span>
                    {session.current && (
                      <Badge variant="default" className="text-xs">当前设备</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.location} • {session.ip}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    最后活动: {session.lastActive}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    撤销
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              撤销所有其他设备的登录会话
            </p>
            <Button variant="outline" onClick={handleRevokeAllSessions}>
              撤销所有会话
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};