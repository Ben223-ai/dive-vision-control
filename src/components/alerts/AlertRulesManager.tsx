import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Clock, MapPin, AlertTriangle, Brain, Save, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AlertRule {
  id: string;
  rule_type: string;
  name: string;
  description: string;
  conditions: any;
  thresholds: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface RuleFormData {
  name: string;
  description: string;
  enabled: boolean;
  thresholds: Record<string, any>;
  conditions: Record<string, any>;
}

const ruleTypeTemplates = {
  delay_prediction: {
    name: "延迟预测规则",
    description: "基于AI模型预测订单延迟风险",
    defaultThresholds: {
      delay_hours_threshold: 2,
      confidence_threshold: 0.7,
      high_risk_threshold: 4,
      critical_risk_threshold: 8
    },
    defaultConditions: {
      factors: ["weather", "traffic", "carrier_performance", "route_complexity"],
      check_interval_minutes: 30,
      min_confidence_score: 0.5
    }
  },
  route_deviation: {
    name: "路线偏离检测",
    description: "检测车辆偏离预定路线的情况",
    defaultThresholds: {
      deviation_threshold_km: 5,
      duration_threshold_minutes: 60,
      warning_threshold_km: 3,
      critical_threshold_km: 10
    },
    defaultConditions: {
      check_interval_minutes: 15,
      ignore_stops: true,
      exclude_rest_areas: true
    }
  },
  status_anomaly: {
    name: "状态更新异常",
    description: "检测订单状态长时间未更新的异常情况",
    defaultThresholds: {
      idle_threshold_hours: 6,
      escalation_hours: 12,
      critical_hours: 24,
      warning_hours: 4
    },
    defaultConditions: {
      monitored_statuses: ["confirmed", "in_transit"],
      exclude_weekends: false,
      business_hours_only: false
    }
  },
  carrier_issue: {
    name: "承运商问题检测",
    description: "监控承运商表现异常",
    defaultThresholds: {
      performance_score_threshold: 7,
      delay_rate_threshold: 0.15,
      complaint_rate_threshold: 0.05
    },
    defaultConditions: {
      evaluation_period_days: 30,
      min_orders_count: 10
    }
  },
  weather_impact: {
    name: "天气影响预警",
    description: "基于天气条件预测运输影响",
    defaultThresholds: {
      severe_weather_threshold: 8,
      visibility_threshold_km: 1,
      wind_speed_threshold_kmh: 60,
      precipitation_threshold_mm: 20
    },
    defaultConditions: {
      forecast_hours: 24,
      affected_route_types: ["highway", "mountain", "coastal"]
    }
  }
};

export default function AlertRulesManager() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    enabled: true,
    thresholds: {},
    conditions: {}
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRuleType, setSelectedRuleType] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("alert_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rules:", error);
        toast({
          title: "错误",
          description: "获取预警规则失败",
          variant: "destructive",
        });
      } else {
        setRules(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      const ruleData = {
        rule_type: editingRule?.rule_type || selectedRuleType,
        name: formData.name,
        description: formData.description,
        conditions: formData.conditions,
        thresholds: formData.thresholds,
        enabled: formData.enabled
      };

      let error;
      if (editingRule) {
        // Update existing rule
        const { error: updateError } = await supabase
          .from("alert_rules")
          .update(ruleData)
          .eq("id", editingRule.id);
        error = updateError;
      } else {
        // Create new rule
        const { error: insertError } = await supabase
          .from("alert_rules")
          .insert([ruleData]);
        error = insertError;
      }

      if (error) {
        console.error("Error saving rule:", error);
        toast({
          title: "错误",
          description: "保存预警规则失败",
          variant: "destructive",
        });
      } else {
        toast({
          title: "成功",
          description: editingRule ? "预警规则已更新" : "预警规则已创建",
        });
        setIsDialogOpen(false);
        setEditingRule(null);
        resetForm();
        fetchRules();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("alert_rules")
        .delete()
        .eq("id", ruleId);

      if (error) {
        console.error("Error deleting rule:", error);
        toast({
          title: "错误",
          description: "删除预警规则失败",
          variant: "destructive",
        });
      } else {
        toast({
          title: "成功",
          description: "预警规则已删除",
        });
        fetchRules();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("alert_rules")
        .update({ enabled })
        .eq("id", ruleId);

      if (error) {
        console.error("Error toggling rule:", error);
        toast({
          title: "错误",
          description: "更新规则状态失败",
          variant: "destructive",
        });
      } else {
        toast({
          title: "成功",
          description: enabled ? "规则已启用" : "规则已禁用",
        });
        fetchRules();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      thresholds: rule.thresholds,
      conditions: rule.conditions
    });
    setIsDialogOpen(true);
  };

  const handleNewRule = (ruleType: string) => {
    const template = ruleTypeTemplates[ruleType as keyof typeof ruleTypeTemplates];
    setSelectedRuleType(ruleType);
    setEditingRule(null);
    setFormData({
      name: template.name,
      description: template.description,
      enabled: true,
      thresholds: template.defaultThresholds,
      conditions: template.defaultConditions
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      enabled: true,
      thresholds: {},
      conditions: {}
    });
    setSelectedRuleType("");
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case "delay_prediction":
        return Clock;
      case "route_deviation":
        return MapPin;
      case "status_anomaly":
        return AlertTriangle;
      case "carrier_issue":
        return Settings;
      case "weather_impact":
        return Brain;
      default:
        return AlertTriangle;
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    const labels: Record<string, string> = {
      delay_prediction: "延迟预测",
      route_deviation: "路线偏离",
      status_anomaly: "状态异常",
      carrier_issue: "承运商问题",
      weather_impact: "天气影响"
    };
    return labels[ruleType] || ruleType;
  };

  const renderThresholdInputs = () => {
    const ruleType = editingRule?.rule_type || selectedRuleType;
    const template = ruleTypeTemplates[ruleType as keyof typeof ruleTypeTemplates];
    
    if (!template) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">阈值设置</h4>
        {Object.entries(template.defaultThresholds).map(([key, defaultValue]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="text-sm">
              {getThresholdLabel(key)}
            </Label>
            <Input
              id={key}
              type="number"
              value={formData.thresholds[key] || defaultValue}
              onChange={(e) => setFormData({
                ...formData,
                thresholds: {
                  ...formData.thresholds,
                  [key]: parseFloat(e.target.value) || 0
                }
              })}
              className="h-8"
              step={key.includes('threshold') && key.includes('confidence') ? "0.1" : "1"}
              min="0"
              max={key.includes('confidence') ? "1" : undefined}
            />
          </div>
        ))}
      </div>
    );
  };

  const getThresholdLabel = (key: string) => {
    const labels: Record<string, string> = {
      delay_hours_threshold: "延迟小时阈值",
      confidence_threshold: "置信度阈值",
      high_risk_threshold: "高风险阈值(小时)",
      critical_risk_threshold: "紧急风险阈值(小时)",
      deviation_threshold_km: "偏离距离阈值(公里)",
      duration_threshold_minutes: "持续时间阈值(分钟)",
      warning_threshold_km: "警告距离阈值(公里)",
      critical_threshold_km: "紧急距离阈值(公里)",
      idle_threshold_hours: "空闲时间阈值(小时)",
      escalation_hours: "升级时间阈值(小时)",
      critical_hours: "紧急时间阈值(小时)",
      warning_hours: "警告时间阈值(小时)",
      performance_score_threshold: "表现评分阈值",
      delay_rate_threshold: "延误率阈值",
      complaint_rate_threshold: "投诉率阈值",
      severe_weather_threshold: "恶劣天气阈值",
      visibility_threshold_km: "能见度阈值(公里)",
      wind_speed_threshold_kmh: "风速阈值(公里/小时)",
      precipitation_threshold_mm: "降水量阈值(毫米)"
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">预警规则管理</h2>
          <p className="text-sm text-muted-foreground">配置和管理智能预警规则阈值</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              新建规则
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "编辑预警规则" : "新建预警规则"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {!editingRule && (
                <div className="space-y-2">
                  <Label>选择规则类型</Label>
                  <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择预警规则类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ruleTypeTemplates).map(([type, template]) => (
                        <SelectItem key={type} value={type}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>规则名称</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入规则名称"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
                  />
                  <Label>启用规则</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>规则描述</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入规则描述"
                />
              </div>

              <Separator />

              {(selectedRuleType || editingRule) && renderThresholdInputs()}

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                    setEditingRule(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleSaveRule}>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => {
          const Icon = getRuleTypeIcon(rule.rule_type);
          return (
            <Card key={rule.id} className="shadow-elegant">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="text-xs">
                      {getRuleTypeLabel(rule.rule_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                    />
                  </div>
                </div>
                <CardTitle className="text-sm">{rule.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rule.description}
                </p>
                
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-foreground">关键阈值</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(rule.thresholds).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground">{getThresholdLabel(key)}:</span>
                        <span className="ml-1 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Badge variant={rule.enabled ? "default" : "secondary"} className="text-xs">
                    {rule.enabled ? "已启用" : "已禁用"}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditRule(rule)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {rules.length === 0 && (
        <Card className="shadow-elegant">
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">暂无预警规则</h3>
            <p className="text-sm text-muted-foreground mb-4">
              创建第一个预警规则，开始智能监控您的运输业务
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              创建预警规则
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}