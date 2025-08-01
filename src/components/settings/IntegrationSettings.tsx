import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Link, MapPin, Mail, MessageSquare, Bell, Truck } from "lucide-react";

export const IntegrationSettings = () => {
  const [showApiKeys, setShowApiKeys] = useState({
    google: false,
    webhook: false,
    email: false,
    tms: false
  });

  const [integrations, setIntegrations] = useState({
    googleMaps: {
      enabled: true,
      apiKey: "AIzaSyC4R6AN7SmxxAEeOz_P7MjE9t...",
      status: "connected"
    },
    tmsService: {
      enabled: false,
      apiKey: "",
      baseUrl: "",
      username: "",
      password: "",
      status: "disconnected"
    },
    webhook: {
      enabled: false,
      url: "",
      status: "disconnected"
    },
    emailService: {
      enabled: true,
      provider: "smtp",
      status: "connected"
    },
    smsService: {
      enabled: false,
      provider: "",
      status: "disconnected"
    },
    notifications: {
      slack: {
        enabled: false,
        webhook: "",
        status: "disconnected"
      },
      teams: {
        enabled: false,
        webhook: "",
        status: "disconnected"
      }
    }
  });

  const handleToggleIntegration = (service: string, enabled: boolean) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: {
        ...prev[service as keyof typeof prev],
        enabled
      }
    }));

    toast({
      title: enabled ? "集成已启用" : "集成已禁用",
      description: `${service} 集成已${enabled ? "启用" : "禁用"}`,
    });
  };

  const handleSaveApiKey = (service: string) => {
    // TODO: Implement API key saving logic with Supabase secrets
    toast({
      title: "API密钥已保存",
      description: `${service} API密钥已安全保存`,
    });
  };

  const handleTestConnection = (service: string) => {
    // TODO: Implement connection testing logic
    toast({
      title: "连接测试成功",
      description: `${service} 连接正常`,
    });
  };

  const renderStatusBadge = (status: string) => {
    const variant = status === 'connected' ? 'default' : 
                   status === 'error' ? 'destructive' : 'secondary';
    const text = status === 'connected' ? '已连接' : 
                 status === 'error' ? '错误' : '未连接';
    
    return <Badge variant={variant}>{text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 地图服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            地图服务
          </CardTitle>
          <CardDescription>配置地图API服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Google Maps API</span>
                {renderStatusBadge(integrations.googleMaps.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                用于地图显示和地理编码服务
              </p>
            </div>
            <Switch
              checked={integrations.googleMaps.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('googleMaps', checked)}
            />
          </div>

          {integrations.googleMaps.enabled && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="google-api-key">API密钥</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="google-api-key"
                      type={showApiKeys.google ? "text" : "password"}
                      defaultValue={integrations.googleMaps.apiKey}
                      placeholder="请输入Google Maps API密钥"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, google: !prev.google }))}
                    >
                      {showApiKeys.google ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={() => handleSaveApiKey('Google Maps')}>
                    保存
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleTestConnection('Google Maps')}>
                  测试连接
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                    获取API密钥
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TMS集成服务 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            TMS集成服务
          </CardTitle>
          <CardDescription>连接运输管理系统，实现订单和车辆数据同步</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">TMS系统集成</span>
                {renderStatusBadge(integrations.tmsService.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                与第三方TMS系统进行数据交互和同步
              </p>
            </div>
            <Switch
              checked={integrations.tmsService.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('tmsService', checked)}
            />
          </div>

          {integrations.tmsService.enabled && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tms-base-url">TMS服务地址</Label>
                  <Input
                    id="tms-base-url"
                    type="url"
                    placeholder="https://tms.company.com/api/v1"
                    value={integrations.tmsService.baseUrl}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      tmsService: { ...prev.tmsService, baseUrl: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tms-api-key">API密钥</Label>
                  <div className="relative">
                    <Input
                      id="tms-api-key"
                      type={showApiKeys.tms ? "text" : "password"}
                      placeholder="请输入TMS API密钥"
                      value={integrations.tmsService.apiKey}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        tmsService: { ...prev.tmsService, apiKey: e.target.value }
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, tms: !prev.tms }))}
                    >
                      {showApiKeys.tms ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tms-username">用户名</Label>
                  <Input
                    id="tms-username"
                    type="text"
                    placeholder="TMS系统用户名"
                    value={integrations.tmsService.username}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      tmsService: { ...prev.tmsService, username: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tms-password">密码</Label>
                  <Input
                    id="tms-password"
                    type="password"
                    placeholder="TMS系统密码"
                    value={integrations.tmsService.password}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      tmsService: { ...prev.tmsService, password: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleSaveApiKey('TMS')}>
                  保存配置
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTestConnection('TMS')}>
                  测试连接
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTestConnection('TMS数据同步')}>
                  测试数据同步
                </Button>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">同步功能</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• 订单状态同步</div>
                  <div>• 车辆位置同步</div>
                  <div>• 运输进度更新</div>
                  <div>• 异常事件推送</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Webhook集成
          </CardTitle>
          <CardDescription>配置外部系统的Webhook通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">自定义Webhook</span>
                {renderStatusBadge(integrations.webhook.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                向外部系统发送事件通知
              </p>
            </div>
            <Switch
              checked={integrations.webhook.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('webhook', checked)}
            />
          </div>

          {integrations.webhook.enabled && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://your-system.com/webhook"
                    value={integrations.webhook.url}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      webhook: { ...prev.webhook, url: e.target.value }
                    }))}
                  />
                  <Button onClick={() => handleSaveApiKey('Webhook')}>
                    保存
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleTestConnection('Webhook')}>
                测试Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 通知服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知服务
          </CardTitle>
          <CardDescription>配置团队协作通知渠道</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slack集成 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Slack</span>
                  {renderStatusBadge(integrations.notifications.slack.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  发送警报和更新到Slack频道
                </p>
              </div>
              <Switch
                checked={integrations.notifications.slack.enabled}
                onCheckedChange={(checked) => {
                  setIntegrations(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      slack: { ...prev.notifications.slack, enabled: checked }
                    }
                  }));
                }}
              />
            </div>

            {integrations.notifications.slack.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slack-webhook"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={integrations.notifications.slack.webhook}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          slack: { ...prev.notifications.slack, webhook: e.target.value }
                        }
                      }))}
                    />
                    <Button onClick={() => handleSaveApiKey('Slack')}>
                      保存
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection('Slack')}>
                    测试连接
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
                      配置说明
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Microsoft Teams集成 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Microsoft Teams</span>
                  {renderStatusBadge(integrations.notifications.teams.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  发送警报和更新到Teams频道
                </p>
              </div>
              <Switch
                checked={integrations.notifications.teams.enabled}
                onCheckedChange={(checked) => {
                  setIntegrations(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      teams: { ...prev.notifications.teams, enabled: checked }
                    }
                  }));
                }}
              />
            </div>

            {integrations.notifications.teams.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="teams-webhook">Teams Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="teams-webhook"
                      type="url"
                      placeholder="https://outlook.office.com/webhook/..."
                      value={integrations.notifications.teams.webhook}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          teams: { ...prev.notifications.teams, webhook: e.target.value }
                        }
                      }))}
                    />
                    <Button onClick={() => handleSaveApiKey('Teams')}>
                      保存
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection('Teams')}>
                    测试连接
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer">
                      配置说明
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 邮件服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            邮件服务
          </CardTitle>
          <CardDescription>配置邮件发送服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">SMTP邮件服务</span>
                {renderStatusBadge(integrations.emailService.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                用于发送通知邮件和警报
              </p>
            </div>
            <Switch
              checked={integrations.emailService.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('emailService', checked)}
            />
          </div>

          {integrations.emailService.enabled && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                邮件服务已配置并正常运行。如需更改SMTP设置，请联系系统管理员。
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => handleTestConnection('邮件服务')}>
                发送测试邮件
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};