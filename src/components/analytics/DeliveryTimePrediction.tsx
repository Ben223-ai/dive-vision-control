import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, Clock, Target, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PredictionResult {
  orderId: string;
  orderNumber?: string;
  origin?: string;
  destination?: string;
  status?: string;
  predictedDelivery: string;
  predictedHours: number;
  confidenceScore: number;
  factors: any;
  createdAt?: string;
}

interface ModelMetrics {
  accuracy: number;
  averageError: number;
  totalPredictions: number;
  lastTrained: string;
}

export default function DeliveryTimePrediction() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [training, setTraining] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchModelMetrics();
    fetchRecentPredictions();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, origin, destination, status, created_at")
        .eq("status", "in_transit")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching orders:", error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchModelMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("prediction_training_data")
        .select("prediction_error_hours, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Error fetching model metrics:", error);
        return;
      }

      if (data && data.length > 0) {
        const averageError = data.reduce((sum, record) => sum + (record.prediction_error_hours || 0), 0) / data.length;
        const accuracy = Math.max(0, 1 - averageError / 24) * 100;
        
        setModelMetrics({
          accuracy: Math.round(accuracy * 100) / 100,
          averageError: Math.round(averageError * 100) / 100,
          totalPredictions: data.length,
          lastTrained: data[0].created_at
        });
      }
    } catch (error) {
      console.error("Error calculating model metrics:", error);
    }
  };

  const fetchRecentPredictions = async () => {
    try {
      // 首先获取预测数据
      const { data: predictionsData, error: predictionsError } = await supabase
        .from("delivery_predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (predictionsError) {
        console.error("Error fetching predictions:", predictionsError);
        return;
      }

      if (!predictionsData || predictionsData.length === 0) {
        setPredictions([]);
        return;
      }

      // 获取相关订单信息
      const orderIds = predictionsData.map(pred => pred.order_id);
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, origin, destination, status")
        .in("id", orderIds);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        return;
      }

      // 合并数据
      const formattedPredictions = predictionsData.map(pred => {
        const order = ordersData?.find(o => o.id === pred.order_id);
        return {
          orderId: pred.order_id,
          orderNumber: order?.order_number,
          origin: order?.origin,
          destination: order?.destination,
          status: order?.status,
          predictedDelivery: pred.predicted_delivery,
          predictedHours: 0, // 计算从现在到预测时间的小时数
          confidenceScore: pred.confidence_score,
          factors: pred.prediction_factors,
          createdAt: pred.created_at
        };
      });

      setPredictions(formattedPredictions);
    } catch (error) {
      console.error("Error fetching recent predictions:", error);
    }
  };

  const handleSinglePrediction = async () => {
    if (!selectedOrderId) {
      toast({
        title: "请选择订单",
        description: "请先选择要预测的订单",
        variant: "destructive",
      });
      return;
    }

    setPredicting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-time-prediction', {
        body: {
          action: 'predict_single',
          orderId: selectedOrderId
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "预测完成",
        description: `预计交付时间：${Math.round(data.predictedHours)}小时，置信度：${Math.round(data.confidenceScore * 100)}%`,
      });

      // 刷新预测列表
      await fetchRecentPredictions();
      
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "预测失败",
        description: "交付时间预测失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setPredicting(false);
    }
  };

  const handleBatchPrediction = async () => {
    setPredicting(true);
    try {
      const orderIds = orders.slice(0, 10).map(order => order.id); // 预测前10个订单
      
      const { data, error } = await supabase.functions.invoke('delivery-time-prediction', {
        body: {
          action: 'predict_batch',
          batchOrderIds: orderIds
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "批量预测完成",
        description: `成功预测 ${data.predictions?.length || 0} 个订单的交付时间`,
      });

      // 刷新预测列表
      await fetchRecentPredictions();
      
    } catch (error) {
      console.error("Batch prediction error:", error);
      toast({
        title: "批量预测失败",
        description: "批量预测失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setPredicting(false);
    }
  };

  const handleModelTraining = async () => {
    setTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-time-prediction', {
        body: {
          action: 'train_model'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "模型训练完成",
        description: `训练样本：${data.trainingSamples}，准确率：${Math.round(data.modelAccuracy * 100)}%`,
      });

      // 刷新模型指标
      await fetchModelMetrics();
      
    } catch (error) {
      console.error("Training error:", error);
      toast({
        title: "模型训练失败",
        description: "模型训练失败，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setTraining(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return `${Math.abs(diffHours)}小时前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时后`;
    } else {
      return `${Math.round(diffHours / 24)}天后`;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "text-success";
    if (score >= 0.8) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) return "default";
    if (score >= 0.8) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            LSTM交付时间预测
          </h2>
          <p className="text-sm text-muted-foreground">基于深度学习的智能交付时间预测系统</p>
        </div>
        <Badge variant="outline" className="text-primary">
          AI驱动
        </Badge>
      </div>

      {/* 模型指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">模型准确率</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{modelMetrics?.accuracy || 0}%</p>
              <Progress value={modelMetrics?.accuracy || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">平均误差</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{modelMetrics?.averageError || 0}h</p>
              <p className="text-sm text-muted-foreground">小时</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">预测总数</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{modelMetrics?.totalPredictions || 0}</p>
              <p className="text-sm text-muted-foreground">次预测</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">最后训练</h3>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {modelMetrics?.lastTrained ? 
                  new Date(modelMetrics.lastTrained).toLocaleDateString('zh-CN') : 
                  '未训练'
                }
              </p>
              <p className="text-sm text-muted-foreground">模型版本</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 预测操作区域 */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>预测操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                选择订单进行单个预测
              </label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要预测的订单" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.origin} → {order.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSinglePrediction} 
                disabled={predicting || !selectedOrderId}
                className="min-w-24"
              >
                {predicting ? "预测中..." : "单个预测"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleBatchPrediction} 
                disabled={predicting}
                className="min-w-24"
              >
                {predicting ? "预测中..." : "批量预测"}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={handleModelTraining} 
                disabled={training}
                className="min-w-24"
              >
                {training ? "训练中..." : "训练模型"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预测结果列表 */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>最近预测结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>暂无预测记录</p>
                <p className="text-sm">请先进行订单预测</p>
              </div>
            ) : (
              predictions.map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{prediction.orderNumber}</h4>
                      <Badge variant="outline">{prediction.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {prediction.origin} → {prediction.destination}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">预测交付</p>
                      <p className="text-sm font-medium">
                        {formatRelativeTime(prediction.predictedDelivery)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">置信度</p>
                      <Badge variant={getConfidenceBadge(prediction.confidenceScore)}>
                        {Math.round(prediction.confidenceScore * 100)}%
                      </Badge>
                    </div>
                    
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}