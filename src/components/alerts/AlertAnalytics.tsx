import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Brain, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AlertTrendData {
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  critical: number;
}

interface AlertTypeData {
  type: string;
  count: number;
  accuracy: number;
  color: string;
}

interface ModelPerformance {
  metric: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function AlertAnalytics() {
  const [alertTrends, setAlertTrends] = useState<AlertTrendData[]>([]);
  const [alertTypes, setAlertTypes] = useState<AlertTypeData[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelPerformance[]>([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      await Promise.all([
        fetchAlertTrends(),
        fetchAlertTypeDistribution(),
        fetchModelPerformance()
      ]);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertTrends = async () => {
    try {
      const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from("alerts")
        .select("triggered_at, severity, alert_type")
        .gte("triggered_at", startDate.toISOString());

      if (error) {
        console.error("Error fetching alert trends:", error);
        return;
      }

      // Group alerts by date and severity
      const trendsMap = new Map<string, any>();
      
      for (let i = 0; i < daysBack; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        trendsMap.set(dateStr, {
          date: dateStr,
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          critical: 0
        });
      }

      data?.forEach(alert => {
        const dateStr = alert.triggered_at.split('T')[0];
        const dayData = trendsMap.get(dateStr);
        if (dayData) {
          dayData.total++;
          dayData[alert.severity as keyof typeof dayData]++;
        }
      });

      const trends = Array.from(trendsMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        }));

      setAlertTrends(trends);
    } catch (error) {
      console.error("Error processing alert trends:", error);
    }
  };

  const fetchAlertTypeDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("alert_type, confidence_score")
        .not("confidence_score", "is", null);

      if (error) {
        console.error("Error fetching alert types:", error);
        return;
      }

      const typeMap = new Map<string, { count: number; totalConfidence: number }>();
      
      data?.forEach(alert => {
        const current = typeMap.get(alert.alert_type) || { count: 0, totalConfidence: 0 };
        current.count++;
        current.totalConfidence += alert.confidence_score || 0;
        typeMap.set(alert.alert_type, current);
      });

      const typeLabels: Record<string, string> = {
        delay_prediction: "延迟预测",
        route_deviation: "路线偏离",
        status_anomaly: "状态异常",
        carrier_issue: "承运商问题",
        weather_impact: "天气影响"
      };

      const types: AlertTypeData[] = Array.from(typeMap.entries()).map(([type, data], index) => ({
        type: typeLabels[type] || type,
        count: data.count,
        accuracy: Math.round((data.totalConfidence / data.count) * 100),
        color: COLORS[index % COLORS.length]
      }));

      setAlertTypes(types);
    } catch (error) {
      console.error("Error processing alert types:", error);
    }
  };

