import React from 'react';
import { Button } from '@/components/ui/button';
import { PermissionButton } from '@/components/permission/PermissionGuard';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/components/ui/button';

interface PermissionButtonWrapperProps extends ButtonProps {
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
  /** 权限提示文本 */
  permissionTooltip?: string;
}

/**
 * 具有权限控制的按钮组件
 * 基于 shadcn Button 组件，集成权限验证
 */
export function PermissionButtonWrapper({
  permission,
  anyPermissions,
  allPermissions,
  hideWhenNoPermission = false,
  disableWhenNoPermission = true,
  permissionTooltip,
  className,
  children,
  ...props
}: PermissionButtonWrapperProps) {
  return (
    <PermissionButton
      permission={permission}
      anyPermissions={anyPermissions}
      allPermissions={allPermissions}
      hideWhenNoPermission={hideWhenNoPermission}
      disableWhenNoPermission={disableWhenNoPermission}
      {...props}
      className={cn(
        // Button 的默认样式
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        // 变体样式
        props.variant === 'default' && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        props.variant === 'destructive' && "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        props.variant === 'outline' && "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        props.variant === 'secondary' && "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        props.variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
        props.variant === 'link' && "text-primary underline-offset-4 hover:underline",
        // 尺寸样式
        props.size === 'default' && "h-9 px-4 py-2",
        props.size === 'sm' && "h-8 rounded-md px-3 text-xs",
        props.size === 'lg' && "h-10 rounded-md px-8",
        props.size === 'icon' && "h-9 w-9",
        className
      )}
      title={permissionTooltip || props.title}
    >
      {children}
    </PermissionButton>
  );
}

// 导出为默认的权限按钮
export const PermissionBtn = PermissionButtonWrapper;