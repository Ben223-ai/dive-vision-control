import { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Package, 
  Navigation, 
  RotateCcw,
  Layers,
  Filter,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import MapApiKeyDialog from "@/components/MapApiKeyDialog";

// 模拟运输数据
const mockTransportData = [
  {
    id: "T001",
    orderId: "ORD-2024-001",
    vehicle: "京A12345",
    driver: "张师傅",
    cargo: "电子产品",
    status: "在途",
    position: [116.397428, 39.90923], // 北京天安门
    destination: [121.473701, 31.230416], // 上海外滩
    route: [
      [116.397428, 39.90923],
      [117.190182, 39.125596],
      [118.767413, 32.041544],
      [121.473701, 31.230416]
    ],
    speed: 65,
    estimatedArrival: "2024-01-16 14:30",
    progress: 45
  },
  {
    id: "T002", 
    orderId: "ORD-2024-002",
    vehicle: "沪B67890",
    driver: "李师傅", 
    cargo: "服装纺织",
    status: "延期",
    position: [120.153576, 30.287459], // 杭州
    destination: [113.280637, 23.125178], // 广州
    route: [
      [121.473701, 31.230416],
      [120.153576, 30.287459],
      [115.857591, 28.68202],
      [113.280637, 23.125178]
    ],
    speed: 45,
    estimatedArrival: "2024-01-16 18:00",
    progress: 30
  },
  {
    id: "T003",
    orderId: "ORD-2024-003", 
    vehicle: "粤C11111",
    driver: "王师傅",
    cargo: "食品饮料",
    status: "已送达",
    position: [113.280637, 23.125178], // 广州
    destination: [113.280637, 23.125178],
    route: [
      [116.397428, 39.90923],
      [113.280637, 23.125178]
    ],
    speed: 0,
    estimatedArrival: "已送达",
    progress: 100
  }
];

const statusConfig = {
  "在途": { color: "bg-primary", textColor: "text-primary-foreground", icon: Truck },
  "延期": { color: "bg-destructive", textColor: "text-destructive-foreground", icon: Package },
  "已送达": { color: "bg-secondary", textColor: "text-secondary-foreground", icon: Navigation }
};

export default function RealTimeMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    // 检查是否已有API Key
    const savedApiKey = localStorage.getItem("amap_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowApiKeyDialog(true);
      return;
    }

    // 初始化高德地图
    AMapLoader.load({
      key: savedApiKey,
      version: "2.0",
      plugins: ["AMap.ToolBar", "AMap.Scale", "AMap.Geolocation", "AMap.DistrictLayer", "AMap.TileLayer.Traffic"]
    }).then((AMap) => {
      if (mapContainer.current) {
        map.current = new AMap.Map(mapContainer.current, {
          zoom: 5,
          center: [116.397428, 39.90923],
          mapStyle: "amap://styles/dark",
          showLabel: true
        });

        // 添加工具条
        const toolbar = new AMap.ToolBar({
          position: {
            top: "10px",
            right: "10px"
          }
        });
        map.current.addControl(toolbar);

        // 添加比例尺
        const scale = new AMap.Scale({
          position: {
            bottom: "10px",
            left: "10px"
          }
        });
        map.current.addControl(scale);

        // 添加定位控件
        const geolocation = new AMap.Geolocation({
          position: {
            top: "60px", 
            right: "10px"
          }
        });
        map.current.addControl(geolocation);

        // 添加车辆标记和路线
        addVehicleMarkers(AMap);
        
        setMapLoaded(true);
      }
    }).catch((e) => {
      console.error("地图加载失败", e);
    });

    return () => {
      if (map.current) {
        map.current.destroy();
      }
    };
  }, [apiKey]);

  const addVehicleMarkers = (AMap: any) => {
    mockTransportData.forEach((vehicle) => {
      // 创建车辆图标
      const marker = new AMap.Marker({
        position: vehicle.position,
        title: `${vehicle.vehicle} - ${vehicle.status}`,
        content: createMarkerContent(vehicle),
        anchor: "center"
      });

      // 添加点击事件
      marker.on("click", () => {
        setSelectedVehicle(vehicle.id);
        // 创建信息窗体
        const infoWindow = new AMap.InfoWindow({
          content: createInfoWindowContent(vehicle),
          anchor: "bottom-center",
          offset: new AMap.Pixel(0, -20)
        });
        infoWindow.open(map.current, vehicle.position);
      });

      map.current.add(marker);

      // 绘制路线
      if (vehicle.route.length > 1) {
        const polyline = new AMap.Polyline({
          path: vehicle.route,
          strokeColor: vehicle.status === "延期" ? "#ef4444" : "#008D90",
          strokeWeight: 4,
          strokeOpacity: 0.8,
          strokeStyle: vehicle.status === "已送达" ? "dashed" : "solid"
        });
        map.current.add(polyline);
      }
    });
  };

  const createMarkerContent = (vehicle: any) => {
    const statusInfo = statusConfig[vehicle.status as keyof typeof statusConfig];
    return `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${statusInfo.color} shadow-lg">
        <svg class="w-4 h-4 ${statusInfo.textColor}" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
        <div class="absolute -top-1 -right-1 w-3 h-3 ${vehicle.status === '延期' ? 'bg-red-500' : vehicle.status === '已送达' ? 'bg-green-500' : 'bg-blue-500'} rounded-full animate-pulse"></div>
      </div>
    `;
  };

  const createInfoWindowContent = (vehicle: any) => {
    return `
      <div class="p-4 min-w-64">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-lg">${vehicle.vehicle}</h3>
          <span class="px-2 py-1 rounded text-xs ${statusConfig[vehicle.status as keyof typeof statusConfig].color} ${statusConfig[vehicle.status as keyof typeof statusConfig].textColor}">
            ${vehicle.status}
          </span>
        </div>
        <div class="space-y-2 text-sm">
          <div><strong>订单号:</strong> ${vehicle.orderId}</div>
          <div><strong>司机:</strong> ${vehicle.driver}</div>
          <div><strong>货物:</strong> ${vehicle.cargo}</div>
          <div><strong>当前速度:</strong> ${vehicle.speed} km/h</div>
          <div><strong>运输进度:</strong> ${vehicle.progress}%</div>
          <div><strong>预计送达:</strong> ${vehicle.estimatedArrival}</div>
        </div>
      </div>
    `;
  };

  const toggleTrafficLayer = () => {
    if (!map.current) return;
    
    if (!showTrafficLayer) {
      // 添加实时交通图层
      AMapLoader.load({
        key: apiKey,
        version: "2.0",
        plugins: ["AMap.TileLayer.Traffic"]
      }).then((AMap) => {
        const trafficLayer = new AMap.TileLayer.Traffic({
          zIndex: 10
        });
        map.current.add(trafficLayer);
        setShowTrafficLayer(true);
      });
    } else {
      // 移除交通图层
      map.current.getLayers().forEach((layer: any) => {
        if (layer.CLASS_NAME === "AMap.TileLayer.Traffic") {
          map.current.remove(layer);
        }
      });
      setShowTrafficLayer(false);
    }
  };

  const handleApiKeySet = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const centerToVehicle = (vehicleId: string) => {
    const vehicle = mockTransportData.find(v => v.id === vehicleId);
    if (vehicle && map.current) {
      map.current.setCenter(vehicle.position);
      map.current.setZoom(12);
      setSelectedVehicle(vehicleId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">实时地图</h1>
          <p className="text-muted-foreground">可视化运输轨迹和车辆位置</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTrafficLayer}
            className={cn(showTrafficLayer && "bg-primary text-primary-foreground")}
          >
            <Layers className="h-4 w-4 mr-2" />
            实时路况
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowApiKeyDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 车辆列表 */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">运输车辆</h3>
              <Badge variant="secondary">{mockTransportData.length}</Badge>
            </div>
            <div className="space-y-3">
              {mockTransportData.map((vehicle) => {
                const StatusIcon = statusConfig[vehicle.status as keyof typeof statusConfig].icon;
                return (
                  <div
                    key={vehicle.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      selectedVehicle === vehicle.id && "bg-accent border-primary"
                    )}
                    onClick={() => centerToVehicle(vehicle.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{vehicle.vehicle}</span>
                      </div>
                      <Badge 
                        variant={vehicle.status === "延期" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>订单: {vehicle.orderId}</div>
                      <div>司机: {vehicle.driver}</div>
                      <div>货物: {vehicle.cargo}</div>
                      <div className="flex items-center justify-between">
                        <span>进度: {vehicle.progress}%</span>
                        <span>{vehicle.speed} km/h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 地图容器 */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="relative">
              <div 
                ref={mapContainer}
                className="w-full h-[600px] bg-muted"
              />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center">
                    <RotateCcw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">正在加载地图...</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 图例说明 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">图例说明</h3>
        <div className="flex flex-wrap gap-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <div key={status} className="flex items-center space-x-2">
                <div className={cn("w-4 h-4 rounded-full", config.color)} />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{status}</span>
              </div>
            );
          })}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-primary" />
            <span className="text-sm text-muted-foreground">正常路线</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-destructive" />
            <span className="text-sm text-muted-foreground">延期路线</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-secondary border-dashed border-t-2" />
            <span className="text-sm text-muted-foreground">已完成路线</span>
          </div>
        </div>
      </Card>

      {/* API Key 配置对话框 */}
      <MapApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onApiKeySet={handleApiKeySet}
      />
    </div>
  );
}