import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderTracker from "@/components/order-tracking/OrderTracker";
import OrderList from "@/components/order-tracking/OrderList";
import TmsOrderLookup from "@/components/order-tracking/TmsOrderLookup";

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
            
            <Tabs defaultValue="tracking" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tracking">订单追踪</TabsTrigger>
                <TabsTrigger value="list">订单列表</TabsTrigger>
                <TabsTrigger value="tms">TMS订单查询</TabsTrigger>
              </TabsList>

              <TabsContent value="tracking" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <OrderTracker />
                  </div>
                  <div>
                    <OrderList />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="list" className="space-y-6">
                <OrderList />
              </TabsContent>

              <TabsContent value="tms" className="space-y-6">
                <TmsOrderLookup />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Orders;