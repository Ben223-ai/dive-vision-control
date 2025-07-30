import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, MapPin, Clock, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import AlertIndicator from "@/components/alerts/AlertIndicator";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  origin: string;
  destination: string;
  status: string;
  carrier: string;
  created_at: string;
  estimated_delivery: string;
  total_amount: number;
  actual_delivery?: string;
  updated_at: string;
  weight?: number;
  volume?: number;
  alerts?: Array<{
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    confidence_score?: number;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-muted text-muted-foreground";
    case "confirmed":
      return "bg-primary text-primary-foreground";
    case "in_transit":
      return "bg-warning text-warning-foreground";
    case "delivered":
      return "bg-success text-success-foreground";
    case "cancelled":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "待处理";
    case "confirmed":
      return "已确认";
    case "in_transit":
      return "运输中";
    case "delivered":
      return "已送达";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
};

const getProgress = (status: string) => {
  switch (status) {
    case "pending":
      return 10;
    case "confirmed":
      return 25;
    case "in_transit":
      return 65;
    case "delivered":
      return 100;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          alerts:alerts!alerts_order_id_fkey(id, alert_type, severity, title, confidence_score, status)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        // Filter only active alerts
        const ordersWithActiveAlerts = (data || []).map(order => ({
          ...order,
          alerts: order.alerts?.filter((alert: any) => alert.status === 'active') || []
        }));
        setOrders(ordersWithActiveAlerts);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-elegant">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">加载中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">最新订单</CardTitle>
          <Badge variant="outline" className="text-xs">
            {orders.length} 个订单
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-foreground">
                    {order.order_number}
                  </h4>
                  <Badge className={cn("text-xs", getStatusColor(order.status))}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.customer_name}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{order.origin} → {order.destination}</span>
              </div>
              {order.carrier && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Truck className="h-3 w-3 mr-1" />
                  <span>{order.carrier}</span>
                </div>
              )}
              {order.estimated_delivery && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>预计 {new Date(order.estimated_delivery).toLocaleDateString('zh-CN')}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">运输进度</span>
                <span className="text-muted-foreground">{getProgress(order.status)}%</span>
              </div>
              <Progress value={getProgress(order.status)} className="h-2" />
            </div>

            {/* Alert Indicator */}
            <AlertIndicator 
              orderId={order.id}
              orderNumber={order.order_number}
              alerts={order.alerts}
            />
          </div>
        ))}
        <Button variant="outline" className="w-full mt-4">
          查看所有订单
        </Button>
      </CardContent>
    </Card>
  );
}