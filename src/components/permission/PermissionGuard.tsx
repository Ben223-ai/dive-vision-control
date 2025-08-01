import React from 'react';
import { usePermission } from '@/contexts/PermissionContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';

interface PermissionGuardProps {
  /** 需要的权限编码 */
  permission?: string;
  /** 需要任一权限（或关系） */
  anyPermissions?: string[];
  /** 需要全部权限（且关系） */
  allPermissions?: string[];
  /** 无权限时显示的内容 */
  fallback?: React.ReactNode;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否显示无权限提示 */
  showNoPermission?: boolean;
  /** 自定义无权限提示内容 */
  noPermissionMessage?: string;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 权限保护组件
 * 根据用户权限决定是否渲染子组件
 */
export function PermissionGuard({
  permission,
  anyPermissions,
  allPermissions,
  fallback,
  showLoading = true,
  showNoPermission = false,
  noPermissionMessage = '您没有权限访问此功能',
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  // 加载中状态
  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">检查权限中...</span>
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

  // 无权限处理
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showNoPermission) {
      return (
        <Alert className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertDescription>{noPermissionMessage}</AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 需要的权限编码 */
  permission?: string;
  /** 需要任一权限（或关系） */
  anyPermissions?: string[];
  /** 需要全部权限（且关系） */
  allPermissions?: string[];
  /** 无权限时是否隐藏按钮 */
  hideWhenNoPermission?: boolean;
  /** 无权限时是否禁用按钮 */
  disableWhenNoPermission?: boolean;
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 权限按钮组件
 * 根据权限控制按钮的显示和可用性
 */
export function PermissionButton({
  permission,
  anyPermissions,
  allPermissions,
  hideWhenNoPermission = false,
  disableWhenNoPermission = true,
  children,
  ...buttonProps
}: PermissionButtonProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermission();

  // 权限检查逻辑
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAnyPermission(anyPermissions);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  }

  // 无权限且需要隐藏
  if (!hasAccess && hideWhenNoPermission) {
    return null;
  }

  // 无权限且需要禁用
  const isDisabled = (!hasAccess && disableWhenNoPermission) || loading || buttonProps.disabled;

  return (
    <button
      {...buttonProps}
      disabled={isDisabled}
      title={!hasAccess ? '您没有权限执行此操作' : buttonProps.title}
    >
      {children}
    </button>
  );
}

interface ConditionalRenderProps {
  /** 需要的权限编码 */
  permission?: string;
  /** 需要任一权限（或关系） */
  anyPermissions?: string[];
  /** 需要全部权限（且关系） */
  allPermissions?: string[];
  /** 有权限时渲染的内容 */
  children: React.ReactNode;
  /** 无权限时渲染的内容 */
  fallback?: React.ReactNode;
}

/**
 * 条件渲染组件
 * 简单的权限条件渲染
 */
export function ConditionalRender({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null
}: ConditionalRenderProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAnyPermission(anyPermissions);
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}