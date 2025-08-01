import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GeocodeResult {
  formatted_address: string;
  location: {
    lng: number;
    lat: number;
  };
  level: string;
}

interface ReverseGeocodeResult {
  formatted_address: string;
  addressComponent: {
    province: string;
    city: string;
    district: string;
    street: string | { name?: string };
    streetNumber: string | { number?: string };
  };
}

interface GeocodingPanelProps {
  apiKey: string;
  onLocationSelect: (lng: number, lat: number, address: string) => void;
}

export default function GeocodingPanel({ apiKey, onLocationSelect }: GeocodingPanelProps) {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [loading, setLoading] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [reverseResult, setReverseResult] = useState<ReverseGeocodeResult | null>(null);
  const { toast } = useToast();

  // 使用Edge Function调用高德API

  const handleGeocode = async () => {
    if (!address.trim()) {
      toast({
        title: "请输入地址",
        description: "请输入需要查询的地址信息",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('amap-geocoding', {
        body: {
          type: 'geocode',
          address: address.trim(),
          apiKey
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data) {
        setGeocodeResult(data.data);
        toast({
          title: "地理编码成功",
          description: `找到位置: ${data.data.formatted_address}`
        });
      } else {
        toast({
          title: "地理编码失败",
          description: data?.error || "未找到相关地址信息",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "地理编码服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReverseGeocode = async () => {
    if (!coordinates.trim()) {
      toast({
        title: "请输入坐标",
        description: "请输入经纬度坐标，格式：经度,纬度",
        variant: "destructive"
      });
      return;
    }

    const [lng, lat] = coordinates.split(',').map(s => parseFloat(s.trim()));
    if (isNaN(lng) || isNaN(lat)) {
      toast({
        title: "坐标格式错误",
        description: "请输入正确的坐标格式：经度,纬度",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('amap-geocoding', {
        body: {
          type: 'reverse',
          coordinates: { lng, lat },
          apiKey
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data) {
        setReverseResult(data.data);
        toast({
          title: "逆地理编码成功",
          description: `地址: ${data.data.formatted_address}`
        });
      } else {
        toast({
          title: "逆地理编码失败",
          description: data?.error || "未找到相关地址信息",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "逆地理编码服务出现错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: "内容已复制到剪贴板"
    });
  };

  const selectLocation = (lng: number, lat: number, address: string) => {
    onLocationSelect(lng, lat, address);
    toast({
      title: "位置已选择",
      description: "地图将跳转到选中位置"
    });
  };

  return (
    <Card className="p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">地理编码服务</h3>
      </div>

      {/* 地址转坐标 */}
      <div className="space-y-3">
        <Label htmlFor="address">地址转坐标</Label>
        <div className="flex space-x-2">
          <Input
            id="address"
            placeholder="输入地址，如：北京市朝阳区阜通东大街6号"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
          />
          <Button onClick={handleGeocode} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {geocodeResult && (
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">查询结果</span>
                <Badge variant="secondary">{geocodeResult.level}</Badge>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">地址:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{geocodeResult.formatted_address}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(geocodeResult.formatted_address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">坐标:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{geocodeResult.location.lng}, {geocodeResult.location.lat}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(`${geocodeResult.location.lng}, ${geocodeResult.location.lat}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => selectLocation(
                  geocodeResult.location.lng,
                  geocodeResult.location.lat,
                  geocodeResult.formatted_address
                )}
              >
                <Navigation2 className="h-4 w-4 mr-2" />
                定位到此处
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 坐标转地址 */}
      <div className="space-y-3">
        <Label htmlFor="coordinates">坐标转地址</Label>
        <div className="flex space-x-2">
          <Input
            id="coordinates"
            placeholder="输入坐标，格式：经度,纬度"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleReverseGeocode()}
          />
          <Button onClick={handleReverseGeocode} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {reverseResult && (
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium text-sm mb-2">查询结果</div>
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">详细地址:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{reverseResult.formatted_address}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(reverseResult.formatted_address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>省份: {reverseResult.addressComponent.province || '未知'}</div>
                  <div>城市: {reverseResult.addressComponent.city || '未知'}</div>
                  <div>区县: {reverseResult.addressComponent.district || '未知'}</div>
                  <div>街道: {
                    typeof reverseResult.addressComponent.street === 'string' 
                      ? reverseResult.addressComponent.street 
                      : (reverseResult.addressComponent.street as any)?.name || '未知'
                  }</div>
                  <div>门牌: {
                    typeof reverseResult.addressComponent.streetNumber === 'string' 
                      ? reverseResult.addressComponent.streetNumber 
                      : (reverseResult.addressComponent.streetNumber as any)?.number || '未知'
                  }</div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => {
                  const [lng, lat] = coordinates.split(',').map(s => parseFloat(s.trim()));
                  selectLocation(lng, lat, reverseResult.formatted_address);
                }}
              >
                <Navigation2 className="h-4 w-4 mr-2" />
                定位到此处
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}