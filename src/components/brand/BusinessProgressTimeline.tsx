import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StageData {
  stage: string;
  count: number;
  percentage: number;
  icon: any;
  color: string;
}

interface BusinessProgressTimelineProps {
  stageData: StageData[];
}

export default function BusinessProgressTimeline({ stageData }: BusinessProgressTimelineProps) {
  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle>业务进度轴线</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 进度条整体展示 */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              {stageData.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.stage} className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-white mb-2",
                      stage.color
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-xs text-muted-foreground">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* 连接线 */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted -z-10">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(stageData[stageData.length - 1]?.percentage || 0)}%` }}
              />
            </div>
          </div>

          {/* 详细进度展示 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stageData.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <div key={stage.stage} className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{stage.stage}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold">{stage.count.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={stage.percentage} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 阶段转化率 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">阶段转化率</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stageData.slice(1).map((stage, index) => {
                const prevStage = stageData[index];
                const conversionRate = ((stage.count / prevStage.count) * 100).toFixed(1);
                
                return (
                  <div key={`conversion-${index}`} className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {prevStage.stage} → {stage.stage}
                    </p>
                    <p className="text-lg font-bold text-primary">{conversionRate}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}