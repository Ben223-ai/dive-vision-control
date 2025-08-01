import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageGuard, PERMISSIONS } from "@/components/permission";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import FormTemplateManager from "@/components/forms/FormTemplateManager";

const FormDesigner = () => {
  return (
    <PageGuard page={PERMISSIONS.SETTINGS_SYSTEM} module={PERMISSIONS.SETTINGS}>
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
                <h1 className="text-2xl font-bold text-foreground">表单设计器</h1>
                <p className="text-muted-foreground">自定义表单字段，创建和管理表单模板</p>
              </div>
              
              <FormTemplateManager />
            </div>
          </main>
        </div>
      </div>
    </PageGuard>
  );
};

export default FormDesigner;