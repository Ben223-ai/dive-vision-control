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
import { Textarea } from "@/components/ui/textarea";
import { 
  Route,
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Fuel,
  Target,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  Navigation,
  TrendingDown,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Map as MapIcon
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryPoint {
  id: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  estimatedTime: number;
  weight?: number;
  volume?: number;
}

interface Vehicle {
  id: string;
  capacity: number;
  maxWeight: number;
  costPerKm: number;
  startLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface RouteOptimization {
  optimizedRoute: DeliveryPoint[];
  originalRoute?: DeliveryPoint[];
  statistics: any;
  recommendations: string[];
  savingsAnalysis?: any;
}

export default function RouteOptimizationSystem() {
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<RouteOptimization | null>(null);
  const [multiVehicleResult, setMultiVehicleResult] = useState<any>(null);
  const [batchAnalysis, setBatchAnalysis] = useState<any>(null);
  const { toast } = useToast();

  // 配送点管理
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([
    {
      id: '1',
      address: '北京市朝阳区国贸CBD',
      lat: 39.9185,
      lng: 116.4516,
      priority: 3,
      estimatedTime: 15,
      weight: 50,
      volume: 0.5
    }
  ]);

  // 车辆管理
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'vehicle-1',
      capacity: 1000,
      maxWeight: 2000,
      costPerKm: 2.5,
      startLocation: {
        lat: 39.9042,
        lng: 116.4074,
        address: '北京市西城区仓库'
      }
    }
  ]);

  // 优化选项
  const [optimizationOptions, setOptimizationOptions] = useState({
    optimizeFor: 'distance' as 'distance' | 'time' | 'cost' | 'fuel',
    considerTraffic: true,
    maxVehicles: 3,
    workingHours: {
      start: '08:00',
      end: '18:00'
    }
  });

  const addDeliveryPoint = () => {
    const newPoint: DeliveryPoint = {
      id: Date.now().toString(),
      address: '',
      lat: 39.9042,
      lng: 116.4074,
      priority: 1,
      estimatedTime: 10,
      weight: 0,
      volume: 0
    };
    setDeliveryPoints([...deliveryPoints, newPoint]);
  };

  const updateDeliveryPoint = (id: string, field: string, value: any) => {
    setDeliveryPoints(points =>
      points.map(point =>
        point.id === id ? { ...point, [field]: value } : point
      )
    );
  };

  const removeDeliveryPoint = (id: string) => {
    setDeliveryPoints(points => points.filter(point => point.id !== id));
  };

  const addVehicle = () => {
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      capacity: 1000,
      maxWeight: 2000,
      costPerKm: 2.5,
      startLocation: {
        lat: 39.9042,
        lng: 116.4074,
        address: '仓库地址'
      }
    };
    setVehicles([...vehicles, newVehicle]);
  };

  const updateVehicle = (id: string, field: string, value: any) => {
    setVehicles(vehicleList =>
      vehicleList.map(vehicle =>
        vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
      )
    );
  };

  const removeVehicle = (id: string) => {
    setVehicles(vehicleList => vehicleList.filter(vehicle => vehicle.id !== id));
  };

  const optimizeSingleVehicle = async () => {
    if (deliveryPoints.length === 0) {
      toast({
        title: "配送点不能为空",
        description: "请添加至少一个配送点",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('route-optimization', {
        body: {
          optimizationType: 'single_vehicle',
          deliveryPoints,
          vehicles: [vehicles[0]],
          options: optimizationOptions
        }
      });

      if (error) throw error;

      if (data?.success) {
        setOptimization(data.optimization);
        toast({
          title: "路线优化完成",
          description: `为 ${data.optimization.optimizedRoute.length - 1} 个配送点优化了路线`
        });
      } else {
        throw new Error(data?.error || '优化失败');
      }
    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: "优化失败",
        description: error instanceof Error ? error.message : "路线优化服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const optimizeMultiVehicle = async () => {
    if (deliveryPoints.length === 0 || vehicles.length === 0) {
      toast({
        title: "参数不完整",
        description: "请添加配送点和车辆信息",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('route-optimization', {
        body: {
          optimizationType: 'multi_vehicle',
          deliveryPoints,
          vehicles,
          options: optimizationOptions
        }
      });

      if (error) throw error;

      if (data?.success) {
        setMultiVehicleResult(data.optimization);
        toast({
          title: "多车辆优化完成",
          description: `为 ${data.optimization.vehicleRoutes.length} 辆车规划了路线`
        });
      }
    } catch (error) {
      console.error('Multi-vehicle optimization error:', error);
      toast({
        title: "优化失败",
        description: "多车辆路线优化服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('route-optimization', {
        body: { optimizationType: 'batch_optimization' }
      });

      if (error) throw error;

      if (data?.success) {
        setBatchAnalysis(data.optimization);
        toast({
          title: "批量分析完成",
          description: `分析了 ${data.optimization.summary.totalRoutes} 条路线`
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

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} km`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  // 自动运行批量分析
  useEffect(() => {
    runBatchAnalysis();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            智能路线优化引擎
          </h1>
          <p className="text-muted-foreground">基于算法的配送路线规划与优化系统</p>
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
        </div>
      </div>

      {/* 快速概览 */}
      {batchAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总路线数</p>
                  <p className="text-2xl font-bold">{batchAnalysis.summary.totalRoutes}</p>
                </div>
                <Route className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均优化率</p>
                  <p className="text-2xl font-bold">{batchAnalysis.summary.averageOptimization}%</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">距离节省</p>
                  <p className="text-2xl font-bold">{formatDistance(batchAnalysis.summary.totalSavings.distance)}</p>
                </div>
                <Navigation className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">成本节省</p>
                  <p className="text-2xl font-bold">{formatCurrency(batchAnalysis.summary.totalSavings.cost)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主功能区域 */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            单车优化
          </TabsTrigger>
          <TabsTrigger value="multi" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            多车优化
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            路线分析
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            配置管理
          </TabsTrigger>
        </TabsList>

        {/* 单车辆优化 */}
        <TabsContent value="single" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 配送点配置 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      配送点配置
                    </CardTitle>
                    <CardDescription>添加和配置配送地址信息</CardDescription>
                  </div>
                  <Button onClick={addDeliveryPoint} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {deliveryPoints.map((point, index) => (
                    <div key={point.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">配送点 {index + 1}</h4>
                        <Button
                          onClick={() => removeDeliveryPoint(point.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">地址</Label>
                          <Input
                            placeholder="配送地址"
                            value={point.address}
                            onChange={(e) => updateDeliveryPoint(point.id, 'address', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">优先级</Label>
                          <Select
                            value={point.priority.toString()}
                            onValueChange={(value) => updateDeliveryPoint(point.id, 'priority', parseInt(value))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">低</SelectItem>
                              <SelectItem value="2">中</SelectItem>
                              <SelectItem value="3">高</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">停留时间 (分钟)</Label>
                          <Input
                            type="number"
                            value={point.estimatedTime}
                            onChange={(e) => updateDeliveryPoint(point.id, 'estimatedTime', parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">重量 (kg)</Label>
                          <Input
                            type="number"
                            value={point.weight || ''}
                            onChange={(e) => updateDeliveryPoint(point.id, 'weight', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 优化结果 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  优化结果
                </CardTitle>
                <CardDescription>路线优化分析与建议</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={optimizeSingleVehicle} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Zap className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    {loading ? '优化中...' : '开始优化'}
                  </Button>

                  {optimization && (
                    <div className="space-y-4">
                      {/* 统计信息 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">
                            {formatDistance(optimization.statistics.optimizedDistance)}
                          </p>
                          <p className="text-sm text-muted-foreground">总距离</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatTime(optimization.statistics.optimizedTime)}
                          </p>
                          <p className="text-sm text-muted-foreground">总时间</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(optimization.statistics.optimizedCost)}
                          </p>
                          <p className="text-sm text-muted-foreground">总成本</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            {optimization.statistics.efficiency}%
                          </p>
                          <p className="text-sm text-muted-foreground">优化率</p>
                        </div>
                      </div>

                      {/* 节省分析 */}
                      {optimization.savingsAnalysis && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">优化成果</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span>距离节省:</span>
                              <span className="font-medium">{formatDistance(optimization.savingsAnalysis.distanceSaved)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>时间节省:</span>
                              <span className="font-medium">{formatTime(optimization.savingsAnalysis.timeSaved)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>成本节省:</span>
                              <span className="font-medium">{formatCurrency(optimization.savingsAnalysis.costSaved)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>燃油节省:</span>
                              <span className="font-medium">{optimization.savingsAnalysis.fuelSaved.toFixed(1)}L</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 优化建议 */}
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          优化建议
                        </h4>
                        {optimization.recommendations.map((rec, index) => (
                          <Alert key={index}>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 多车辆优化 */}
        <TabsContent value="multi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 车辆配置 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      车辆配置
                    </CardTitle>
                    <CardDescription>配置车辆信息和容量</CardDescription>
                  </div>
                  <Button onClick={addVehicle} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    添加车辆
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {vehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">车辆 {index + 1}</h4>
                        <Button
                          onClick={() => removeVehicle(vehicle.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">载重量 (kg)</Label>
                          <Input
                            type="number"
                            value={vehicle.maxWeight}
                            onChange={(e) => updateVehicle(vehicle.id, 'maxWeight', parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">容积 (m³)</Label>
                          <Input
                            type="number"
                            value={vehicle.capacity}
                            onChange={(e) => updateVehicle(vehicle.id, 'capacity', parseInt(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label className="text-xs">每公里成本 (¥)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={vehicle.costPerKm}
                            onChange={(e) => updateVehicle(vehicle.id, 'costPerKm', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 多车辆优化结果 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  多车辆优化结果
                </CardTitle>
                <CardDescription>车队路线规划分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={optimizeMultiVehicle} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Zap className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    {loading ? '优化中...' : '多车辆优化'}
                  </Button>

                  {multiVehicleResult && (
                    <div className="space-y-4">
                      {/* 总体统计 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-xl font-bold text-primary">
                            {multiVehicleResult.vehicleRoutes.length}
                          </p>
                          <p className="text-sm text-muted-foreground">使用车辆</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-xl font-bold text-blue-600">
                            {multiVehicleResult.totalStatistics.vehicleUtilization.toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">车辆利用率</p>
                        </div>
                      </div>

                      {/* 车辆路线详情 */}
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {multiVehicleResult.vehicleRoutes.map((route: any, index: number) => (
                          <div key={route.vehicleId} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">车辆 {index + 1}</h5>
                              <Badge variant="outline">
                                {route.optimizedRoute.length - 1} 个点
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">距离: </span>
                                <span className="font-medium">{formatDistance(route.statistics.optimizedDistance)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">时间: </span>
                                <span className="font-medium">{formatTime(route.statistics.optimizedTime)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">成本: </span>
                                <span className="font-medium">{formatCurrency(route.statistics.optimizedCost)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 优化建议 */}
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          车队优化建议
                        </h4>
                        {multiVehicleResult.recommendations.map((rec: string, index: number) => (
                          <Alert key={index}>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 路线分析 */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  历史优化效果
                </CardTitle>
                <CardDescription>路线优化效果趋势分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: '第1周', 距离节省: 120, 成本节省: 850, 时间节省: 45 },
                      { name: '第2周', 距离节省: 150, 成本节省: 980, 时间节省: 52 },
                      { name: '第3周', 距离节省: 180, 成本节省: 1200, 时间节省: 68 },
                      { name: '第4周', 距离节省: 210, 成本节省: 1450, 时间节省: 78 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="距离节省" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="成本节省" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  区域配送分析
                </CardTitle>
                <CardDescription>不同区域的配送效率对比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { 区域: '朝阳区', 配送点数: 35, 平均距离: 8.5, 优化率: 25 },
                      { 区域: '海淀区', 配送点数: 28, 平均距离: 12.3, 优化率: 32 },
                      { 区域: '西城区', 配送点数: 22, 平均距离: 6.8, 优化率: 18 },
                      { 区域: '东城区', 配送点数: 19, 平均距离: 5.2, 优化率: 15 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="区域" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="配送点数" fill="#8884d8" />
                      <Bar dataKey="优化率" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 配置管理 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                优化参数配置
              </CardTitle>
              <CardDescription>调整路线优化算法参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>优化目标</Label>
                    <Select
                      value={optimizationOptions.optimizeFor}
                      onValueChange={(value: any) => setOptimizationOptions({
                        ...optimizationOptions,
                        optimizeFor: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">最短距离</SelectItem>
                        <SelectItem value="time">最短时间</SelectItem>
                        <SelectItem value="cost">最低成本</SelectItem>
                        <SelectItem value="fuel">最省燃油</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>最大车辆数</Label>
                    <Input
                      type="number"
                      value={optimizationOptions.maxVehicles}
                      onChange={(e) => setOptimizationOptions({
                        ...optimizationOptions,
                        maxVehicles: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>工作时间</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={optimizationOptions.workingHours.start}
                        onChange={(e) => setOptimizationOptions({
                          ...optimizationOptions,
                          workingHours: {
                            ...optimizationOptions.workingHours,
                            start: e.target.value
                          }
                        })}
                      />
                      <Input
                        type="time"
                        value={optimizationOptions.workingHours.end}
                        onChange={(e) => setOptimizationOptions({
                          ...optimizationOptions,
                          workingHours: {
                            ...optimizationOptions.workingHours,
                            end: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="traffic"
                      checked={optimizationOptions.considerTraffic}
                      onChange={(e) => setOptimizationOptions({
                        ...optimizationOptions,
                        considerTraffic: e.target.checked
                      })}
                    />
                    <Label htmlFor="traffic">考虑实时交通情况</Label>
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