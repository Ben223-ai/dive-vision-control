import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductionCapacityAnalysis from "@/components/production/ProductionCapacityAnalysis";
import { Factory, BarChart3, TrendingUp, Database } from "lucide-react";

export default function ProductionAnalysis() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">生产数据分析</h1>
          <p className="text-muted-foreground">
            基于历史生产数据的产能分析与预测
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">数据更新时间: 刚刚</span>
        </div>
      </div>

      <Tabs defaultValue="capacity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capacity" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            产能分析
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            效率分析
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            生产预测
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            历史数据
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capacity">
          <ProductionCapacityAnalysis />
        </TabsContent>

        <TabsContent value="efficiency">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>生产效率分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">生产效率分析功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>生产预测</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">生产预测功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>历史数据管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">历史数据管理功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}