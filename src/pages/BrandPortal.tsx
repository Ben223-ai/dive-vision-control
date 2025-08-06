import BrandDashboard from "@/components/brand/BrandDashboard";

export default function BrandPortal() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">品牌工作台</h1>
          <p className="text-muted-foreground">
            轩尼诗品牌专属数据看板与业务管理
          </p>
        </div>
      </div>

      <BrandDashboard />
    </div>
  );
}