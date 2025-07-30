import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, MapPin, CheckCircle, X, Search, Filter, Brain, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  order_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  predicted_delay_hours?: number;
  confidence_score?: number;
  status: string;
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  metadata: any;
  order?: {
    order_number: string;
    customer_name: string;
    origin: string;
    destination: string;
    carrier: string;
  };
}

interface AlertRule {
  id: string;
  rule_type: string;
  name: string;
  description: string;
  conditions: any;
  thresholds: any;
  enabled: boolean;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "low":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getAlertTypeIcon = (type: string) => {
  switch (type) {
    case "delay_prediction":
      return Clock;
    case "route_deviation":
      return MapPin;
    case "status_anomaly":
      return AlertTriangle;
    case "carrier_issue":
      return TrendingUp;
    case "weather_impact":
      return Brain;
    default:
      return AlertTriangle;
  }
};

const getAlertTypeText = (type: string) => {
  switch (type) {
    case "delay_prediction":
      return "延迟预测";
    case "route_deviation":
      return "路线偏离";
    case "status_anomaly":
      return "状态异常";
    case "carrier_issue":
      return "承运商问题";
    case "weather_impact":
      return "天气影响";
    default:
      return type;
  }
};

const getSeverityText = (severity: string) => {
  switch (severity) {
    case "critical":
      return "紧急";
    case "high":
      return "高";
    case "medium":
      return "中";
    case "low":
      return "低";
    default:
      return severity;
  }
};

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAlerts();
    fetchAlertRules();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select(`
          *,
          order:orders(order_number, customer_name, origin, destination, carrier)
        `)
        .order("triggered_at", { ascending: false });

      if (error) {
        console.error("Error fetching alerts:", error);
      } else {
        setAlerts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchAlertRules = async () => {
    try {
      const { data, error } = await supabase
        .from("alert_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching alert rules:", error);
      } else {
        setAlertRules(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "acknowledged") {
        updates.acknowledged_at = new Date().toISOString();
      } else if (status === "resolved") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("alerts")
        .update(updates)
        .eq("id", alertId);

      if (error) {
        console.error("Error updating alert:", error);
      } else {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === "all" || alert.status === filter;
    const matchesSearch = searchQuery === "" || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.order?.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const alertStats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === "active").length,
    high: alerts.filter(a => a.severity === "high" && a.status === "active").length,
    critical: alerts.filter(a => a.severity === "critical" && a.status === "active").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">智能预警中心</h1>
          <p className="text-muted-foreground">AI驱动的智能预警监控和管理</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-sm">
            {alertStats.active} 活跃预警
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总预警数</p>
                <p className="text-2xl font-bold">{alertStats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">活跃预警</p>
                <p className="text-2xl font-bold text-warning">{alertStats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">高优先级</p>
                <p className="text-2xl font-bold text-destructive">{alertStats.high}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">紧急预警</p>
                <p className="text-2xl font-bold text-destructive">{alertStats.critical}</p>
              </div>
              <Brain className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">预警列表</TabsTrigger>
          <TabsTrigger value="rules">预警规则</TabsTrigger>
          <TabsTrigger value="analytics">预警分析</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card className="shadow-elegant">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索预警..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="筛选状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="acknowledged">已确认</SelectItem>
                    <SelectItem value="resolved">已解决</SelectItem>
                    <SelectItem value="dismissed">已忽略</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>预警列表</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertTypeIcon(alert.alert_type);
                return (
                  <div
                    key={alert.id}
                    className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      getSeverityColor(alert.severity)
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-foreground">
                            {alert.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {getAlertTypeText(alert.alert_type)}
                          </Badge>
                          <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                            {getSeverityText(alert.severity)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.triggered_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </p>
                      {alert.order && (
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                          <span>订单: {alert.order.order_number}</span>
                          <span>客户: {alert.order.customer_name}</span>
                          {alert.order.carrier && <span>承运商: {alert.order.carrier}</span>}
                        </div>
                      )}
                      {alert.confidence_score && (
                        <div className="text-xs text-muted-foreground mb-2">
                          AI置信度: {(alert.confidence_score * 100).toFixed(1)}%
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        {alert.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAlertStatus(alert.id, "acknowledged")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              确认
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateAlertStatus(alert.id, "resolved")}
                            >
                              解决
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateAlertStatus(alert.id, "dismissed")}
                            >
                              <X className="h-3 w-3 mr-1" />
                              忽略
                            </Button>
                          </>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {alert.status === "active" ? "待处理" : 
                           alert.status === "acknowledged" ? "已确认" :
                           alert.status === "resolved" ? "已解决" : "已忽略"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredAlerts.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无预警记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>预警规则配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">
                      {rule.name}
                    </h4>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {rule.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    规则类型: {rule.rule_type}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>预警分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">预警趋势分析和AI模型性能指标即将推出</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}