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
            <div className="space-y-4">
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
              </div>
              
              <Separator />
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">原始响应数据：</h4>
                <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded border">
                  {JSON.stringify(orderData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}