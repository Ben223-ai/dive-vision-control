import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Package, Clock, Target, Truck, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface KPIMetric {
  label: string;
  value: string;
  trend: number;
  target?: string;
  icon: React.ReactNode;
  color: string;
}

interface DeliveryPerformance {
  date: string;
  onTime: number;
  delayed: number;
  total: number;
  onTimeRate: number;
}

interface TransitTime {
  route: string;
  avgDays: number;
  target: number;
  volume: number;
}

export default function TransportationKPIDashboard() {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [deliveryPerformance, setDeliveryPerformance] = useState<DeliveryPerformance[]>([]);
  const [transitTimes, setTransitTimes] = useState<TransitTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransportationKPIs();
  }, []);

  const fetchTransportationKPIs = async () => {
    try {
      await Promise.all([
        fetchKPIMetrics(),
        fetchDeliveryPerformance(),
        fetchTransitTimes()
      ]);
    } catch (error) {
      console.error("Error fetching transportation KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIMetrics = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*");

      if (error) {
        console.error("Error fetching orders for KPIs:", error);
        return;
      }

      const total = orders?.length || 0;
      const completed = orders?.filter(o => o.status === 'delivered').length || 0;
      const onTime = orders?.filter(o => 
        o.status === 'delivered' && 
        o.actual_delivery && 
        o.estimated_delivery &&
        new Date(o.actual_delivery) <= new Date(o.estimated_delivery)
      ).length || 0;

      const avgProgress = orders?.reduce((sum, o) => sum + (o.progress || 0), 0) / total || 0;
      const onTimeRate = completed > 0 ? (onTime / completed) * 100 : 0;

      const metrics: KPIMetric[] = [
        {
          label: "订单总数",
          value: total.toString(),
          trend: 12.5,
          target: "1200",
          icon: <Package className="h-5 w-5" />,
          color: "text-primary"
        },
        {
          label: "准时交付率",
          value: `${Math.round(onTimeRate)}%`,
          trend: 3.2,
          target: "95%",
          icon: <Clock className="h-5 w-5" />,
          color: "text-success"
        },
        {
          label: "平均运输时间",
          value: "3.2天",
          trend: -0.8,
          target: "3.0天",
          icon: <Truck className="h-5 w-5" />,
          color: "text-warning"
        },
        {
          label: "运输完成率",
          value: `${Math.round((completed / total) * 100)}%`,
          trend: 5.1,
          target: "98%",
          icon: <Target className="h-5 w-5" />,
          color: "text-success"
        },
        {
          label: "平均运输进度",
          value: `${Math.round(avgProgress)}%`,
          trend: 2.3,
          icon: <MapPin className="h-5 w-5" />,
          color: "text-primary"
        },
        {
          label: "日均订单量",
          value: Math.round(total / 30).toString(),
          trend: 8.7,
          target: "45",
          icon: <Calendar className="h-5 w-5" />,
          color: "text-primary"
        }
      ];

      setKpiMetrics(metrics);
    } catch (error) {
      console.error("Error calculating KPI metrics:", error);
    }
  };

  const fetchDeliveryPerformance = async () => {
    try {
      // Generate mock delivery performance data
      const performanceData: DeliveryPerformance[] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const total = Math.floor(Math.random() * 20) + 30;
        const onTime = Math.floor(total * (0.85 + Math.random() * 0.1));
        const delayed = total - onTime;
        
        performanceData.push({
          date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          onTime,
          delayed,
          total,
          onTimeRate: Math.round((onTime / total) * 100)
        });
      }
      
      setDeliveryPerformance(performanceData);
    } catch (error) {
      console.error("Error generating delivery performance data:", error);
    }
  };

  const fetchTransitTimes = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("origin, destination, estimated_delivery, created_at")
        .not("estimated_delivery", "is", null);

      if (error) {
        console.error("Error fetching transit times:", error);
        return;
      }

      // Group by route and calculate average transit times
      const routeMap = new Map<string, { totalDays: number; count: number }>();
      
      orders?.forEach(order => {
        const route = `${order.origin} → ${order.destination}`;
        const transitDays = Math.abs(
          (new Date(order.estimated_delivery).getTime() - new Date(order.created_at).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        
        const current = routeMap.get(route) || { totalDays: 0, count: 0 };
        current.totalDays += transitDays;
        current.count += 1;
        routeMap.set(route, current);
      });

      const transitData: TransitTime[] = Array.from(routeMap.entries())
        .map(([route, data]) => ({
          route,
          avgDays: Math.round((data.totalDays / data.count) * 10) / 10,
          target: 3.0,
          volume: data.count
        }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 8);

      setTransitTimes(transitData);
    } catch (error) {
      console.error("Error calculating transit times:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载运输KPI数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiMetrics.map((metric, index) => (
          <Card key={index} className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-primary/10", metric.color)}>
                  {metric.icon}
                </div>
                <div className="flex items-center space-x-1">
                  {metric.trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    metric.trend > 0 ? "text-success" : "text-destructive"
                  )}>
                    {Math.abs(metric.trend)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{metric.label}</h3>
                <div className="flex items-end space-x-2">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  {metric.target && (
                    <span className="text-sm text-muted-foreground">目标: {metric.target}</span>
                  )}
                </div>
                {metric.target && (
                  <Progress 
                    value={parseFloat(metric.value) / parseFloat(metric.target) * 100} 
                    className="h-2" 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery Performance Chart */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            交付表现趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deliveryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value,
                    name === 'onTime' ? '准时交付' : name === 'delayed' ? '延迟交付' : '准时率'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="onTime" 
                  stackId="1" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  name="准时交付" 
                />
                <Area 
                  type="monotone" 
                  dataKey="delayed" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  name="延迟交付" 
                />
                <Line 
                  type="monotone" 
                  dataKey="onTimeRate" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="准时率(%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transit Times by Route */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            主要路线运输时间分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transitTimes.map((transit, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <h4 className="font-medium">{transit.route}</h4>
                  <p className="text-sm text-muted-foreground">订单量: {transit.volume}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-2xl font-bold">{transit.avgDays}</span>
                    <span className="text-sm text-muted-foreground ml-1">天</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">目标: {transit.target}天</span>
                    <Badge 
                      variant={transit.avgDays <= transit.target ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {transit.avgDays <= transit.target ? "达标" : "超时"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}