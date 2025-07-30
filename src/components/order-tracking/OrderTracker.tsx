import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  origin: string;
  destination: string;
  status: string;
  carrier: string;
  created_at: string;
  estimated_delivery: string;
  actual_delivery?: string;
  updated_at: string;
  progress?: number;
}

interface TrackingEvent {
  id: string;
  event_type: string;
  description: string;
  location: string;
  event_time: string;
  created_at: string;
  latitude?: number;
  longitude?: number;
  order_id: string;
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return Clock;
    case "confirmed":
      return Package;
    case "in_transit":
      return MapPin;
    case "delivered":
      return CheckCircle;
    case "cancelled":
      return XCircle;
    default:
      return Package;
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

export default function OrderTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", searchQuery.trim())
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        setSelectedOrder(null);
        setTrackingEvents([]);
        return;
      }

      setSelectedOrder(order);

      // Fetch tracking events
      const { data: events, error: eventsError } = await supabase
        .from("order_tracking_events")
        .select("*")
        .eq("order_id", order.id)
        .order("event_time", { ascending: true });

      if (eventsError) {
        console.error("Error fetching tracking events:", eventsError);
        setTrackingEvents([]);
      } else {
        setTrackingEvents(events || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = selectedOrder ? getStatusIcon(selectedOrder.status) : Package;

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">订单追踪</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="请输入订单号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="bg-muted/50 border-0"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="px-6">
              <Search className="h-4 w-4 mr-2" />
              查询
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      {selectedOrder && (
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                订单详情 - {selectedOrder.order_number}
              </CardTitle>
              <Badge className={cn(getStatusColor(selectedOrder.status))}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {getStatusText(selectedOrder.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">订单进度</p>
                <p className="font-medium">{selectedOrder.progress || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">承运商</p>
                <p className="font-medium">{selectedOrder.carrier || "暂无"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">发货地</p>
                <p className="font-medium">{selectedOrder.origin}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">目的地</p>
                <p className="font-medium">{selectedOrder.destination}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">预计送达</p>
                <p className="font-medium">
                  {selectedOrder.estimated_delivery 
                    ? new Date(selectedOrder.estimated_delivery).toLocaleString('zh-CN')
                    : "暂无"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Timeline */}
      {selectedOrder && trackingEvents.length > 0 && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">运输轨迹</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trackingEvents.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md"></div>
                    {index < trackingEvents.length - 1 && (
                      <div className="absolute left-1.5 top-3 w-px h-8 bg-border"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">
                        {event.description}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.event_time).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {event.location && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchQuery && !selectedOrder && !loading && (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">未找到订单号为 "{searchQuery}" 的订单</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}