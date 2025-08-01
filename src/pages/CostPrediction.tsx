import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  Zap,
  RefreshCw,
  Settings,
  DollarSign,
  Truck,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Lightbulb
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CostPrediction {
  predictedCost: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number;
  factors: any;
  recommendations: string[];
}

interface OptimizationOption {
  carrier: string;
  predictedCost: number;
  avgDelay: number;
  reliability: number;
  overallScore: number;
  recommendation: string;
}

export default function CostPredictionSystem() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<CostPrediction | null>(null);
  const [batchAnalysis, setBatchAnalysis] = useState<any>(null);
  const [trendForecast, setTrendForecast] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const { toast } = useToast();

  // 单订单预测参数
  const [orderData, setOrderData] = useState({
    origin: '',
    destination: '',
    weight: '',
    volume: '',
    carrier: '',
    urgency: 'standard',
    weatherConditions: 'good',
    trafficConditions: 'normal'
  });

  const urgencyOptions = [
    { value: 'standard', label: '标准配送', factor: '1.0x' },
    { value: 'express', label: '快递', factor: '1.15x' },
    { value: 'urgent', label: '紧急配送', factor: '1.3x' }
  ];

  const weatherOptions = [
    { value: 'good', label: '良好', factor: '1.0x' },
    { value: 'fair', label: '一般', factor: '1.05x' },
    { value: 'bad', label: '恶劣', factor: '1.2x' }
  ];

  const trafficOptions = [
    { value: 'light', label: '畅通', factor: '0.95x' },
    { value: 'normal', label: '正常', factor: '1.0x' },
    { value: 'heavy', label: '拥堵', factor: '1.1x' }
  ];

  const predictSingleOrderCost = async () => {
    if (!orderData.weight || !orderData.origin || !orderData.destination) {
      toast({
        title: "参数不完整",
        description: "请填写必要的订单信息",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cost-prediction', {
        body: {
          predictionType: 'single_order',
          ...orderData,
          weight: parseFloat(orderData.weight),
          volume: parseFloat(orderData.volume) || 0
        }
      });

      if (error) throw error;

      if (data?.success) {
        setPrediction(data.prediction);
        toast({
          title: "预测完成",
          description: `预测成本: ¥${data.prediction.predictedCost}`
        });
      } else {
        throw new Error(data?.error || '预测失败');
      }
    } catch (error) {
      console.error('Cost prediction error:', error);
      toast({
        title: "预测失败",
        description: error instanceof Error ? error.message : "成本预测服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cost-prediction', {
        body: { predictionType: 'batch_analysis' }
      });

      if (error) throw error;

      if (data?.success) {
        setBatchAnalysis(data.prediction);
        toast({
          title: "批量分析完成",
          description: `分析了 ${data.prediction.summary.totalOrders} 个订单`
        });
      }
    } catch (error) {
      console.error('Batch analysis error:', error);
      toast({
        title: "分析失败",
        description: "批量分析服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runTrendForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cost-prediction', {
        body: { predictionType: 'trend_forecast' }
      });

      if (error) throw error;

      if (data?.success) {
        setTrendForecast(data.prediction);
        toast({
          title: "趋势预测完成",
          description: `预测了未来 ${data.prediction.predictions.length} 周的成本趋势`
        });
      }
    } catch (error) {
      console.error('Trend forecast error:', error);
      toast({
        title: "预测失败",
        description: "趋势预测服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runOptimization = async () => {
    if (!orderData.weight || !orderData.origin || !orderData.destination) {
      toast({
        title: "参数不完整",
        description: "请填写订单信息进行优化分析",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cost-prediction', {
        body: {
          predictionType: 'optimization',
          ...orderData,
          weight: parseFloat(orderData.weight),
          volume: parseFloat(orderData.volume) || 0
        }
      });

      if (error) throw error;

      if (data?.success) {
        setOptimization(data.prediction);
        toast({
          title: "优化分析完成",
          description: `找到 ${data.prediction.optimizationOptions.length} 个优化方案`
        });
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "优化失败",
        description: "成本优化服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return ArrowUp;
      case 'decreasing': return ArrowDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '¥0.00';
    }
    return `¥${amount.toFixed(2)}`;
  };

  const formatConfidence = (confidence: number) => {
    return `${confidence}%`;
  };

  // 自动运行批量分析
  useEffect(() => {
    runBatchAnalysis();
    runTrendForecast();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            智能成本预测系统
          </h1>
          <p className="text-muted-foreground">基于机器学习的运输成本预测与优化</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={runBatchAnalysis} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            刷新分析
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </div>
      </div>

      {/* 快速概览 */}
      {batchAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总订单数</p>
                  <p className="text-2xl font-bold">{batchAnalysis.summary.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总成本</p>
                  <p className="text-2xl font-bold">{formatCurrency(batchAnalysis.summary.totalCost)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均订单成本</p>
                  <p className="text-2xl font-bold">{formatCurrency(batchAnalysis.summary.avgOrderCost)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">成本趋势</p>
                  <div className="flex items-center gap-1">
                    {trendForecast && (
                      <>
                        {React.createElement(getTrendIcon(trendForecast.trend?.direction), {
                          className: cn("h-5 w-5", getTrendColor(trendForecast.trend?.direction))
                        })}
                        <span className={cn("text-lg font-bold", getTrendColor(trendForecast.trend?.direction))}>
                          {trendForecast.trend?.direction === 'increasing' ? '+' : ''}
                          {(trendForecast.trend?.rate * 4).toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主功能区域 */}
      <Tabs defaultValue="prediction" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prediction" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            单订单预测
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            批量分析
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            趋势预测
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            成本优化
          </TabsTrigger>
        </TabsList>

        {/* 单订单预测 */}
        <TabsContent value="prediction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                订单信息
              </CardTitle>
              <CardDescription>输入订单详情获取成本预测</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">起始地</Label>
                  <Input
                    id="origin"
                    placeholder="如：北京市朝阳区"
                    value={orderData.origin}
                    onChange={(e) => setOrderData({...orderData, origin: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">目的地</Label>
                  <Input
                    id="destination"
                    placeholder="如：上海市浦东新区"
                    value={orderData.destination}
                    onChange={(e) => setOrderData({...orderData, destination: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">重量 (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="100"
                    value={orderData.weight}
                    onChange={(e) => setOrderData({...orderData, weight: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">体积 (m³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    placeholder="0.5"
                    value={orderData.volume}
                    onChange={(e) => setOrderData({...orderData, volume: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carrier">承运商</Label>
                  <Input
                    id="carrier"
                    placeholder="如：顺丰速运"
                    value={orderData.carrier}
                    onChange={(e) => setOrderData({...orderData, carrier: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>紧急程度</Label>
                  <Select value={orderData.urgency} onValueChange={(value) => setOrderData({...orderData, urgency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            <Badge variant="secondary" className="ml-2">{option.factor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>天气条件</Label>
                  <Select value={orderData.weatherConditions} onValueChange={(value) => setOrderData({...orderData, weatherConditions: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weatherOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            <Badge variant="secondary" className="ml-2">{option.factor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>路况条件</Label>
                  <Select value={orderData.trafficConditions} onValueChange={(value) => setOrderData({...orderData, trafficConditions: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trafficOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            <Badge variant="secondary" className="ml-2">{option.factor}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={predictSingleOrderCost} 
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  <Calculator className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  {loading ? '预测中...' : '开始预测'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 预测结果 */}
          {prediction && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    预测结果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(prediction.predictedCost)}
                      </p>
                      <p className="text-sm text-muted-foreground">预测成本</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">置信区间:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(prediction.confidenceInterval.lower)} - {formatCurrency(prediction.confidenceInterval.upper)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">置信度:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={prediction.confidence} className="w-20 h-2" />
                          <span className="text-sm font-medium">{formatConfidence(prediction.confidence)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">基础成本:</span>
                        <span className="text-sm">{formatCurrency(prediction.factors.baseCost)}</span>
                      </div>
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        预测基于历史数据和当前市场条件，实际成本可能有所差异
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    优化建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prediction.recommendations.map((recommendation, index) => (
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
            </div>
          )}
        </TabsContent>

        {/* 批量分析 */}
        <TabsContent value="analysis" className="space-y-4">
          {batchAnalysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    成本趋势分析
                  </CardTitle>
                  <CardDescription>最近30天的成本变化趋势</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={batchAnalysis.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(Number(value)), name === 'avgCost' ? '平均成本' : '总成本']}
                        labelFormatter={(date) => new Date(date).toLocaleDateString('zh-CN')}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="avgCost" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    承运商成本分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(batchAnalysis.carrierAnalysis).map(([carrier, analysis]: [string, any]) => (
                      <div key={carrier} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{carrier}</h4>
                          <Badge variant="secondary">{analysis.orders.length} 单</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">平均成本</p>
                            <p className="font-medium">{formatCurrency(analysis.avgCost)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">单位成本 (元/kg)</p>
                            <p className="font-medium">{analysis.avgCostPerKg ? formatCurrency(analysis.avgCostPerKg) : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {batchAnalysis.insights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      分析洞察
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {batchAnalysis.insights.map((insight: string, index: number) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{insight}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* 趋势预测 */}
        <TabsContent value="forecast" className="space-y-4">
          {trendForecast && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    成本趋势预测
                  </CardTitle>
                  <CardDescription>基于历史数据的未来4周成本预测</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), '成本']} />
                      <Line 
                        data={trendForecast.historical}
                        type="monotone" 
                        dataKey="avgCost" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="历史数据"
                      />
                      <Line 
                        data={trendForecast.predictions}
                        type="monotone" 
                        dataKey="predictedCost" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="预测数据"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>趋势分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {React.createElement(getTrendIcon(trendForecast.trend.direction), {
                          className: cn("h-6 w-6", getTrendColor(trendForecast.trend.direction))
                        })}
                        <div>
                          <p className="font-medium">
                            {trendForecast.trend.direction === 'increasing' ? '上升趋势' : 
                             trendForecast.trend.direction === 'decreasing' ? '下降趋势' : '平稳趋势'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            月变化率: {(trendForecast.trend.rate * 4).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">预测准确度</p>
                        <div className="flex items-center gap-2">
                          <Progress value={trendForecast.trend.r_squared * 100} className="flex-1 h-2" />
                          <span className="text-sm font-medium">
                            {(trendForecast.trend.r_squared * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>未来预测</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trendForecast.predictions.map((pred: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                          <div>
                            <p className="font-medium">{pred.week}</p>
                            <p className="text-sm text-muted-foreground">
                              置信度: {pred.confidence}%
                            </p>
                          </div>
                          <p className="text-lg font-bold">
                            {formatCurrency(pred.predictedCost)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {trendForecast.insights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      趋势洞察
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trendForecast.insights.map((insight: string, index: number) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{insight}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* 成本优化 */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                成本优化分析
              </CardTitle>
              <CardDescription>基于当前订单信息找到最优承运商选择</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runOptimization} 
                disabled={loading || !orderData.weight}
                className="w-full md:w-auto"
              >
                <Zap className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                {loading ? '分析中...' : '开始优化'}
              </Button>
            </CardContent>
          </Card>

          {optimization && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    节省潜力
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <p className="text-sm text-muted-foreground">当前承运商</p>
                      <p className="text-lg font-bold">{optimization.currentCarrier || '未指定'}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-50">
                      <p className="text-sm text-muted-foreground">推荐承运商</p>
                      <p className="text-lg font-bold text-green-600">{optimization.recommendedCarrier}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50">
                      <p className="text-sm text-muted-foreground">潜在节省</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(optimization.savings.amount)} ({optimization.savings.percentage}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>承运商对比</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {optimization.optimizationOptions.map((option: OptimizationOption, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{option.carrier}</h4>
                            {index === 0 && <Badge className="bg-green-500">推荐</Badge>}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(option.predictedCost)}</p>
                            <p className="text-sm text-muted-foreground">综合评分: {option.overallScore}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">平均延误 (小时)</p>
                            <p className="font-medium">{option.avgDelay}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">可靠性</p>
                            <p className="font-medium">{option.reliability}%</p>
                          </div>
                        </div>
                        
                        <p className="text-sm mt-2 text-muted-foreground">{option.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {optimization.strategies && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      优化策略
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {optimization.strategies.map((strategy: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <p className="text-sm">{strategy}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}