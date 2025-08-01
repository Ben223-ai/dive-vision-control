import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Truck, Package, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tmsService from "@/services/tmsService";

export default function TmsOrderLookup() {
  const [gid, setGid] = useState("");
  const [isOrLine, setIsOrLine] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!gid.trim()) {
      toast({
        title: "输入错误",
        description: "请输入订单GID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const result = await tmsService.getOrderDetail(gid.trim(), isOrLine);
      
      if (result.success) {
        setOrderData(result.data);
        toast({
          title: "查询成功",
          description: "订单信息获取成功",
        });
      } else {
        setError(result.error || "查询失败");
        toast({
          title: "查询失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "查询失败";
      setError(errorMessage);
      toast({
        title: "查询失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            TMS发货订单查询
          </CardTitle>
          <CardDescription>
            查询TMS系统中的发货订单详细信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-gid">订单GID</Label>
              <Input
                id="order-gid"
                placeholder="请输入订单GID（至少1个字符）"
                value={gid}
                onChange={(e) => setGid(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Switch
                  checked={isOrLine}
                  onCheckedChange={setIsOrLine}
                  disabled={loading}
                />
                包装明细
              </Label>
              <p className="text-xs text-muted-foreground">
                {isOrLine ? "显示包装明细信息" : "不显示包装明细信息"}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSearch}
            disabled={loading || !gid.trim()}
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                查询中...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                查询订单
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">查询失败</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {orderData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              订单详情
            </CardTitle>
            <CardDescription>
              订单GID: {gid}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  TMS订单
                </Badge>
                {isOrLine && (
                  <Badge variant="secondary">
                    包含包装明细
                  </Badge>
                )}
                <Badge variant={orderData.flag ? "default" : "destructive"}>
                  {orderData.flag ? "成功" : "失败"}
                </Badge>
              </div>
              
              <Separator />

              {/* 调试信息 - 显示实际数据结构 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">数据结构信息:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>响应成功标志: {orderData.flag ? '是' : '否'}</div>
                  <div>数据是否存在: {orderData.data ? '是' : '否'}</div>
                  <div>数据类型: {typeof orderData.data}</div>
                  {orderData.data && (
                    <div>数据字段: {Object.keys(orderData.data).join(', ')}</div>
                  )}
                </div>
              </div>

              {/* 订单基本信息 */}
              {orderData.data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">基本信息</h4>
                    <div className="space-y-3">
                      {orderData.data.orderNo && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">订单号:</span>
                          <span className="text-sm font-medium">{orderData.data.orderNo}</span>
                        </div>
                      )}
                      {orderData.data.gid && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">订单GID:</span>
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{orderData.data.gid}</span>
                        </div>
                      )}
                      {orderData.data.orderStatus && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">订单状态:</span>
                          <Badge variant="secondary">{orderData.data.orderStatus}</Badge>
                        </div>
                      )}
                      {orderData.data.orderType && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">订单类型:</span>
                          <span className="text-sm">{orderData.data.orderType}</span>
                        </div>
                      )}
                      {orderData.data.createTime && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">创建时间:</span>
                          <span className="text-sm">{new Date(orderData.data.createTime).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                      {orderData.data.updateTime && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">更新时间:</span>
                          <span className="text-sm">{new Date(orderData.data.updateTime).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                      {orderData.data.customerName && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">客户名称:</span>
                          <span className="text-sm font-medium">{orderData.data.customerName}</span>
                        </div>
                      )}
                      {orderData.data.customerCode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">客户编码:</span>
                          <span className="text-sm">{orderData.data.customerCode}</span>
                        </div>
                      )}
                      {orderData.data.businessType && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">业务类型:</span>
                          <span className="text-sm">{orderData.data.businessType}</span>
                        </div>
                      )}
                      {orderData.data.priority && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">优先级:</span>
                          <Badge variant={orderData.data.priority === '高' ? 'destructive' : 'outline'}>
                            {orderData.data.priority}
                          </Badge>
                        </div>
                      )}
                      {orderData.data.remark && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">备注:</span>
                          <p className="text-sm bg-muted p-2 rounded">{orderData.data.remark}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">物流信息</h4>
                    <div className="space-y-3">
                      {orderData.data.fromAddress && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">发货地址:</span>
                          <p className="text-sm bg-muted p-2 rounded">{orderData.data.fromAddress}</p>
                        </div>
                      )}
                      {orderData.data.fromContact && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">发货联系人:</span>
                          <span className="text-sm">{orderData.data.fromContact}</span>
                        </div>
                      )}
                      {orderData.data.fromPhone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">发货电话:</span>
                          <span className="text-sm font-mono">{orderData.data.fromPhone}</span>
                        </div>
                      )}
                      {orderData.data.toAddress && (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">收货地址:</span>
                          <p className="text-sm bg-muted p-2 rounded">{orderData.data.toAddress}</p>
                        </div>
                      )}
                      {orderData.data.toContact && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">收货联系人:</span>
                          <span className="text-sm">{orderData.data.toContact}</span>
                        </div>
                      )}
                      {orderData.data.toPhone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">收货电话:</span>
                          <span className="text-sm font-mono">{orderData.data.toPhone}</span>
                        </div>
                      )}
                      {orderData.data.carrierName && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">承运商:</span>
                          <span className="text-sm font-medium">{orderData.data.carrierName}</span>
                        </div>
                      )}
                      {orderData.data.carrierCode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">承运商编码:</span>
                          <span className="text-sm">{orderData.data.carrierCode}</span>
                        </div>
                      )}
                      {orderData.data.transportMode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">运输方式:</span>
                          <Badge variant="outline">{orderData.data.transportMode}</Badge>
                        </div>
                      )}
                      {orderData.data.vehicleNo && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">车牌号:</span>
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{orderData.data.vehicleNo}</span>
                        </div>
                      )}
                      {orderData.data.driverName && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">司机姓名:</span>
                          <span className="text-sm">{orderData.data.driverName}</span>
                        </div>
                      )}
                      {orderData.data.driverPhone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">司机电话:</span>
                          <span className="text-sm font-mono">{orderData.data.driverPhone}</span>
                        </div>
                      )}
                      {orderData.data.estimatedDeliveryTime && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">预计送达:</span>
                          <span className="text-sm">{new Date(orderData.data.estimatedDeliveryTime).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                      {orderData.data.actualDeliveryTime && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">实际送达:</span>
                          <span className="text-sm">{new Date(orderData.data.actualDeliveryTime).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                      {orderData.data.totalWeight && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">总重量:</span>
                          <span className="text-sm font-medium">{orderData.data.totalWeight} kg</span>
                        </div>
                      )}
                      {orderData.data.totalVolume && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">总体积:</span>
                          <span className="text-sm font-medium">{orderData.data.totalVolume} m³</span>
                        </div>
                      )}
                      {orderData.data.packageCount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">包装数量:</span>
                          <span className="text-sm">{orderData.data.packageCount} 件</span>
                        </div>
                      )}
                      {orderData.data.totalAmount && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">运费金额:</span>
                          <span className="text-sm font-medium text-green-600">¥{orderData.data.totalAmount}</span>
                        </div>
                      )}
                      {orderData.data.distance && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">运输距离:</span>
                          <span className="text-sm">{orderData.data.distance} km</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 包装明细 */}
              {isOrLine && orderData.data?.packageDetails && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">包装明细</h4>
                    <div className="grid gap-3">
                      {orderData.data.packageDetails.map((pkg: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">包装号:</span>
                              <div className="font-medium">{pkg.packageNo || `包装${index + 1}`}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">重量:</span>
                              <div>{pkg.weight || '-'} kg</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">体积:</span>
                              <div>{pkg.volume || '-'} m³</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">状态:</span>
                              <Badge variant="outline" className="text-xs">{pkg.status || '未知'}</Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 错误信息显示 */}
              {!orderData.flag && orderData.errorMessage && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">错误信息</span>
                    </div>
                    <p className="text-sm text-destructive/80">{orderData.errorMessage}</p>
                    {orderData.errorCode && (
                      <p className="text-xs text-muted-foreground mt-1">错误代码: {orderData.errorCode}</p>
                    )}
                  </div>
                </>
              )}

              {/* 原始数据展开显示 */}
              <details className="bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm hover:text-primary">
                  查看原始响应数据
                </summary>
                <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded border mt-3">
                  {JSON.stringify(orderData, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}