import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { PermissionProvider } from "./components/permission";
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Alerts from "./pages/Alerts";
import AlertsCenter from "./pages/AlertsCenter";
import Analytics from "./pages/Analytics";
import Communication from "./pages/Communication";
import Settings from "./pages/Settings";
import RealTimeMap from "./pages/RealTimeMap";
import AnomalyDetection from "./pages/AnomalyDetection";
import CostPrediction from "./pages/CostPrediction";
import RouteOptimization from "./pages/RouteOptimization";
import FormDesigner from "./pages/FormDesigner";
import ApiManagement from "./pages/ApiManagement";
import ProductionAnalysis from "./pages/ProductionAnalysis";
import BrandPortal from "./pages/BrandPortal";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

const queryClient = new QueryClient();

// 布局组件
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PermissionProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/map" element={
            <AppLayout>
              <RealTimeMap />
            </AppLayout>
          } />
          <Route path="/analytics" element={
            <AppLayout>
              <Analytics />
            </AppLayout>
          } />
          <Route path="/anomaly-detection" element={
            <AppLayout>
              <AnomalyDetection />
            </AppLayout>
          } />
          <Route path="/cost-prediction" element={
            <AppLayout>
              <CostPrediction />
            </AppLayout>
          } />
          <Route path="/route-optimization" element={
            <AppLayout>
              <RouteOptimization />
            </AppLayout>
          } />
          <Route path="/communication" element={<Communication />} />
          <Route path="/settings" element={
            <AppLayout>
              <Settings />
            </AppLayout>
          } />
          <Route path="/form-designer" element={<FormDesigner />} />
          <Route path="/api-management" element={<ApiManagement />} />
          <Route path="/production-analysis" element={
            <AppLayout>
              <ProductionAnalysis />
            </AppLayout>
          } />
          <Route path="/brand-portal" element={
            <AppLayout>
              <BrandPortal />
            </AppLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PermissionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
