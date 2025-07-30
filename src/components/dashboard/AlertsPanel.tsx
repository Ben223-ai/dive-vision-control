import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, MapPin, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "delay" | "route" | "exception";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  time: string;
  orderId: string;
}

const alerts: Alert[] = [
  {
    id: "1",
    type: "delay",
    title: "预计延误预警",
    description: "订单 #TMS2024001 预计延误2小时送达",
    severity: "high",
    time: "5分钟前",
    orderId: "TMS2024001"
  },
  {
    id: "2",
    type: "route",
    title: "路线偏离",
    description: "车辆 粤B12345 偏离预定路线超过5公里",
    severity: "medium",
    time: "12分钟前",
    orderId: "TMS2024002"
  },
  {
    id: "3",
    type: "exception",
    title: "状态更新异常",
    description: "订单 #TMS2024003 超过6小时未更新状态",
    severity: "high",
    time: "25分钟前",
    orderId: "TMS2024003"
  }
];

const getSeverityColor = (severity: Alert["severity"]) => {
  switch (severity) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "low":
      return "bg-muted text-muted-foreground";
  }
};

const getTypeIcon = (type: Alert["type"]) => {
  switch (type) {
    case "delay":
      return Clock;
    case "route":
      return MapPin;
    case "exception":
      return AlertTriangle;
  }
};

export default function AlertsPanel() {
  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">智能预警</CardTitle>
          <Badge variant="destructive" className="text-xs">
            {alerts.filter(a => a.severity === "high").length} 高优先级
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = getTypeIcon(alert.type);
          return (
            <div
              key={alert.id}
              className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                getSeverityColor(alert.severity)
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    {alert.title}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {alert.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    {alert.orderId}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        <Button variant="outline" className="w-full mt-4">
          查看所有预警
        </Button>
      </CardContent>
    </Card>
  );
}