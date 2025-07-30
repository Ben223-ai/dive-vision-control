import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart, Bar, LineChart, Line, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Star, Award, TrendingUp, TrendingDown, Truck, Clock, Package, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CarrierMetric {
  carrier: string;
  onTimeRate: number;
  totalOrders: number;
  avgCost: number;
  rating: number;
  issueCount: number;
  trend: number;
}

interface CarrierComparison {
  metric: string;
  carrier1: number;
  carrier2: number;
  carrier3: number;
  industry: number;
}

interface CarrierAlert {
  carrier: string;
  type: 'performance' | 'cost' | 'quality';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export default function CarrierPerformance() {
  const [carrierMetrics, setCarrierMetrics] = useState<CarrierMetric[]>([]);
  const [carrierComparison, setCarrierComparison] = useState<CarrierComparison[]>([]);
  const [carrierAlerts, setCarrierAlerts] = useState<CarrierAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarrierPerformance();
  }, []);

  const fetchCarrierPerformance = async () => {
    try {
      await Promise.all([
        fetchCarrierMetrics(),
        fetchCarrierComparison(),
        fetchCarrierAlerts()
      ]);
    } catch (error) {
      console.error("Error fetching carrier performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarrierMetrics = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("carrier, status, total_amount, estimated_delivery, actual_delivery");

      if (error) {
        console.error("Error fetching orders for carrier analysis:", error);
        return;
      }

      // Group by carrier and calculate metrics
      const carrierMap = new Map<string, any>();
      
      orders?.forEach(order => {
        if (!order.carrier) return;
        
        const current = carrierMap.get(order.carrier) || {
          totalOrders: 0,
          onTimeOrders: 0,
          totalCost: 0,
          issueCount: 0
        };
        
        current.totalOrders++;
        current.totalCost += order.total_amount || 0;
        
        // Check if delivered on time
        if (order.status === 'delivered' && order.actual_delivery && order.estimated_delivery) {
          if (new Date(order.actual_delivery) <= new Date(order.estimated_delivery)) {
            current.onTimeOrders++;
          }
        }
        
        // Simulate some issues
        if (Math.random() < 0.1) {
          current.issueCount++;
        }
        
        carrierMap.set(order.carrier, current);
      });

      const metrics: CarrierMetric[] = Array.from(carrierMap.entries()).map(([carrier, data]) => ({
        carrier,
        onTimeRate: data.totalOrders > 0 ? Math.round((data.onTimeOrders / data.totalOrders) * 100) : 0,
        totalOrders: data.totalOrders,
        avgCost: data.totalOrders > 0 ? Math.round(data.totalCost / data.totalOrders) : 0,
        rating: 3.5 + Math.random() * 1.5, // Simulate rating 3.5-5.0
        issueCount: data.issueCount,
        trend: (Math.random() - 0.5) * 10 // Random trend -5% to +5%
      })).sort((a, b) => b.totalOrders - a.totalOrders);

      setCarrierMetrics(metrics);
    } catch (error) {
      console.error("Error calculating carrier metrics:", error);
    }
  };

  const fetchCarrierComparison = async () => {
    try {
      // Create comparison data for top carriers
      const comparison: CarrierComparison[] = [
        {
          metric: "准时交付率",
          carrier1: 92,
          carrier2: 88,
          carrier3: 85,
          industry: 87
        },
        {
          metric: "平均成本",
          carrier1: 280,
          carrier2: 320,
          carrier3: 310,
          industry: 300
        },
        {
          metric: "客户满意度",
          carrier1: 4.5,
          carrier2: 4.2,
          carrier3: 4.0,
          industry: 4.1
        },
        {
          metric: "问题处理时间",
          carrier1: 2.1,
          carrier2: 3.2,
          carrier3: 2.8,
          industry: 2.7
        }
      ];

      setCarrierComparison(comparison);
    } catch (error) {
      console.error("Error generating carrier comparison:", error);
    }
  };

  const fetchCarrierAlerts = async () => {
    try {
      const alerts: CarrierAlert[] = [
        {
          carrier: "顺丰速运",
          type: "performance",
          message: "近期准时交付率下降至85%，低于目标90%",
          severity: "medium"
        },
        {
          carrier: "中通快递",
          type: "cost",
          message: "运输成本较上月上涨8.5%，需关注成本控制",
          severity: "high"
        },
        {
          carrier: "韵达速递",
          type: "quality",
          message: "客户投诉量增加，建议加强服务质量监控",
          severity: "medium"
        },
        {
          carrier: "申通快递",
          type: "performance",
          message: "表现优秀，准时交付率达95%，建议增加合作",
          severity: "low"
        }
      ];

      setCarrierAlerts(alerts);
    } catch (error) {
      console.error("Error generating carrier alerts:", error);
    }
  };

  const getCarrierInitials = (carrier: string) => {
    return carrier.slice(0, 2);
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < fullStars ? "fill-yellow-400 text-yellow-400" :
              i === fullStars && hasHalfStar ? "fill-yellow-200 text-yellow-400" :
              "text-gray-300"
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Clock className="h-4 w-4" />;
      case 'cost':
        return <TrendingUp className="h-4 w-4" />;
      case 'quality':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载承运商绩效数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Carrier Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {carrierMetrics.slice(0, 3).map((carrier, index) => (
          <Card key={index} className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getCarrierInitials(carrier.carrier)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{carrier.carrier}</h3>
                  <p className="text-sm text-muted-foreground">{carrier.totalOrders} 订单</p>
                </div>
                <div className="flex items-center space-x-1">
                  {carrier.trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn(
                    "text-sm",
                    carrier.trend > 0 ? "text-success" : "text-destructive"
                  )}>
                    {Math.abs(carrier.trend).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">准时交付率</span>
                    <span className="text-sm font-medium">{carrier.onTimeRate}%</span>
                  </div>
                  <Progress value={carrier.onTimeRate} className="h-2" />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">平均成本</span>
                  <span className="text-sm font-medium">¥{carrier.avgCost}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">评分</span>
                  {getRatingStars(carrier.rating)}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">问题数量</span>
                  <Badge variant={carrier.issueCount === 0 ? "default" : carrier.issueCount < 3 ? "secondary" : "destructive"}>
                    {carrier.issueCount}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carrier Comparison Chart */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            承运商绩效对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="carrier1" fill="#8884d8" name="顺丰速运" />
                <Bar dataKey="carrier2" fill="#82ca9d" name="中通快递" />
                <Bar dataKey="carrier3" fill="#ffc658" name="韵达速递" />
                <Bar dataKey="industry" fill="#ff7c7c" name="行业平均" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Carrier Metrics */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>详细绩效指标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">承运商</th>
                  <th className="text-right p-3">订单量</th>
                  <th className="text-right p-3">准时率</th>
                  <th className="text-right p-3">平均成本</th>
                  <th className="text-right p-3">评分</th>
                  <th className="text-right p-3">问题数</th>
                  <th className="text-right p-3">趋势</th>
                </tr>
              </thead>
              <tbody>
                {carrierMetrics.map((carrier, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getCarrierInitials(carrier.carrier)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{carrier.carrier}</span>
                      </div>
                    </td>
                    <td className="text-right p-3">{carrier.totalOrders}</td>
                    <td className="text-right p-3">
                      <Badge variant={carrier.onTimeRate >= 90 ? "default" : carrier.onTimeRate >= 80 ? "secondary" : "destructive"}>
                        {carrier.onTimeRate}%
                      </Badge>
                    </td>
                    <td className="text-right p-3">¥{carrier.avgCost}</td>
                    <td className="text-right p-3">{getRatingStars(carrier.rating)}</td>
                    <td className="text-right p-3">
                      <Badge variant={carrier.issueCount === 0 ? "default" : "destructive"}>
                        {carrier.issueCount}
                      </Badge>
                    </td>
                    <td className="text-right p-3">
                      <div className="flex items-center justify-end space-x-1">
                        {carrier.trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className={cn(
                          "text-sm",
                          carrier.trend > 0 ? "text-success" : "text-destructive"
                        )}>
                          {Math.abs(carrier.trend).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Carrier Alerts */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            承运商预警信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {carrierAlerts.map((alert, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border">
                <div className={cn(
                  "p-2 rounded-lg",
                  alert.severity === 'high' ? "bg-destructive/10 text-destructive" :
                  alert.severity === 'medium' ? "bg-warning/10 text-warning" :
                  "bg-primary/10 text-primary"
                )}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{alert.carrier}</h4>
                    <Badge variant={getAlertColor(alert.severity) as any}>
                      {alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}