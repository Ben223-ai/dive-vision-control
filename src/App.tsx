import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { PermissionProvider, PageGuard, PERMISSIONS } from "./components/permission";
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
import FormDesigner from "./pages/FormDesigner";
import ApiManagement from "./pages/ApiManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
}

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
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <AppLayout>
              <RealTimeMap />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/anomaly-detection" element={
          <ProtectedRoute>
            <AppLayout>
              <AnomalyDetection />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/cost-prediction" element={
          <ProtectedRoute>
            <AppLayout>
              <CostPrediction />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/communication" element={
          <ProtectedRoute>
            <Communication />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/form-designer" element={
          <ProtectedRoute>
            <FormDesigner />
          </ProtectedRoute>
        } />
        <Route path="/api-management" element={
          <ProtectedRoute>
            <ApiManagement />
          </ProtectedRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
