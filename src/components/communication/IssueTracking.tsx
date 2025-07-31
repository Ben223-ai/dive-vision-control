import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, AlertTriangle, Bug, User, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  title: string;
  description: string;
  reported_by: string;
  assigned_to: string;
  status: string;
  severity: string;
  order_id: string;
  created_at: string;
}

export default function IssueTracking() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    assigned_to: "",
    severity: "medium",
    order_id: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast({
        title: "错误",
        description: "获取问题列表失败",
        variant: "destructive",
      });
    }
  };

  const createIssue = async () => {
    if (!newIssue.title.trim() || !newIssue.description.trim()) {
      toast({
        title: "错误",
        description: "请填写完整的问题信息",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('issues')
        .insert({
          team_id: 'demo-team-id', // 在实际应用中应该使用真实的团队ID
          title: newIssue.title,
          description: newIssue.description,
          reported_by: 'demo-user', // 在实际应用中应该使用真实的用户ID
          assigned_to: newIssue.assigned_to || null,
          severity: newIssue.severity,
          order_id: newIssue.order_id || null
        });

      if (error) throw error;

      toast({
        title: "成功",
        description: "问题已成功提交",
      });

      setNewIssue({
        title: "",
        description: "",
        assigned_to: "",
        severity: "medium",
        order_id: ""
      });
      setIsDialogOpen(false);
      fetchIssues();
    } catch (error) {
      console.error('Error creating issue:', error);
      toast({
        title: "错误",
        description: "提交问题失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId);

      if (error) throw error;
      
      fetchIssues();
      toast({
        title: "成功",
        description: "问题状态已更新",
      });
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: "错误",
        description: "更新问题状态失败",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'open':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '严重';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return '已解决';
      case 'in_progress':
        return '处理中';
      case 'open':
        return '待处理';
      case 'closed':
        return '已关闭';
      default:
        return '未知';
    }
  };

  return (
    <div className="space-y-6">
      {/* 问题统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">待处理</p>
                <p className="text-2xl font-bold">{issues.filter(i => i.status === 'open').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <Bug className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">处理中</p>
                <p className="text-2xl font-bold">{issues.filter(i => i.status === 'in_progress').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">已解决</p>
                <p className="text-2xl font-bold">{issues.filter(i => i.status === 'resolved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">严重问题</p>
                <p className="text-2xl font-bold">{issues.filter(i => i.severity === 'critical').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 问题列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>问题跟踪</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  报告问题
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>报告新问题</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">问题标题</Label>
                    <Input
                      id="title"
                      value={newIssue.title}
                      onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                      placeholder="输入问题标题..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">问题描述</Label>
                    <Textarea
                      id="description"
                      value={newIssue.description}
                      onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                      placeholder="详细描述问题..."
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assigned_to">指派给</Label>
                    <Input
                      id="assigned_to"
                      value={newIssue.assigned_to}
                      onChange={(e) => setNewIssue({ ...newIssue, assigned_to: e.target.value })}
                      placeholder="输入用户ID..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="severity">严重程度</Label>
                    <Select value={newIssue.severity} onValueChange={(value) => setNewIssue({ ...newIssue, severity: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="critical">严重</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="order_id">关联订单ID</Label>
                    <Input
                      id="order_id"
                      value={newIssue.order_id}
                      onChange={(e) => setNewIssue({ ...newIssue, order_id: e.target.value })}
                      placeholder="可选：关联的订单ID..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={createIssue} disabled={loading}>
                    提交问题
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{issue.title}</h3>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {getSeverityText(issue.severity)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        报告者: {issue.reported_by}
                      </span>
                      {issue.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          指派给: {issue.assigned_to}
                        </span>
                      )}
                      {issue.order_id && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          订单: {issue.order_id}
                        </span>
                      )}
                      <span>
                        创建时间: {new Date(issue.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={issue.status} onValueChange={(value) => updateIssueStatus(issue.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">待处理</SelectItem>
                        <SelectItem value="in_progress">处理中</SelectItem>
                        <SelectItem value="resolved">已解决</SelectItem>
                        <SelectItem value="closed">已关闭</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}