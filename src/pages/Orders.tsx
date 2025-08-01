import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { PageGuard, PermissionGuard, PermissionBtn, PERMISSIONS } from "@/components/permission";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import OrderTracker from "@/components/order-tracking/OrderTracker";
import OrderList from "@/components/order-tracking/OrderList";
import TmsOrderLookup from "@/components/order-tracking/TmsOrderLookup";

const Orders = () => {
  return (
    <PageGuard page={PERMISSIONS.ORDERS_VIEW} module={PERMISSIONS.ORDERS}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">订单管理</h1>
                  <p className="text-muted-foreground">查询和追踪订单状态，管理物流信息</p>
                </div>
                
                {/* 权限控制的操作按钮 */}
                <div className="flex gap-2">
                  <PermissionBtn
                    permission={PERMISSIONS.ORDERS_CREATE}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    创建订单
                  </PermissionBtn>
                  
                  <PermissionBtn
                    permission={PERMISSIONS.ORDERS_EXPORT}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    导出数据
                  </PermissionBtn>
                </div>
              </div>
              
              <Tabs defaultValue="tracking" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tracking">订单追踪</TabsTrigger>
                  <TabsTrigger value="list">订单列表</TabsTrigger>
                  <PermissionGuard permission={PERMISSIONS.ORDERS_TRACKING}>
                    <TabsTrigger value="tms">TMS订单查询</TabsTrigger>
                  </PermissionGuard>
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

                <PermissionGuard permission={PERMISSIONS.ORDERS_TRACKING}>
                  <TabsContent value="tms" className="space-y-6">
                    <TmsOrderLookup />
                  </TabsContent>
                </PermissionGuard>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </PageGuard>
  );
};

export default Orders;