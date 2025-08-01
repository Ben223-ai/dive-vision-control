import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target,
  Clock,
  Package,
  Truck,
  DollarSign,
  Brain,
  RefreshCw,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Anomaly {
  index: number;
  value: number;
  isAnomaly: boolean;
  severity: 'high' | 'medium' | 'low';
  description: string;
  timestamp: string;
  metricType: string;
}

interface AnomalyReport {
  summary: string;
  riskLevel: 'high' | 'medium' | 'low';
  recommendations: string[];
  detectionMethod: string;
  analysisTime: string;
}

const metricTypes = [
  { id: 'delivery_times', name: '交付时间异常', icon: Clock, description: '检测交付时间偏差异常' },
  { id: 'order_volume', name: '订单量异常', icon: Package, description: '检测订单数量波动异常' },
  { id: 'carrier_performance', name: '承运商性能异常', icon: Truck, description: '检测承运商表现异常' },
  { id: 'system_alerts', name: '系统告警异常', icon: AlertTriangle, description: '检测系统告警频率异常' },
  { id: 'cost_analysis', name: '成本异常', icon: DollarSign, description: '检测运输成本异常' }
];

const detectionMethods = [
  { id: 'zscore', name: 'Z-Score检测', description: '基于标准差的统计异常检测' },
  { id: 'iqr', name: 'IQR检测', description: '基于四分位距的异常检测' },
  { id: 'moving_average', name: '移动平均检测', description: '基于移动窗口的异常检测' },
  { id: 'trend', name: '趋势异常检测', description: '检测数据趋势的突变异常' }
];

export default function AnomalyDetectionSystem() {
  const [selectedMetric, setSelectedMetric] = useState('delivery_times');
  const [detectionMethod, setDetectionMethod] = useState('zscore');
  const [timeRange, setTimeRange] = useState(30); // 天数
  const [sensitivity, setSensitivity] = useState([2.5]);
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [report, setReport] = useState<AnomalyReport | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const { toast } = useToast();

  const runAnomalyDetection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('anomaly-detection', {
        body: {
          detectionType: detectionMethod,
          metricType: selectedMetric,
          timeRange,
          sensitivity: sensitivity[0]
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAnomalies(data.anomalies || []);
        setReport(data.report);
        setMetadata(data.metadata);
        
        toast({
          title: "异常检测完成",
          description: `检测到 ${data.anomalies?.length || 0} 个异常`
        });
      } else {
        throw new Error(data?.error || '异常检测失败');
      }
    } catch (error) {
      console.error('Anomaly detection error:', error);
      toast({
        title: "检测失败",
        description: error instanceof Error ? error.message : "异常检测服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return XCircle;
      case 'medium': return AlertCircle;
      case 'low': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 自动运行检测
  useEffect(() => {
    runAnomalyDetection();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            智能异常检测系统
          </h1>
          <p className="text-muted-foreground">基于机器学习的多维度异常监测与预警</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={runAnomalyDetection} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? '检测中...' : '开始检测'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>
        </div>
      </div>

      {/* 检测配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            检测参数配置
          </CardTitle>
          <CardDescription>选择检测目标、算法和参数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>检测指标</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map(metric => (
                    <SelectItem key={metric.id} value={metric.id}>
                      <div className="flex items-center gap-2">
                        <metric.icon className="h-4 w-4" />
                        {metric.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>检测算法</Label>
              <Select value={detectionMethod} onValueChange={setDetectionMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {detectionMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>时间范围：{timeRange} 天</Label>
              <Slider
                value={[timeRange]}
                onValueChange={(value) => setTimeRange(value[0])}
                min={7}
                max={90}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>敏感度：{sensitivity[0]}</Label>
              <Slider
                value={sensitivity}
                onValueChange={setSensitivity}
                min={1}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {metricTypes.find(m => m.id === selectedMetric)?.description} - 
              {detectionMethods.find(m => m.id === detectionMethod)?.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 检测结果概览 */}
      {metadata && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总异常数</p>
                  <p className="text-2xl font-bold">{metadata.totalAnomalies}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">高风险</p>
                  <p className="text-2xl font-bold text-red-600">{metadata.highSeverity}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">中风险</p>
                  <p className="text-2xl font-bold text-orange-600">{metadata.mediumSeverity}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">低风险</p>
                  <p className="text-2xl font-bold text-yellow-600">{metadata.lowSeverity}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 检测结果详情 */}
      <Tabs defaultValue="anomalies" className="w-full">
        <TabsList>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            异常列表
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            可视化分析
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            分析报告
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies" className="space-y-4">
          {anomalies.length > 0 ? (
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => {
                const SeverityIcon = getSeverityIcon(anomaly.severity);
                return (
                  <Card key={index} className={cn("border-l-4", getSeverityColor(anomaly.severity))}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SeverityIcon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{anomaly.description}</p>
                            <p className="text-sm text-muted-foreground">
                              检测时间: {formatTimestamp(anomaly.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity === 'high' ? '高风险' : 
                             anomaly.severity === 'medium' ? '中风险' : '低风险'}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            数值: {typeof anomaly.value === 'number' ? anomaly.value.toFixed(2) : anomaly.value}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">未检测到异常</p>
                <p className="text-muted-foreground">所有指标都在正常范围内</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          {anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>异常分布图</CardTitle>
                <CardDescription>异常点在时间序列中的分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={anomalies}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis dataKey="value" />
                    <Tooltip 
                      formatter={(value, name) => [value, '异常值']}
                      labelFormatter={(index) => `数据点 ${index}`}
                    />
                    <Scatter dataKey="value">
                      {anomalies.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.severity === 'high' ? '#ef4444' :
                            entry.severity === 'medium' ? '#f97316' : '#eab308'
                          }
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>风险等级分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">高风险</span>
                    <span className="text-sm font-medium">{metadata?.highSeverity || 0}</span>
                  </div>
                  <Progress 
                    value={(metadata?.highSeverity || 0) / (metadata?.totalAnomalies || 1) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">中风险</span>
                    <span className="text-sm font-medium">{metadata?.mediumSeverity || 0}</span>
                  </div>
                  <Progress 
                    value={(metadata?.mediumSeverity || 0) / (metadata?.totalAnomalies || 1) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">低风险</span>
                    <span className="text-sm font-medium">{metadata?.lowSeverity || 0}</span>
                  </div>
                  <Progress 
                    value={(metadata?.lowSeverity || 0) / (metadata?.totalAnomalies || 1) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>检测配置信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">检测指标:</span>
                    <span className="font-medium">
                      {metricTypes.find(m => m.id === metadata?.metricType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">检测算法:</span>
                    <span className="font-medium">
                      {detectionMethods.find(m => m.id === metadata?.detectionType)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">时间范围:</span>
                    <span className="font-medium">{metadata?.timeRange} 天</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">敏感度:</span>
                    <span className="font-medium">{sensitivity[0]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          {report && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    检测摘要
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className={cn(
                    report.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                    report.riskLevel === 'medium' ? 'border-orange-200 bg-orange-50' :
                    'border-green-200 bg-green-50'
                  )}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>风险等级: {
                        report.riskLevel === 'high' ? '高风险' :
                        report.riskLevel === 'medium' ? '中风险' : '低风险'
                      }</strong>
                      <br />
                      {report.summary}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>改进建议</CardTitle>
                  <CardDescription>基于检测结果的优化建议</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>技术详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">检测方法:</p>
                      <p className="font-medium">{report.detectionMethod}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">分析时间:</p>
                      <p className="font-medium">{formatTimestamp(report.analysisTime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}