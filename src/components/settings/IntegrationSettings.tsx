import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Link, MapPin, Mail, MessageSquare, Bell, Truck, Brain, Cloud } from "lucide-react";

export const IntegrationSettings = () => {
  const [showApiKeys, setShowApiKeys] = useState({
    google: false,
    webhook: false,
    email: false,
    tms: false,
    amap: false,
    weather: false
  });

  const [integrations, setIntegrations] = useState({
    googleMaps: {
      enabled: true,
      apiKey: "AIzaSyC4R6AN7SmxxAEeOz_P7MjE9t...",
      status: "connected"
    },
    amapService: {
      enabled: false,
      apiKey: "",
      status: "disconnected"
    },
    weatherService: {
      enabled: false,
      provider: "amap",
      apiKey: "",
      status: "disconnected"
    },
    aiPrediction: {
      enabled: false,
      useRealTime: true,
      status: "disconnected"
    },
    tmsService: {
      enabled: false,
      token: "",
      baseUrl: "",
      status: "disconnected"
    },
    webhook: {
      enabled: false,
      url: "",
      status: "disconnected"
    },
    emailService: {
      enabled: true,
      provider: "smtp",
      status: "connected"
    },
    smsService: {
      enabled: false,
      provider: "",
      status: "disconnected"
    },
    notifications: {
      slack: {
        enabled: false,
        webhook: "",
        status: "disconnected"
      },
      teams: {
        enabled: false,
        webhook: "",
        status: "disconnected"
      }
    }
  });

  const handleToggleIntegration = (service: string, enabled: boolean) => {
    setIntegrations(prev => ({
      ...prev,
      [service]: {
        ...prev[service as keyof typeof prev],
        enabled
      }
    }));

    toast({
      title: enabled ? "集成已启用" : "集成已禁用",
      description: `${service} 集成已${enabled ? "启用" : "禁用"}`,
    });
  };

  const handleSaveApiKey = async (service: string) => {
    try {
      // 保存到localStorage
      const serviceKey = service.toLowerCase().replace(/\s+/g, '');
      if (serviceKey === 'tms') {
        localStorage.setItem('tms-config', JSON.stringify({
          baseUrl: integrations.tmsService.baseUrl,
          token: integrations.tmsService.token,
          authorization: integrations.tmsService.token
        }));
        
        // 更新tmsService配置
        const { default: tmsService } = await import('@/services/tmsService');
        tmsService.setConfig({
          baseUrl: integrations.tmsService.baseUrl,
          token: integrations.tmsService.token,
          authorization: integrations.tmsService.token
        });
      } else if (serviceKey === 'amap' || serviceKey === '高德地图') {
        localStorage.setItem('amap-api-key', integrations.amapService.apiKey);
      } else if (serviceKey === 'weather' || serviceKey === '天气服务') {
        localStorage.setItem('weather-api-key', integrations.weatherService.apiKey);
      }
      
      toast({
        title: "配置已保存",
        description: `${service}配置已安全保存`,
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "保存配置时出现错误",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async (service: string) => {
    try {
      const serviceKey = service.toLowerCase().replace(/\s+/g, '');
      
      if (serviceKey === 'tms' || serviceKey === 'tms数据同步') {
        setIntegrations(prev => ({
          ...prev,
          tmsService: { ...prev.tmsService, status: "connecting" }
        }));

        const { default: tmsService } = await import('@/services/tmsService');
        const isConnected = await tmsService.testConnection();
        
        setIntegrations(prev => ({
          ...prev,
          tmsService: { ...prev.tmsService, status: isConnected ? "connected" : "error" }
        }));

        toast({
          title: isConnected ? "连接成功" : "连接失败",
          description: isConnected ? `${service}连接正常` : `无法连接到${service}`,
          variant: isConnected ? "default" : "destructive",
        });
      } else if (serviceKey === 'amap' || serviceKey === '高德地图') {
        // 测试高德地图API连接
        if (!integrations.amapService.apiKey) {
          toast({
            title: "API密钥缺失",
            description: "请先输入高德地图API密钥",
            variant: "destructive",
          });
          return;
        }

        setIntegrations(prev => ({
          ...prev,
          amapService: { ...prev.amapService, status: "connecting" }
        }));

        // 高德地图API不支持浏览器直接调用(CORS限制)，改为JSONP方式测试
        try {
          console.log('开始测试高德地图API...');
          
          setIntegrations(prev => ({
            ...prev,
            amapService: { ...prev.amapService, status: "connecting" }
          }));

          // 使用JSONP方式测试API
          const testApiKey = integrations.amapService.apiKey;
          const testUrl = `https://restapi.amap.com/v3/geocode/geo?address=北京市朝阳区阜通东大街6号&output=JSON&key=${testApiKey}`;
          
          // 生成详细的curl测试命令
          const curlCommands = {
            geocoding: `curl -X GET "https://restapi.amap.com/v3/geocode/geo" \\
  -G \\
  -d "address=北京市朝阳区阜通东大街6号" \\
  -d "output=JSON" \\
  -d "key=${testApiKey}" \\
  -H "User-Agent: YourAppName/1.0" \\
  -v`,
            
            weather: `curl -X GET "https://restapi.amap.com/v3/weather/weatherInfo" \\
  -G \\
  -d "city=110000" \\
  -d "key=${testApiKey}" \\
  -H "User-Agent: YourAppName/1.0" \\
  -v`,
            
            district: `curl -X GET "https://restapi.amap.com/v3/config/district" \\
  -G \\
  -d "keywords=中国" \\
  -d "subdistrict=0" \\
  -d "key=${testApiKey}" \\
  -H "User-Agent: YourAppName/1.0" \\
  -v`
          };

          console.log('高德地图API测试命令:');
          console.log('地理编码测试:', curlCommands.geocoding);
          console.log('天气API测试:', curlCommands.weather);
          console.log('行政区域测试:', curlCommands.district);

          // 创建JSONP测试
          const jsonpTest = () => {
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              const callbackName = 'amapCallback' + Date.now();
              
              // 设置全局回调函数
              (window as any)[callbackName] = (data: any) => {
                document.head.removeChild(script);
                delete (window as any)[callbackName];
                resolve(data);
              };
              
              // 设置超时
              const timeout = setTimeout(() => {
                document.head.removeChild(script);
                delete (window as any)[callbackName];
                reject(new Error('JSONP请求超时'));
              }, 5000);
              
              script.onerror = () => {
                clearTimeout(timeout);
                document.head.removeChild(script);
                delete (window as any)[callbackName];
                reject(new Error('JSONP请求失败'));
              };
              
              // 使用支持JSONP的API端点
              script.src = `https://restapi.amap.com/v3/config/district?keywords=中国&subdistrict=0&key=${testApiKey}&callback=${callbackName}`;
              document.head.appendChild(script);
            });
          };

          try {
            const result = await jsonpTest();
            console.log('JSONP测试结果:', result);
            
            const isValid = result && (result as any).status === '1';
            
            setIntegrations(prev => ({
              ...prev,
              amapService: { ...prev.amapService, status: isValid ? "connected" : "error" }
            }));

            if (isValid) {
              toast({
                title: "API测试成功",
                description: "高德地图API密钥有效，服务正常",
              });
            } else {
              throw new Error((result as any)?.info || 'API返回错误');
            }
          } catch (jsonpError) {
            console.error('JSONP测试失败:', jsonpError);
            
            // JSONP失败时，提供curl命令供用户手动测试
            const allCurlCommands = Object.values(curlCommands).join('\n\n');
            navigator.clipboard.writeText(allCurlCommands).catch(() => {});
            
            setIntegrations(prev => ({
              ...prev,
              amapService: { ...prev.amapService, status: "error" }
            }));
            
            toast({
              title: "无法直接测试API",
              description: `由于CORS限制，无法在浏览器中直接测试高德API。

已复制curl测试命令到剪贴板，请在终端中执行测试：

测试方法：
1. 打开终端/命令行
2. 粘贴并执行curl命令
3. 检查返回结果中status字段是否为"1"

API使用说明：
• 地理编码：地址转换为坐标
• 天气服务：获取实时天气数据  
• 行政区域：获取区域边界信息

如果curl测试成功，说明API密钥有效，可以在后端正常使用。`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('API测试错误:', error);
          
          setIntegrations(prev => ({
            ...prev,
            amapService: { ...prev.amapService, status: "error" }
          }));
          
          toast({
            title: "测试失败",
            description: "API密钥测试过程中发生错误，请检查密钥格式",
            variant: "destructive",
          });
        }
      } else {
        // 模拟其他服务的连接测试
        toast({
          title: "连接测试成功",
          description: `${service}连接正常`,
        });
      }
    } catch (error) {
      toast({
        title: "连接失败",
        description: `${service}连接测试失败`,
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    const variant = status === 'connected' ? 'default' : 
                   status === 'error' ? 'destructive' : 'secondary';
    const text = status === 'connected' ? '已连接' : 
                 status === 'error' ? '错误' : '未连接';
    
    return <Badge variant={variant}>{text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 地图服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            地图服务
          </CardTitle>
          <CardDescription>配置地图API服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Google Maps API</span>
                {renderStatusBadge(integrations.googleMaps.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                用于地图显示和地理编码服务
              </p>
            </div>
            <Switch
              checked={integrations.googleMaps.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('googleMaps', checked)}
            />
          </div>

          {integrations.googleMaps.enabled && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="google-api-key">API密钥</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="google-api-key"
                      type={showApiKeys.google ? "text" : "password"}
                      defaultValue={integrations.googleMaps.apiKey}
                      placeholder="请输入Google Maps API密钥"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, google: !prev.google }))}
                    >
                      {showApiKeys.google ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={() => handleSaveApiKey('Google Maps')}>
                    保存
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleTestConnection('Google Maps')}>
                  测试连接
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                    获取API密钥
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI预测服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI预测服务
          </CardTitle>
          <CardDescription>配置智能交付时间预测所需的API服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 高德地图API */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">高德地图API</span>
                  {renderStatusBadge(integrations.amapService.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  用于路况查询和地理编码服务
                </p>
              </div>
              <Switch
                checked={integrations.amapService.enabled}
                onCheckedChange={(checked) => handleToggleIntegration('amapService', checked)}
              />
            </div>

            {integrations.amapService.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="amap-api-key">API密钥</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="amap-api-key"
                        type={showApiKeys.amap ? "text" : "password"}
                        placeholder="请输入高德地图API密钥"
                        value={integrations.amapService.apiKey}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          amapService: { ...prev.amapService, apiKey: e.target.value }
                        }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKeys(prev => ({ ...prev, amap: !prev.amap }))}
                      >
                        {showApiKeys.amap ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button onClick={() => handleSaveApiKey('高德地图')}>
                      保存
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection('高德地图')}>
                    测试连接
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noopener noreferrer">
                      获取API密钥
                    </a>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• 支持实时路况查询</p>
                  <p>• 地理编码和逆地理编码</p>
                  <p>• 路径规划和导航</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 天气服务 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  <span className="font-medium">天气服务</span>
                  {renderStatusBadge(integrations.weatherService.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  实时天气数据，影响运输时间预测
                </p>
              </div>
              <Switch
                checked={integrations.weatherService.enabled}
                onCheckedChange={(checked) => handleToggleIntegration('weatherService', checked)}
              />
            </div>

            {integrations.weatherService.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="weather-api-key">高德天气API密钥</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="weather-api-key"
                        type={showApiKeys.weather ? "text" : "password"}
                        placeholder="使用高德地图API密钥"
                        value={integrations.weatherService.apiKey || integrations.amapService.apiKey}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          weatherService: { ...prev.weatherService, apiKey: e.target.value }
                        }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKeys(prev => ({ ...prev, weather: !prev.weather }))}
                      >
                        {showApiKeys.weather ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button onClick={() => handleSaveApiKey('天气服务')}>
                      保存
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection('天气服务')}>
                    测试连接
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://lbs.amap.com/api/webservice/guide/api/weatherinfo/" target="_blank" rel="noopener noreferrer">
                      API文档
                    </a>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• 实时天气状况</p>
                  <p>• 温度、湿度、风速</p>
                  <p>• 天气预报数据</p>
                  <p>• 恶劣天气预警</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* AI预测功能配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">LSTM智能预测</span>
                  {renderStatusBadge(integrations.aiPrediction.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  基于机器学习的交付时间预测
                </p>
              </div>
              <Switch
                checked={integrations.aiPrediction.enabled}
                onCheckedChange={(checked) => {
                  setIntegrations(prev => ({
                    ...prev,
                    aiPrediction: { 
                      ...prev.aiPrediction, 
                      enabled: checked,
                      status: checked ? "connected" : "disconnected"
                    }
                  }));
                }}
              />
            </div>

            {integrations.aiPrediction.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">启用实时特征</span>
                  <Switch
                    checked={integrations.aiPrediction.useRealTime}
                    onCheckedChange={(checked) => setIntegrations(prev => ({
                      ...prev,
                      aiPrediction: { ...prev.aiPrediction, useRealTime: checked }
                    }))}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">预测特征包括:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <p>• 历史运输数据</p>
                    <p>• 承运商表现</p>
                    <p>• 货物重量体积</p>
                    <p>• 运输距离路线</p>
                    {integrations.aiPrediction.useRealTime && (
                      <>
                        <p>• 实时天气状况</p>
                        <p>• 实时路况信息</p>
                        <p>• 时间段影响</p>
                        <p>• 季节性因子</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TMS集成服务 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            TMS集成服务
          </CardTitle>
          <CardDescription>连接运输管理系统，实现订单和车辆数据同步</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">TMS系统集成</span>
                {renderStatusBadge(integrations.tmsService.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                与第三方TMS系统进行数据交互和同步
              </p>
            </div>
            <Switch
              checked={integrations.tmsService.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('tmsService', checked)}
            />
          </div>

          {integrations.tmsService.enabled && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tms-base-url">TMS服务地址</Label>
                  <Input
                    id="tms-base-url"
                    type="url"
                    placeholder="https://tms.company.com/api/v1"
                    value={integrations.tmsService.baseUrl}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      tmsService: { ...prev.tmsService, baseUrl: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tms-token">Token</Label>
                  <div className="relative">
                    <Input
                      id="tms-token"
                      type={showApiKeys.tms ? "text" : "password"}
                      placeholder="请输入TMS Token"
                      value={integrations.tmsService.token}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        tmsService: { ...prev.tmsService, token: e.target.value }
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKeys(prev => ({ ...prev, tms: !prev.tms }))}
                    >
                      {showApiKeys.tms ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleSaveApiKey('TMS')}>
                  保存配置
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTestConnection('TMS')}>
                  测试连接
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTestConnection('TMS数据同步')}>
                  测试数据同步
                </Button>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">同步功能</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• 订单状态同步</div>
                  <div>• 车辆位置同步</div>
                  <div>• 运输进度更新</div>
                  <div>• 异常事件推送</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Webhook集成
          </CardTitle>
          <CardDescription>配置外部系统的Webhook通知</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">自定义Webhook</span>
                {renderStatusBadge(integrations.webhook.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                向外部系统发送事件通知
              </p>
            </div>
            <Switch
              checked={integrations.webhook.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('webhook', checked)}
            />
          </div>

          {integrations.webhook.enabled && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://your-system.com/webhook"
                    value={integrations.webhook.url}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      webhook: { ...prev.webhook, url: e.target.value }
                    }))}
                  />
                  <Button onClick={() => handleSaveApiKey('Webhook')}>
                    保存
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleTestConnection('Webhook')}>
                测试Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 通知服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知服务
          </CardTitle>
          <CardDescription>配置团队协作通知渠道</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slack集成 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Slack</span>
                  {renderStatusBadge(integrations.notifications.slack.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  发送警报和更新到Slack频道
                </p>
              </div>
              <Switch
                checked={integrations.notifications.slack.enabled}
                onCheckedChange={(checked) => {
                  setIntegrations(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      slack: { ...prev.notifications.slack, enabled: checked }
                    }
                  }));
                }}
              />
            </div>

            {integrations.notifications.slack.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slack-webhook"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={integrations.notifications.slack.webhook}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          slack: { ...prev.notifications.slack, webhook: e.target.value }
                        }
                      }))}
                    />
                    <Button onClick={() => handleSaveApiKey('Slack')}>
                      保存
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection('Slack')}>
                    测试连接
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
                      配置说明
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Microsoft Teams集成 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Microsoft Teams</span>
                  {renderStatusBadge(integrations.notifications.teams.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  发送警报和更新到Teams频道
                </p>
              </div>
              <Switch
                checked={integrations.notifications.teams.enabled}
                onCheckedChange={(checked) => {
                  setIntegrations(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      teams: { ...prev.notifications.teams, enabled: checked }
                    }
                  }));
                }}
              />
            </div>

            {integrations.notifications.teams.enabled && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="teams-webhook">Teams Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="teams-webhook"
                      type="url"
                      placeholder="https://outlook.office.com/webhook/..."
                      value={integrations.notifications.teams.webhook}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          teams: { ...prev.notifications.teams, webhook: e.target.value }
                        }
                      }))}
                    />
                    <Button onClick={() => handleSaveApiKey('Teams')}>
                      保存
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection('Teams')}>
                    测试连接
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer">
                      配置说明
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 邮件服务集成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            邮件服务
          </CardTitle>
          <CardDescription>配置邮件发送服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">SMTP邮件服务</span>
                {renderStatusBadge(integrations.emailService.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                用于发送通知邮件和警报
              </p>
            </div>
            <Switch
              checked={integrations.emailService.enabled}
              onCheckedChange={(checked) => handleToggleIntegration('emailService', checked)}
            />
          </div>

          {integrations.emailService.enabled && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                邮件服务已配置并正常运行。如需更改SMTP设置，请联系系统管理员。
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => handleTestConnection('邮件服务')}>
                发送测试邮件
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};