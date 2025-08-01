// 权限相关组件的统一导出
export { PermissionProvider, usePermission } from '@/contexts/PermissionContext';
export { 
  PermissionGuard, 
  PermissionButton, 
  ConditionalRender 
} from '@/components/permission/PermissionGuard';
export { 
  PermissionRoute, 
  ModuleGuard, 
  PageGuard 
} from '@/components/permission/PermissionRoute';
export { 
  PermissionButtonWrapper, 
  PermissionBtn 
} from '@/components/permission/PermissionButton';

// 常用权限编码常量
export const PERMISSIONS = {
  // 订单模块
  ORDERS: 'orders',
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_EXPORT: 'orders.export',
  ORDERS_TRACKING: 'orders.tracking',

  // 告警模块
  ALERTS: 'alerts',
  ALERTS_VIEW: 'alerts.view',
  ALERTS_MANAGE: 'alerts.manage',
  ALERTS_RULES: 'alerts.rules',

  // 分析模块
  ANALYTICS: 'analytics',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  // 地图模块
  MAP: 'map',
  MAP_VIEW: 'map.view',

  // 沟通模块
  COMMUNICATION: 'communication',
  COMMUNICATION_CHAT: 'communication.chat',
  COMMUNICATION_TASKS: 'communication.tasks',
  COMMUNICATION_ISSUES: 'communication.issues',

  // 设置模块
  SETTINGS: 'settings',
  SETTINGS_PROFILE: 'settings.profile',
  SETTINGS_SYSTEM: 'settings.system',
  SETTINGS_INTEGRATIONS: 'settings.integrations',
  SETTINGS_PERMISSIONS: 'settings.permissions',
} as const;

// 权限组合常量
export const PERMISSION_GROUPS = {
  // 订单相关权限
  ORDER_MANAGEMENT: [
    PERMISSIONS.ORDERS,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_EDIT
  ],
  ORDER_ADMIN: [
    PERMISSIONS.ORDERS,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_DELETE,
    PERMISSIONS.ORDERS_EXPORT
  ],
  
  // 系统管理权限
  SYSTEM_ADMIN: [
    PERMISSIONS.SETTINGS_SYSTEM,
    PERMISSIONS.SETTINGS_PERMISSIONS,
    PERMISSIONS.SETTINGS_INTEGRATIONS
  ],
  
  // 分析相关权限
  ANALYTICS_ACCESS: [
    PERMISSIONS.ANALYTICS,
    PERMISSIONS.ANALYTICS_VIEW
  ],
} as const;