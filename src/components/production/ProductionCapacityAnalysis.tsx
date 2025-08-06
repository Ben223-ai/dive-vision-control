import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Factory, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface ProductionData {
  month: string;
  planned: number;
  actual: number;
  efficiency: number;
}

interface CapacityMetric {
  title: string;
  value: string;
  change: string;
  status: "positive" | "negative" | "neutral";
  icon: any;
}

export default function ProductionCapacityAnalysis() {
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [capacityMetrics, setCapacityMetrics] = useState<CapacityMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载生产数据
    setTimeout(() => {
      setProductionData([
        { month: "1月", planned: 10000, actual: 9500, efficiency: 95 },
        { month: "2月", planned: 12000, actual: 11800, efficiency: 98 },
        { month: "3月", planned: 15000, actual: 14200, efficiency: 95 },
        { month: "4月", planned: 18000, actual: 16500, efficiency: 92 },
        { month: "5月", planned: 20000, actual: 19200, efficiency: 96 },
        { month: "6月", planned: 22000, actual: 21500, efficiency: 98 },
      ]);

      setCapacityMetrics([
        {
          title: "月度产能",
          value: "21,500件",
          change: "+8.5%",
          status: "positive",
          icon: Factory
        },
        {
          title: "产能利用率",
          value: "98%",
          change: "+2%",
          status: "positive",
          icon: TrendingUp
        },
        {
          title: "平均生产周期",
          value: "5.2天",
          change: "-0.8天",
          status: "positive",
          icon: Clock
        },
        {
          title: "产能瓶颈",
          value: "2个工序",
          change: "需关注",
          status: "negative",
          icon: AlertCircle
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 产能指标概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {capacityMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metric.value}
                    </p>
                    <Badge 
                      variant={metric.status === "positive" ? "default" : "destructive"}
                      className="mt-2"
                    >
                      {metric.change}
                    </Badge>
                  </div>
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 生产数据图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 产量对比 */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>月度产量对比</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="planned" fill="hsl(var(--muted))" name="计划产量" />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="实际产量" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 产能效率趋势 */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>产能效率趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[90, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="效率(%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 产能预测 */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>产能预测分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">下月预测产能</p>
              <p className="text-2xl font-bold text-primary">23,500件</p>
              <Progress value={95} className="h-2" />
              <p className="text-xs text-muted-foreground">基于历史数据预测</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">产能饱和度</p>
              <p className="text-2xl font-bold text-orange-500">85%</p>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground">接近饱和警戒线</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">预计完成时间</p>
              <p className="text-2xl font-bold text-green-500">28天</p>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">大单预计完成</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}