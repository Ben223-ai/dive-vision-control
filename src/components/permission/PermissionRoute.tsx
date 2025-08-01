import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermission } from '@/contexts/PermissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PermissionRouteProps {
  /** 需要的权限编码 */
  permission?: string;
  /** 需要任一权限（或关系） */
  anyPermissions?: string[];
  /** 需要全部权限（且关系） */
  allPermissions?: string[];
  /** 无权限时重定向的路由 */
  redirectTo?: string;
  /** 是否显示无权限页面而不是重定向 */
  showNoPermissionPage?: boolean;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 路由权限保护组件
 * 保护整个页面/路由的访问权限
 */
export function PermissionRoute({
  permission,
  anyPermissions,
  allPermissions,
  redirectTo = '/',
  showNoPermissionPage = true,
  children
}: PermissionRouteProps) {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();
  const location = useLocation();

  // 用户未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 权限加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">正在验证权限...</p>
        </div>
      </div>
    );
  }

  // 权限检查逻辑
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAnyPermission(anyPermissions);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  }

  // 有权限，渲染子组件
  if (hasAccess) {
    return <>{children}</>;
  }

  // 无权限处理
  if (showNoPermissionPage) {
    return <NoPermissionPage redirectTo={redirectTo} />;
  }

  return <Navigate to={redirectTo} replace />;
}

interface NoPermissionPageProps {
  redirectTo: string;
}

/**
 * 无权限访问页面
 */
function NoPermissionPage({ redirectTo }: NoPermissionPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">访问受限</h1>
            <p className="text-muted-foreground">
              您没有权限访问此页面。请联系系统管理员为您分配相应权限。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
          >
            返回上一页
          </Button>
          <Button
            onClick={() => window.location.href = redirectTo}
            className="w-full"
          >
            返回首页
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            如果您认为这是错误，请联系系统管理员检查您的权限配置。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

interface ModuleGuardProps {
  /** 模块权限编码 */
  module: string;
  /** 子组件 */
  children: React.ReactNode;
  /** 无权限时的回退内容 */
  fallback?: React.ReactNode;
}

/**
 * 模块权限保护组件
 * 保护整个功能模块的访问
 */
export function ModuleGuard({ module, children, fallback }: ModuleGuardProps) {
  return (
    <PermissionRoute
      permission={module}
      showNoPermissionPage={false}
      redirectTo="/"
    >
      {children}
    </PermissionRoute>
  );
}

interface PageGuardProps {
  /** 页面权限编码 */
  page: string;
  /** 模块权限编码（可选，用于检查模块访问权限） */
  module?: string;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 页面权限保护组件
 * 保护页面级别的访问权限
 */
export function PageGuard({ page, module, children }: PageGuardProps) {
  const permissions = [];
  
  if (module) {
    permissions.push(module);
  }
  permissions.push(page);

  return (
    <PermissionRoute
      allPermissions={permissions}
      showNoPermissionPage={true}
    >
      {children}
    </PermissionRoute>
  );
}