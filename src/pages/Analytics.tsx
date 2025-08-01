import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TransportationKPIDashboard from "@/components/analytics/TransportationKPIDashboard";
import OperationalCostAnalysis from "@/components/analytics/OperationalCostAnalysis";
import CarrierPerformance from "@/components/analytics/CarrierPerformance";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Analytics() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-3 md:p-6">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">数据分析</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                运输管理系统的关键指标和分析报告
              </p>
            </div>

            <Tabs defaultValue="kpi" className="space-y-4 md:space-y-6">
              <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 h-auto space-y-1' : 'grid-cols-3'}`}>
                <TabsTrigger value="kpi" className={isMobile ? "w-full justify-start" : ""}>
                  {isMobile ? "KPI仪表盘" : "运输KPI仪表盘"}
                </TabsTrigger>
                <TabsTrigger value="costs" className={isMobile ? "w-full justify-start" : ""}>
                  {isMobile ? "成本分析" : "运营成本分析"}
                </TabsTrigger>
                <TabsTrigger value="carriers" className={isMobile ? "w-full justify-start" : ""}>
                  {isMobile ? "承运商绩效" : "承运商绩效统计"}
                </TabsTrigger>
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