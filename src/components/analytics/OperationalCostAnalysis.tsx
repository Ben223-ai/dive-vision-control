import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Fuel, Truck, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CostCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: number;
  color: string;
}

interface MonthlyCost {
  month: string;
  transport: number;
  fuel: number;
  labor: number;
  maintenance: number;
  total: number;
}

interface CostPerOrder {
  route: string;
  avgCost: number;
  orders: number;
  totalCost: number;
}

const COST_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#ffb347'];

export default function OperationalCostAnalysis() {
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [costPerOrder, setCostPerOrder] = useState<CostPerOrder[]>([]);
  const [timeRange, setTimeRange] = useState("6m");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostAnalysis();
  }, [timeRange]);

  const fetchCostAnalysis = async () => {
    try {
      await Promise.all([
        fetchCostCategories(),
        fetchMonthlyCosts(),
        fetchCostPerOrder()
      ]);
    } catch (error) {
      console.error("Error fetching cost analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostCategories = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, weight, volume");

      if (error) {
        console.error("Error fetching orders for cost analysis:", error);
        return;
      }

      // Calculate cost categories based on order data
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // Simulate cost breakdown based on industry standards
      const categories: CostCategory[] = [
        {
          name: "运输费用",
          amount: totalRevenue * 0.35,
          percentage: 35,
          trend: -2.1,
          color: COST_COLORS[0]
        },
        {
          name: "燃油成本",
          amount: totalRevenue * 0.25,
          percentage: 25,
          trend: 5.3,
          color: COST_COLORS[1]
        },
        {
          name: "人工成本",
          amount: totalRevenue * 0.20,
          percentage: 20,
          trend: 3.2,
          color: COST_COLORS[2]
        },
        {
          name: "车辆维护",
          amount: totalRevenue * 0.12,
          percentage: 12,
          trend: -1.5,
          color: COST_COLORS[3]
        },
        {
          name: "保险费用",
          amount: totalRevenue * 0.05,
          percentage: 5,
          trend: 0.8,
          color: COST_COLORS[4]
        },
        {
          name: "其他费用",
          amount: totalRevenue * 0.03,
          percentage: 3,
          trend: -0.5,
          color: COST_COLORS[5]
        }
      ];

      setCostCategories(categories);
    } catch (error) {
      console.error("Error calculating cost categories:", error);
    }
  };

  const fetchMonthlyCosts = async () => {
    try {
      const months = timeRange === "6m" ? 6 : 12;
      const monthlyData: MonthlyCost[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        // Simulate monthly cost data with seasonal variations
        const baseTransport = 180000 + Math.random() * 40000;
        const baseFuel = 120000 + Math.random() * 30000;
        const baseLaborCost = 150000 + Math.random() * 20000;
        const baseMaintenance = 50000 + Math.random() * 15000;

        const monthData: MonthlyCost = {
          month: date.toLocaleDateString('zh-CN', { month: 'short' }),
          transport: Math.round(baseTransport),
          fuel: Math.round(baseFuel),
          labor: Math.round(baseLaborCost),
          maintenance: Math.round(baseMaintenance),
          total: Math.round(baseTransport + baseFuel + baseLaborCost + baseMaintenance)
        };

        monthlyData.push(monthData);
      }

      setMonthlyCosts(monthlyData);
    } catch (error) {
      console.error("Error generating monthly cost data:", error);
    }
  };

  const fetchCostPerOrder = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("origin, destination, total_amount, weight");

      if (error) {
        console.error("Error fetching orders for cost per order analysis:", error);
        return;
      }

      // Group by route and calculate average costs
      const routeMap = new Map<string, { totalCost: number; count: number; totalWeight: number }>();
      
      orders?.forEach(order => {
        const route = `${order.origin} → ${order.destination}`;
        const cost = order.total_amount || 0;
        const weight = order.weight || 0;
        
        const current = routeMap.get(route) || { totalCost: 0, count: 0, totalWeight: 0 };
        current.totalCost += cost;
        current.count += 1;
        current.totalWeight += weight;
        routeMap.set(route, current);
      });

      const costData: CostPerOrder[] = Array.from(routeMap.entries())
        .map(([route, data]) => ({
          route,
          avgCost: Math.round(data.totalCost / data.count),
          orders: data.count,
          totalCost: data.totalCost
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 8);

      setCostPerOrder(costData);
    } catch (error) {
      console.error("Error calculating cost per order:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${(amount / 10000).toFixed(1)}万`;
  };

  const totalCost = costCategories.reduce((sum, cat) => sum + cat.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载成本分析数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">运营成本分析</h2>
          <p className="text-sm text-muted-foreground">成本构成分析和趋势监控</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6m">近6个月</SelectItem>
            <SelectItem value="12m">近12个月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">总运营成本</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              <div className="flex items-center space-x-1">
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-sm text-success">-3.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">单票成本</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">¥285</p>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">+1.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Fuel className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">燃油效率</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">8.2L</p>
              <p className="text-sm text-muted-foreground">每100km</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">成本利润率</h3>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">18.5%</p>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-success">+2.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Distribution Pie Chart */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>成本构成分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {costCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Category Details */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>成本分类详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h4 className="text-sm font-medium">{category.name}</h4>
                      <p className="text-xs text-muted-foreground">{category.percentage}% 占比</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(category.amount)}</p>
                    <div className="flex items-center space-x-1">
                      {category.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-destructive" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-success" />
                      )}
                      <span className={cn(
                        "text-xs",
                        category.trend > 0 ? "text-destructive" : "text-success"
                      )}>
                        {Math.abs(category.trend)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cost Trends */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>月度成本趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="transport" stroke="#8884d8" name="运输费用" />
                <Line type="monotone" dataKey="fuel" stroke="#82ca9d" name="燃油成本" />
                <Line type="monotone" dataKey="labor" stroke="#ffc658" name="人工成本" />
                <Line type="monotone" dataKey="maintenance" stroke="#ff7c7c" name="车辆维护" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cost Per Order by Route */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>主要路线成本分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costPerOrder.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <h4 className="font-medium">{route.route}</h4>
                  <p className="text-sm text-muted-foreground">订单量: {route.orders}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">平均成本</p>
                    <p className="text-lg font-bold">¥{route.avgCost}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">总成本</p>
                    <p className="text-lg font-bold">{formatCurrency(route.totalCost)}</p>
                  </div>
                  <Badge variant={route.avgCost < 300 ? "default" : "destructive"}>
                    {route.avgCost < 300 ? "优秀" : "偏高"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}