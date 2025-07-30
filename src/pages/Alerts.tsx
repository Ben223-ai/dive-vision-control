import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AlertsCenter from "./AlertsCenter";

const Alerts = () => {
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
            <AlertsCenter />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Alerts;