import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderTracker from "@/components/order-tracking/OrderTracker";
import OrderList from "@/components/order-tracking/OrderList";

const Orders = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">订单管理</h1>
              <p className="text-muted-foreground">查询和追踪订单状态，管理物流信息</p>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Orders;