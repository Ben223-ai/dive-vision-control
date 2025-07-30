import { 
  Package, 
  Truck, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import RecentOrders from "@/components/dashboard/RecentOrders";
import OrderTracker from "@/components/order-tracking/OrderTracker";
import OrderList from "@/components/order-tracking/OrderList";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="运行订单"
          value="1,234"
          change="+12% 较昨日"
          changeType="positive"
          icon={Package}
          description="当前运输中的订单数量"
        />
        <StatsCard
          title="在途车辆"
          value="89"
          change="+5% 较昨日"
          changeType="positive"
          icon={Truck}
          description="正在执行运输任务的车辆"
        />
        <StatsCard
          title="异常预警"
          value="7"
          change="-2 较昨日"
          changeType="positive"
          icon={AlertTriangle}
          description="需要关注的异常情况"
        />
        <StatsCard
          title="准时率"
          value="96.8%"
          change="+1.2% 较昨日"
          changeType="positive"
          icon={TrendingUp}
          description="本月平均准时送达率"
        />
      </div>

      {/* Order Tracking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderTracker />
        </div>
        <div>
          <OrderList />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Orders */}
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        
        {/* Right column - Alerts */}
        <div>
          <AlertsPanel />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="平均运输时长"
          value="2.3天"
          change="-0.2天 较上周"
          changeType="positive"
          icon={Clock}
          description="从发货到送达的平均时间"
        />
        <StatsCard
          title="运输成本"
          value="¥48,290"
          change="+8% 较上月"
          changeType="negative"
          icon={DollarSign}
          description="本月累计运输费用"
        />
        <StatsCard
          title="承运商评分"
          value="4.7/5.0"
          change="+0.1 较上月"
          changeType="positive"
          icon={TrendingUp}
          description="承运商平均服务评分"
        />
      </div>
    </div>
  );
}