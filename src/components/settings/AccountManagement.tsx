import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export const AccountManagement = () => {
  const [accountInfo, setAccountInfo] = useState({
    email: "user@example.com",
    plan: "professional",
    status: "active",
    memberSince: "2024-01-15",
    lastLogin: "2024-07-31 14:30",
    storage: {
      used: 2.5,
      total: 10
    },
    apiCalls: {
      used: 1250,
      total: 5000
    }
  });

  const handleEmailChange = () => {
    // TODO: Implement email change logic
    toast({
      title: "邮箱更改请求已发送",
      description: "请检查您的新邮箱以确认更改",
    });
  };

  const handleExportData = () => {
    // TODO: Implement data export logic
    toast({
      title: "数据导出已开始",
      description: "您将在完成后收到下载链接",
    });
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion logic
    toast({
      title: "账户删除请求已提交",
      description: "我们将在24小时内处理您的请求",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      {/* 账户信息 */}
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>查看您的账户基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">邮箱地址</Label>
              <p className="font-medium">{accountInfo.email}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">账户状态</Label>
              <div>
                <Badge variant={accountInfo.status === 'active' ? 'default' : 'secondary'}>
                  {accountInfo.status === 'active' ? '正常' : '已暂停'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">当前套餐</Label>
              <p className="font-medium capitalize">
                {accountInfo.plan === 'professional' ? '专业版' : 
                 accountInfo.plan === 'enterprise' ? '企业版' : '基础版'}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">注册时间</Label>
              <p className="font-medium">{accountInfo.memberSince}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">最后登录</Label>
              <p className="font-medium">{accountInfo.lastLogin}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用统计 */}
      <Card>
        <CardHeader>
          <CardTitle>使用统计</CardTitle>
          <CardDescription>查看您的资源使用情况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">存储空间</Label>
              <span className="text-sm text-muted-foreground">
                {accountInfo.storage.used}GB / {accountInfo.storage.total}GB
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(accountInfo.storage.used / accountInfo.storage.total) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">API调用次数</Label>
              <span className="text-sm text-muted-foreground">
                {accountInfo.apiCalls.used.toLocaleString()} / {accountInfo.apiCalls.total.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(accountInfo.apiCalls.used / accountInfo.apiCalls.total) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 邮箱更改 */}
      <Card>
        <CardHeader>
          <CardTitle>更改邮箱</CardTitle>
          <CardDescription>更新您的登录邮箱地址</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-email">当前邮箱</Label>
            <Input
              id="current-email"
              value={accountInfo.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email">新邮箱</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="请输入新的邮箱地址"
            />
          </div>

          <Button onClick={handleEmailChange} className="w-full">
            发送确认邮件
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
          <CardDescription>管理您的账户数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">导出数据</h4>
            <p className="text-sm text-muted-foreground">
              下载您账户中的所有数据，包括订单记录、设置信息等
            </p>
            <Button variant="outline" onClick={handleExportData}>
              导出我的数据
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-destructive">删除账户</h4>
            <p className="text-sm text-muted-foreground">
              永久删除您的账户和所有相关数据。此操作不可撤销。
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  删除账户
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除账户</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将永久删除您的账户和所有相关数据，包括：
                    <br />• 所有订单和跟踪记录
                    <br />• 个人设置和偏好
                    <br />• 上传的文件和数据
                    <br />• 团队和协作数据
                    <br /><br />
                    此操作不可撤销，请谨慎操作。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};