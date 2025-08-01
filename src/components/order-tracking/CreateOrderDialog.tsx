import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreateOrderData {
  order_number: string;
  customer_name: string;
  origin: string;
  destination: string;
  carrier: string;
  total_amount: number;
  weight?: number;
  volume?: number;
  estimated_delivery?: Date;
}

const CreateOrderDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrderData>({
    order_number: '',
    customer_name: '',
    origin: '',
    destination: '',
    carrier: '',
    total_amount: 0,
    weight: undefined,
    volume: undefined,
    estimated_delivery: undefined,
  });

  const handleInputChange = (field: keyof CreateOrderData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.toString().slice(-8)}${random}`;
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      toast.error('请输入客户名称');
      return false;
    }
    if (!formData.origin.trim()) {
      toast.error('请输入起点地址');
      return false;
    }
    if (!formData.destination.trim()) {
      toast.error('请输入终点地址');
      return false;
    }
    if (!formData.carrier.trim()) {
      toast.error('请选择承运商');
      return false;
    }
    if (formData.total_amount <= 0) {
      toast.error('请输入有效的订单金额');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        ...formData,
        order_number: formData.order_number || generateOrderNumber(),
        status: 'pending',
        progress: 0,
        estimated_delivery: formData.estimated_delivery?.toISOString(),
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      toast.success('订单创建成功！');
      setOpen(false);
      setFormData({
        order_number: '',
        customer_name: '',
        origin: '',
        destination: '',
        carrier: '',
        total_amount: 0,
        weight: undefined,
        volume: undefined,
        estimated_delivery: undefined,
      });

      // 刷新页面数据
      window.location.reload();
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          创建订单
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新订单</DialogTitle>
          <DialogDescription>
            填写订单详细信息，创建新的物流订单
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* 订单号 */}
          <div className="space-y-2">
            <Label htmlFor="order_number">订单号</Label>
            <Input
              id="order_number"
              value={formData.order_number}
              onChange={(e) => handleInputChange('order_number', e.target.value)}
              placeholder="留空自动生成"
            />
          </div>

          {/* 客户名称 */}
          <div className="space-y-2">
            <Label htmlFor="customer_name">客户名称 *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              placeholder="输入客户名称"
              required
            />
          </div>

          {/* 起点地址 */}
          <div className="space-y-2">
            <Label htmlFor="origin">起点地址 *</Label>
            <Input
              id="origin"
              value={formData.origin}
              onChange={(e) => handleInputChange('origin', e.target.value)}
              placeholder="输入起点地址"
              required
            />
          </div>

          {/* 终点地址 */}
          <div className="space-y-2">
            <Label htmlFor="destination">终点地址 *</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              placeholder="输入终点地址"
              required
            />
          </div>

          {/* 承运商 */}
          <div className="space-y-2">
            <Label htmlFor="carrier">承运商 *</Label>
            <Select onValueChange={(value) => handleInputChange('carrier', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择承运商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="顺丰速运">顺丰速运</SelectItem>
                <SelectItem value="中通快递">中通快递</SelectItem>
                <SelectItem value="圆通速递">圆通速递</SelectItem>
                <SelectItem value="申通快递">申通快递</SelectItem>
                <SelectItem value="韵达速递">韵达速递</SelectItem>
                <SelectItem value="德邦物流">德邦物流</SelectItem>
                <SelectItem value="安能物流">安能物流</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 订单金额 */}
          <div className="space-y-2">
            <Label htmlFor="total_amount">订单金额 (元) *</Label>
            <Input
              id="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
              placeholder="输入订单金额"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* 重量 */}
          <div className="space-y-2">
            <Label htmlFor="weight">重量 (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
              placeholder="输入重量"
              min="0"
              step="0.1"
            />
          </div>

          {/* 体积 */}
          <div className="space-y-2">
            <Label htmlFor="volume">体积 (m³)</Label>
            <Input
              id="volume"
              type="number"
              value={formData.volume || ''}
              onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || undefined)}
              placeholder="输入体积"
              min="0"
              step="0.001"
            />
          </div>

          {/* 预计送达时间 */}
          <div className="space-y-2 md:col-span-2">
            <Label>预计送达时间</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.estimated_delivery && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.estimated_delivery ? (
                    format(formData.estimated_delivery, "yyyy-MM-dd")
                  ) : (
                    <span>选择预计送达日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.estimated_delivery}
                  onSelect={(date) => handleInputChange('estimated_delivery', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '创建中...' : '创建订单'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;