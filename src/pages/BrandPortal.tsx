import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("登录失败: " + error.message);
    } else {
      toast.success("登录成功");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/brand-portal`
      }
    });

    if (error) {
      toast.error("注册失败: " + error.message);
    } else {
      toast.success("注册成功！请检查邮箱进行验证");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("登出失败: " + error.message);
    } else {
      toast.success("已安全登出");
    }
  };

  const currentBrand = BRANDS.find(brand => brand.id === selectedBrand.id) || BRANDS[0];

  // Show login/register form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">品牌方登录</CardTitle>
            <p className="text-muted-foreground">请登录或注册访问品牌专属工作台</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="h-4 w-4 mr-2" />
                    {loading ? "登录中..." : "登录"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">邮箱</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">密码</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码 (至少6位)"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {loading ? "注册中..." : "注册"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold">测试账号：</p>
              <p className="text-xs text-muted-foreground">hennessy@test.com / Hennessy123!</p>
              <p className="text-xs text-muted-foreground">lv@test.com / LouisVuitton123!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </div>
      </div>

      <BrandDashboard selectedBrand={selectedBrand} />
    </div>
  );
}