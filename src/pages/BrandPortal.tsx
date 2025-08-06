import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        </div>
      </div>

      <BrandDashboard selectedBrand={selectedBrand} />
    </div>
  );
}