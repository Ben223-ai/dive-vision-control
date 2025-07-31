import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export const AppPreferences = () => {
  const [preferences, setPreferences] = useState({
    language: "zh-CN",
    theme: "system",
    timezone: "Asia/Shanghai",
    dateFormat: "YYYY-MM-DD",
    notifications: {
      email: true,
      push: true,
      sms: false,
      alerts: true,
      updates: true,
      marketing: false
    }
  });

  const handleSave = () => {
    // TODO: Implement preferences save logic
    toast({
      title: "偏好设置已保存",
      description: "您的应用偏好设置已成功更新",
    });
  };

  return (
    <div className="space-y-6">
      {/* 语言和地区设置 */}
      <Card>
        <CardHeader>
          <CardTitle>语言和地区</CardTitle>
          <CardDescription>设置您的显示语言和地区偏好</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>显示语言</Label>
              <Select value={preferences.language} onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, language: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">简体中文</SelectItem>
                  <SelectItem value="zh-TW">繁體中文</SelectItem>
                  <SelectItem value="en-US">English</SelectItem>
                  <SelectItem value="ja-JP">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>时区</Label>
              <Select value={preferences.timezone} onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, timezone: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">东京时间 (UTC+9)</SelectItem>
                  <SelectItem value="America/New_York">纽约时间 (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">伦敦时间 (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>主题</Label>
              <Select value={preferences.theme} onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, theme: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色主题</SelectItem>
                  <SelectItem value="dark">深色主题</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>日期格式</Label>
              <Select value={preferences.dateFormat} onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, dateFormat: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                  <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                  <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                  <SelectItem value="DD-MM-YYYY">15-01-2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle>通知设置</CardTitle>
          <CardDescription>管理您希望接收的通知类型</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">邮件通知</Label>
                <p className="text-sm text-muted-foreground">通过邮件接收重要通知</p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.notifications.email}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">推送通知</Label>
                <p className="text-sm text-muted-foreground">浏览器推送通知</p>
              </div>
              <Switch
                id="push-notifications"
                checked={preferences.notifications.push}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">短信通知</Label>
                <p className="text-sm text-muted-foreground">紧急情况下的短信通知</p>
              </div>
              <Switch
                id="sms-notifications"
                checked={preferences.notifications.sms}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alert-notifications">系统警报</Label>
                <p className="text-sm text-muted-foreground">运输异常和系统警报</p>
              </div>
              <Switch
                id="alert-notifications"
                checked={preferences.notifications.alerts}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, alerts: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="update-notifications">系统更新</Label>
                <p className="text-sm text-muted-foreground">新功能和系统更新通知</p>
              </div>
              <Switch
                id="update-notifications"
                checked={preferences.notifications.updates}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, updates: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-notifications">营销信息</Label>
                <p className="text-sm text-muted-foreground">产品推广和营销信息</p>
              </div>
              <Switch
                id="marketing-notifications"
                checked={preferences.notifications.marketing}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, marketing: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          保存设置
        </Button>
      </div>
    </div>
  );
};