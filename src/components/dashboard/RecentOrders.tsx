import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  origin: string;
  destination: string;
  status: "in_transit" | "delayed" | "delivered" | "pending";
  progress: number;
  carrier: string;
  estimatedDelivery: string;
}

const orders: Order[] = [
  {
    id: "1",
    orderNumber: "TMS2024001",
    origin: "深圳仓库",
    destination: "广州配送中心",
    status: "in_transit",
    progress: 75,
    carrier: "顺丰速运",
    estimatedDelivery: "今天 18:00"
  },
  {
    id: "2",
    orderNumber: "TMS2024002",
    origin: "上海仓库",
    destination: "杭州门店",
    status: "delayed",
    progress: 45,
    carrier: "德邦物流",
    estimatedDelivery: "明天 10:00"
  },
  {
    id: "3",
    orderNumber: "TMS2024003",
    origin: "北京仓库",
    destination: "天津配送中心",
    status: "delivered",
    progress: 100,
    carrier: "京东物流",
    estimatedDelivery: "已送达"
  },
  {
    id: "4",
    orderNumber: "TMS2024004",
    origin: "武汉仓库",
    destination: "长沙门店",
    status: "pending",
    progress: 10,
    carrier: "中通快递",
    estimatedDelivery: "后天 14:00"
  }
];

const getStatusBadge = (status: Order["status"]) => {
  switch (status) {
    case "in_transit":
      return <Badge className="bg-primary text-primary-foreground">在途</Badge>;
    case "delayed":
      return <Badge variant="destructive">延期</Badge>;
    case "delivered":
      return <Badge className="bg-success text-success-foreground">已送达</Badge>;
    case "pending":
      return <Badge variant="secondary">待发</Badge>;
  }
};

export default function RecentOrders() {
  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">最新订单</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center space-x-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light">
                <Package className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground">
                    {order.orderNumber}
                  </h4>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{order.origin}</span>
                  <span className="mx-2">→</span>
                  <span>{order.destination}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Truck className="h-3 w-3 mr-1" />
                    <span>{order.carrier}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {order.estimatedDelivery}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>运输进度</span>
                    <span>{order.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        order.status === "delayed" ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-4">
          查看所有订单
        </Button>
      </CardContent>
    </Card>
  );
}