  const fetchModelPerformance = async () => {
    try {
      // Simulate model performance metrics (in real app, this would come from ML pipeline)
      const mockMetrics: ModelPerformance[] = [
        {
          metric: "预测准确率",
          value: 87.5,
          target: 85,
          trend: 'up',
          description: "AI模型预测结果的准确率"
        },
        {
          metric: "平均置信度",
          value: 78.2,
          target: 75,
          trend: 'up',
          description: "模型预测的平均置信度评分"
        },
        {
          metric: "误报率",
          value: 12.3,
          target: 15,
          trend: 'down',
          description: "错误预警占总预警的比例"
        },
        {
          metric: "响应时间",
          value: 2.1,
          target: 3,
          trend: 'down',
          description: "模型预测响应时间（秒）"
        },
        {
          metric: "覆盖率",
          value: 94.8,
          target: 90,
          trend: 'up',
          description: "成功检测到的异常比例"
        },
        {
          metric: "精确率",
          value: 82.7,
          target: 80,
          trend: 'stable',
          description: "正确预警占预警总数的比例"
        }
      ];

      setModelMetrics(mockMetrics);
    } catch (error) {
      console.error("Error fetching model performance:", error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMetricColor = (value: number, target: number, trend: string) => {
    if (trend === 'down') {
      return value <= target ? 'text-success' : 'text-destructive';
    }
    return value >= target ? 'text-success' : 'text-warning';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载分析数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">预警分析</h2>
          <p className="text-sm text-muted-foreground">预警趋势分析和AI模型性能指标</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">过去7天</SelectItem>
            <SelectItem value="30d">过去30天</SelectItem>
            <SelectItem value="90d">过去90天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">预警趋势</TabsTrigger>
          <TabsTrigger value="performance">AI性能</TabsTrigger>
          <TabsTrigger value="insights">智能洞察</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Alert Trends Chart */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                预警趋势分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={alertTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="critical" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" name="紧急" />
                    <Area type="monotone" dataKey="high" stackId="1" stroke="#ffc658" fill="#ffc658" name="高" />
                    <Area type="monotone" dataKey="medium" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="中" />
                    <Area type="monotone" dataKey="low" stackId="1" stroke="#8884d8" fill="#8884d8" name="低" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alert Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>预警类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {alertTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>预警准确率统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alertTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#8884d8" name="准确率(%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Model Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelMetrics.map((metric) => (
              <Card key={metric.metric} className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-medium">{metric.metric}</h3>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-end space-x-2">
                      <span className={cn("text-2xl font-bold", getMetricColor(metric.value, metric.target, metric.trend))}>
                        {metric.metric.includes('时间') ? `${metric.value}s` : 
                         metric.metric.includes('率') ? `${metric.value}%` : 
                         `${metric.value}%`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        目标: {metric.metric.includes('时间') ? `${metric.target}s` : `${metric.target}%`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Trend Chart */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                模型性能趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { date: '周一', accuracy: 85, confidence: 75, precision: 80 },
                    { date: '周二', accuracy: 86, confidence: 76, precision: 81 },
                    { date: '周三', accuracy: 87, confidence: 77, precision: 82 },
                    { date: '周四', accuracy: 88, confidence: 78, precision: 83 },
                    { date: '周五', accuracy: 87, confidence: 78, precision: 82 },
                    { date: '周六', accuracy: 88, confidence: 79, precision: 83 },
                    { date: '周日', accuracy: 87, confidence: 78, precision: 82 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="准确率" />
                    <Line type="monotone" dataKey="confidence" stroke="#82ca9d" name="置信度" />
                    <Line type="monotone" dataKey="precision" stroke="#ffc658" name="精确率" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Smart Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  智能洞察
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <h4 className="text-sm font-medium text-success">模型表现优秀</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI预测准确率达到87.5%，超过目标85%，延迟预测模型表现稳定。
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h4 className="text-sm font-medium text-warning">注意事项</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    路线偏离检测的误报率较高，建议调整阈值参数以减少误报。
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium text-primary">优化建议</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    建议增加天气数据源，提高天气影响预测的准确性。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>预警处理效率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">平均处理时间</span>
                    <Badge variant="secondary">2.5小时</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">处理完成率</span>
                    <Badge variant="default">94.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">自动解决率</span>
                    <Badge variant="outline">23.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">升级率</span>
                    <Badge variant="destructive">5.8%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Training History */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>模型训练历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="text-sm font-medium">延迟预测模型 v2.1</h4>
                    <p className="text-xs text-muted-foreground">训练数据: 10,000+ 订单记录</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">部署中</Badge>
                    <p className="text-xs text-muted-foreground mt-1">2024-01-30</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="text-sm font-medium">路线分析模型 v1.8</h4>
                    <p className="text-xs text-muted-foreground">训练数据: 5,000+ 路线记录</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">测试中</Badge>
                    <p className="text-xs text-muted-foreground mt-1">2024-01-28</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="text-sm font-medium">异常检测模型 v1.5</h4>
                    <p className="text-xs text-muted-foreground">训练数据: 8,000+ 异常案例</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">已部署</Badge>
                    <p className="text-xs text-muted-foreground mt-1">2024-01-25</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}