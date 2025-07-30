import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  AlertTriangle, 
  BarChart3, 
  MessageSquare,
  Settings,
  Menu,
  X
} from "lucide-react";

const navigation = [
  { name: "仪表盘", href: "/", icon: LayoutDashboard, current: true },
  { name: "实时地图", href: "/map", icon: MapPin, current: false },
  { name: "订单追踪", href: "/orders", icon: Package, current: false },
  { name: "智能预警", href: "/alerts", icon: AlertTriangle, current: false },
  { name: "数据分析", href: "/analytics", icon: BarChart3, current: false },
  { name: "协同通信", href: "/communication", icon: MessageSquare, current: false },
  { name: "系统设置", href: "/settings", icon: Settings, current: false },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-primary-foreground rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">洞隐DI.AI</h1>
              <p className="text-xs text-muted-foreground">智能控制塔</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-10",
                isCollapsed && "px-2"
              )}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && (
                <span className="text-sm">{item.name}</span>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground text-center">
            版本 v1.0.0
          </div>
        )}
      </div>
    </div>
  );
}