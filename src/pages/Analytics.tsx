import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TransportationKPIDashboard from "@/components/analytics/TransportationKPIDashboard";
import OperationalCostAnalysis from "@/components/analytics/OperationalCostAnalysis";
import CarrierPerformance from "@/components/analytics/CarrierPerformance";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">数据分析</h1>
              <p className="text-muted-foreground">
                运输管理系统的关键指标和分析报告
              </p>
            </div>

            <Tabs defaultValue="kpi" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="kpi">运输KPI仪表盘</TabsTrigger>
                <TabsTrigger value="costs">运营成本分析</TabsTrigger>
                <TabsTrigger value="carriers">承运商绩效统计</TabsTrigger>
              </TabsList>

              <TabsContent value="kpi" className="space-y-6">
                <TransportationKPIDashboard />
              </TabsContent>

              <TabsContent value="costs" className="space-y-6">
                <OperationalCostAnalysis />
              </TabsContent>

              <TabsContent value="carriers" className="space-y-6">
                <CarrierPerformance />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}