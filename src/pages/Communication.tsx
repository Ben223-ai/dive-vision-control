import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ChatRoom from "@/components/communication/ChatRoom";
import TaskManagement from "@/components/communication/TaskManagement";
import IssueTracking from "@/components/communication/IssueTracking";

export default function Communication() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">协同通信</h1>
              <p className="text-muted-foreground">
                团队协作、任务管理和问题跟踪平台
              </p>
            </div>

            <Tabs defaultValue="chat" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">团队聊天</TabsTrigger>
                <TabsTrigger value="tasks">任务管理</TabsTrigger>
                <TabsTrigger value="issues">问题跟踪</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-6">
                <ChatRoom />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <TaskManagement />
              </TabsContent>

              <TabsContent value="issues" className="space-y-6">
                <IssueTracking />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}