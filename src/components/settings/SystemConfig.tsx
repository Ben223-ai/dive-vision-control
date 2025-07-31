import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export const SystemConfig = () => {
  const [config, setConfig] = useState({
    // API设置
    apiTimeout: "30",
    retryAttempts: "3",
    rateLimitEnabled: true,
    
    // 默认值
    defaultCarrier: "",
    defaultOrigin: "",
    defaultDestination: "",
    defaultTimeZone: "Asia/Shanghai",
    
    // 系统参数
    sessionTimeout: "60",
    maxFileSize: "10",
    dataRetentionDays: "365",
    autoBackup: true,
    debugMode: false,
    
    // 地图设置
    mapProvider: "google",
    defaultZoom: "10",
    clustering: true
  });

  const handleSave = () => {
    // TODO: Implement system config save logic
    toast({
      title: "系统配置已保存",
      description: "系统配置已成功更新",
    });
  };

  const handleReset = () => {
    // TODO: Implement reset to defaults
    toast({
      title: "已重置为默认值",
      description: "所有设置已恢复为默认配置",
    });
  };

  return (
    <div className="space-y-6">
      {/* API设置 */}
      <Card>
        <CardHeader>
          <CardTitle>API设置</CardTitle>
          <CardDescription>配置系统API相关参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-timeout">API超时时间 (秒)</Label>
              <Input
                id="api-timeout"
                type="number"
                value={config.apiTimeout}
                onChange={(e) => setConfig(prev => ({ ...prev, apiTimeout: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry-attempts">重试次数</Label>
              <Input
                id="retry-attempts"
                type="number"
                value={config.retryAttempts}
                onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-limit">启用速率限制</Label>
              <div className="pt-2">
                <Switch
                  id="rate-limit"
                  checked={config.rateLimitEnabled}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, rateLimitEnabled: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 默认值设置 */}
      <Card>
        <CardHeader>
          <CardTitle>默认值设置</CardTitle>
          <CardDescription>设置系统的默认参数值</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-carrier">默认承运商</Label>
              <Select value={config.defaultCarrier} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, defaultCarrier: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择默认承运商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sf-express">顺丰速运</SelectItem>
                  <SelectItem value="ems">中国邮政EMS</SelectItem>
                  <SelectItem value="zt-express">中通快递</SelectItem>
                  <SelectItem value="yd-express">韵达快递</SelectItem>
                  <SelectItem value="sto-express">申通快递</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-timezone">默认时区</Label>
              <Select value={config.defaultTimeZone} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, defaultTimeZone: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">东京时间 (UTC+9)</SelectItem>
                  <SelectItem value="America/New_York">纽约时间 (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">伦敦时间 (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-origin">默认起始地</Label>
              <Input
                id="default-origin"
                value={config.defaultOrigin}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultOrigin: e.target.value }))}
                placeholder="请输入默认起始地"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-destination">默认目的地</Label>
              <Input
                id="default-destination"
                value={config.defaultDestination}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultDestination: e.target.value }))}
                placeholder="请输入默认目的地"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统参数 */}
      <Card>
        <CardHeader>
          <CardTitle>系统参数</CardTitle>
          <CardDescription>配置系统运行参数和性能设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">会话超时 (分钟)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => setConfig(prev => ({ ...prev, sessionTimeout: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-file-size">最大文件大小 (MB)</Label>
              <Input
                id="max-file-size"
                type="number"
                value={config.maxFileSize}
                onChange={(e) => setConfig(prev => ({ ...prev, maxFileSize: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retention">数据保留天数</Label>
              <Input
                id="data-retention"
                type="number"
                value={config.dataRetentionDays}
                onChange={(e) => setConfig(prev => ({ ...prev, dataRetentionDays: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-backup">自动备份</Label>
              <div className="pt-2">
                <Switch
                  id="auto-backup"
                  checked={config.autoBackup}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, autoBackup: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">开发者选项</h4>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debug-mode">调试模式</Label>
                <p className="text-sm text-muted-foreground">启用详细日志和调试信息</p>
              </div>
              <Switch
                id="debug-mode"
                checked={config.debugMode}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, debugMode: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 地图设置 */}
      <Card>
        <CardHeader>
          <CardTitle>地图设置</CardTitle>
          <CardDescription>配置地图显示和交互选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>地图服务商</Label>
              <Select value={config.mapProvider} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, mapProvider: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Maps</SelectItem>
                  <SelectItem value="baidu">百度地图</SelectItem>
                  <SelectItem value="gaode">高德地图</SelectItem>
                  <SelectItem value="mapbox">Mapbox</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-zoom">默认缩放级别</Label>
              <Input
                id="default-zoom"
                type="number"
                min="1"
                max="20"
                value={config.defaultZoom}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultZoom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clustering">启用聚合显示</Label>
              <div className="pt-2">
                <Switch
                  id="clustering"
                  checked={config.clustering}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, clustering: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          重置为默认值
        </Button>
        <Button onClick={handleSave}>
          保存配置
        </Button>
      </div>
    </div>
  );
};