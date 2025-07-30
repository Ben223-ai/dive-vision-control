import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import RealTimeMap from "./pages/RealTimeMap";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/map" element={
            <div className="min-h-screen bg-background flex">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                  <div className="max-w-7xl mx-auto">
                    <RealTimeMap />
                  </div>
                </main>
              </div>
            </div>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
