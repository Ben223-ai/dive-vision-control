import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@/components/settings/UserProfile";
import { AppPreferences } from "@/components/settings/AppPreferences";
import { SystemConfig } from "@/components/settings/SystemConfig";
import { AccountManagement } from "@/components/settings/AccountManagement";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import PermissionManagement from "@/components/settings/PermissionManagement";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
        <p className="text-muted-foreground">
          管理您的账户、偏好设置和系统配置
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile">用户资料</TabsTrigger>
          <TabsTrigger value="preferences">应用偏好</TabsTrigger>
          <TabsTrigger value="system">系统配置</TabsTrigger>
          <TabsTrigger value="account">账户管理</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="permissions">权限管理</TabsTrigger>
          <TabsTrigger value="integrations">集成设置</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户资料设置</CardTitle>
              <CardDescription>
                管理您的个人信息和资料设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfile />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>应用偏好设置</CardTitle>
              <CardDescription>
                自定义您的应用体验，包括语言、主题和通知设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppPreferences />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统配置</CardTitle>
              <CardDescription>
                配置API设置、默认值和系统参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>账户管理</CardTitle>
              <CardDescription>
                管理您的账户信息和账户设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>
                管理您的密码、两步验证和安全选项
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionManagement />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>集成设置</CardTitle>
              <CardDescription>
                配置第三方服务和API集成
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;