import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "./Dashboard";

const Index = () => {
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
              <h1 className="text-2xl font-bold text-foreground">运输控制台</h1>
              <p className="text-muted-foreground">实时监控运输状态，智能预警异常情况</p>
            </div>
            <Dashboard />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
