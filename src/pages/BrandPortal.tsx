import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, Copy } from "lucide-react";
import { toast } from "sonner";
import BrandDashboard from "@/components/brand/BrandDashboard";

const BRANDS = [
  {
    id: "hennessy",
    name: "轩尼诗",
    logo: "H",
    color: "bg-amber-600",
    description: "轩尼诗品牌专属数据看板与业务管理"
  },
  {
    id: "louis-vuitton", 
    name: "路易威登",
    logo: "LV",
    color: "bg-stone-800",
    description: "路易威登品牌专属数据看板与业务管理"
  },
  {
    id: "moet-chandon",
    name: "酩悦香槟",
    logo: "MC",
    color: "bg-emerald-600", 
    description: "酩悦香槟品牌专属数据看板与业务管理"
  },
  {
    id: "tag-heuer",
    name: "豪雅表",
    logo: "TH",
    color: "bg-red-600",
    description: "豪雅表品牌专属数据看板与业务管理"
  }
];

export default function BrandPortal() {
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);

  const handleShareDashboard = () => {
    const dashboardUrl = `${window.location.origin}/brand-portal?brand=${selectedBrand.id}`;
    navigator.clipboard.writeText(dashboardUrl);
    toast.success("看板链接已复制到剪贴板");
  };

  const currentBrand = BRANDS.find(brand => brand.id === selectedBrand.id) || BRANDS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">品牌工作台</h1>
          <p className="text-muted-foreground">
            {currentBrand.description}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedBrand.id} onValueChange={(value) => {
            const brand = BRANDS.find(b => b.id === value);
            if (brand) setSelectedBrand(brand);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${brand.color} rounded-md flex items-center justify-center text-white text-xs font-bold`}>
                      {brand.logo}
                    </div>
                    {brand.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareDashboard}
            className="gap-2"
          >
            <Share className="h-4 w-4" />
            分享看板
          </Button>
        </div>
      </div>

      {/* 品牌链接分享卡片 */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Share className="h-4 w-4" />
            专属看板链接
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
              {window.location.origin}/brand-portal?brand={selectedBrand.id}
            </code>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                const url = `${window.location.origin}/brand-portal?brand=${selectedBrand.id}`;
                navigator.clipboard.writeText(url);
                toast.success("链接已复制");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            此链接可直接分享给{currentBrand.name}品牌相关人员访问专属看板
          </p>
        </CardContent>
      </Card>

      <BrandDashboard selectedBrand={selectedBrand} />
    </div>
  );
}