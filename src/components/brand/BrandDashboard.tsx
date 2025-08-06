import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BusinessProgressTimeline from "./BusinessProgressTimeline";
import { ShoppingCart, Factory, Truck, MapPin, Clock, DollarSign } from "lucide-react";

interface BrandMetrics {
  orders: { total: number; value: number };
  production: { total: number; value: number };
  shipping: { total: number; value: number };
  inTransit: { total: number; value: number };
}

interface StageData {
  stage: string;
  count: number;
  percentage: number;
  icon: any;
  color: string;
}

export default function BrandDashboard() {
  const [metrics, setMetrics] = useState<BrandMetrics | null>(null);
  const [stageData, setStageData] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟品牌方数据加载
    setTimeout(() => {
      const totalOrders = 20000;
      const production = 10000;
      const shipping = 5000;
      const inTransit = 5000;

      setMetrics({
        orders: { total: totalOrders, value: totalOrders * 150 },
        production: { total: production, value: production * 150 },
        shipping: { total: shipping, value: shipping * 150 },
        inTransit: { total: inTransit, value: inTransit * 150 }
      });

      setStageData([
        {
          stage: "下单",
          count: totalOrders,
          percentage: 100,
          icon: ShoppingCart,
          color: "bg-blue-500"
        },
        {
          stage: "生产",
          count: production,
          percentage: (production / totalOrders) * 100,
          icon: Factory,
          color: "bg-orange-500"
        },
        {
          stage: "发货",
          count: shipping,
          percentage: (shipping / totalOrders) * 100,
          icon: Truck,
          color: "bg-green-500"
        },
        {
          stage: "在途",
          count: inTransit,
          percentage: (inTransit / totalOrders) * 100,
          icon: MapPin,
          color: "bg-purple-500"
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-40 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 品牌概览 */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            轩尼诗 - 业务总览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{metrics?.orders.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">总订单</p>
              <p className="text-xs text-green-600">¥{(metrics?.orders.value || 0).toLocaleString()}万</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{metrics?.production.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">生产中</p>
              <p className="text-xs text-green-600">¥{(metrics?.production.value || 0).toLocaleString()}万</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{metrics?.shipping.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">已发货</p>
              <p className="text-xs text-green-600">¥{(metrics?.shipping.value || 0).toLocaleString()}万</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{metrics?.inTransit.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">运输中</p>
              <p className="text-xs text-green-600">¥{(metrics?.inTransit.value || 0).toLocaleString()}万</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 业务进度轴线 */}
      <BusinessProgressTimeline stageData={stageData} />

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              生产进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">产能完成率</span>
                <span className="text-sm font-semibold">50%</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">预计完成</span>
                <span className="text-sm font-semibold">15天</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-500" />
              物流状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">在途订单</span>
                <span className="text-sm font-semibold">5,000单</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">准时率</span>
                <span className="text-sm font-semibold">96.8%</span>
              </div>
              <Progress value={97} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              成本分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">总成本</span>
                <span className="text-sm font-semibold">¥3,000万</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">成本控制</span>
                <span className="text-sm font-semibold text-green-600">-5.2%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}