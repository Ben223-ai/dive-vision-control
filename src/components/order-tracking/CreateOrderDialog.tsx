import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import DynamicFormRenderer from "@/components/forms/DynamicFormRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

interface OrderItem {
  id: string;
  item_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  weight?: number;
  volume?: number;
  sku?: string;
  category?: string;
}

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
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    loadDefaultTemplate();
  }, []);

  const loadDefaultTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('id')
        .eq('template_type', 'order_create')
        .eq('is_default', true)
        .single();

      if (error) throw error;
      setDefaultTemplateId(data.id);
    } catch (error) {
      console.error('加载默认模板失败:', error);
    }
  };

  const handleDynamicFormSubmit = async (formData: any) => {
    if (!validateForm(formData)) return;

    setLoading(true);
    try {
      // 分离标准字段和自定义字段
      const standardFields = ['order_number', 'customer_name', 'origin', 'destination', 'carrier', 'estimated_delivery'];
      const standardData: any = {};
      const customData: any = {};

      Object.keys(formData).forEach(key => {
        if (standardFields.includes(key)) {
          standardData[key] = formData[key];
        } else {
          customData[key] = formData[key];
        }
      });

      const orderData = {
        ...standardData,
        order_number: standardData.order_number || generateOrderNumber(),
        status: 'pending',
        progress: 0,
        estimated_delivery: standardData.estimated_delivery?.toISOString?.() || standardData.estimated_delivery,
        total_amount: calculateTotalAmount(),
        custom_fields: customData, // 存储自定义字段数据
      };

      // 创建订单
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // 创建订单明细
      if (orderItems.length > 0) {
        const itemsData = orderItems.map(item => ({
          order_id: orderResult.id,
          item_name: item.item_name,
          item_description: item.item_description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          weight: item.weight,
          volume: item.volume,
          sku: item.sku,
          category: item.category,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsData);

        if (itemsError) throw itemsError;
      }

      toast.success('订单创建成功！');
      setOpen(false);
      setOrderItems([]);
      window.location.reload();
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.toString().slice(-8)}${random}`;
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      item_name: '',
      item_description: '',
      quantity: 1,
      unit_price: 0,
      weight: undefined,
      volume: undefined,
      sku: '',
      category: '',
    };
    setOrderItems(prev => [...prev, newItem]);
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const updateOrderItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrderItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const validateForm = (formData: any) => {
    if (!formData.customer_name?.trim()) {
      toast.error('请输入客户名称');
      return false;
    }
    if (!formData.origin?.trim()) {
      toast.error('请输入起点地址');
      return false;
    }
    if (!formData.destination?.trim()) {
      toast.error('请输入终点地址');
      return false;
    }
    if (!formData.carrier?.trim()) {
      toast.error('请选择承运商');
      return false;
    }
    if (orderItems.length === 0) {
      toast.error('请至少添加一个订单明细');
      return false;
    }
    for (const item of orderItems) {
      if (!item.item_name.trim()) {
        toast.error('请填写所有明细的商品名称');
        return false;
      }
      if (item.quantity <= 0) {
        toast.error('商品数量必须大于0');
        return false;
      }
      if (item.unit_price < 0) {
        toast.error('商品单价不能为负数');
        return false;
      }
    }
    return true;
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          创建订单
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新订单</DialogTitle>
          <DialogDescription>
            填写订单详细信息，创建新的物流订单
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 - 使用动态表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              {defaultTemplateId ? (
                <DynamicFormRenderer
                  templateId={defaultTemplateId}
                  onSubmit={handleDynamicFormSubmit}
                />
              ) : (
                <p className="text-center text-muted-foreground">加载表单模板中...</p>
              )}
            </CardContent>
          </Card>

          {/* 订单明细 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">订单明细</CardTitle>
                <Button onClick={addOrderItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  添加明细
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>暂无订单明细，点击"添加明细"开始添加商品</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">明细 {index + 1}</h4>
                        <Button
                          onClick={() => removeOrderItem(item.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 商品名称 */}
                        <div className="space-y-2">
                          <Label>商品名称 *</Label>
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateOrderItem(item.id, 'item_name', e.target.value)}
                            placeholder="输入商品名称"
                          />
                        </div>

                        {/* 数量 */}
                        <div className="space-y-2">
                          <Label>数量 *</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="数量"
                            min="0"
                            step="1"
                          />
                        </div>

                        {/* 单价 */}
                        <div className="space-y-2">
                          <Label>单价 (元) *</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateOrderItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            placeholder="单价"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {/* SKU */}
                        <div className="space-y-2">
                          <Label>SKU</Label>
                          <Input
                            value={item.sku || ''}
                            onChange={(e) => updateOrderItem(item.id, 'sku', e.target.value)}
                            placeholder="商品编码"
                          />
                        </div>

                        {/* 重量 */}
                        <div className="space-y-2">
                          <Label>重量 (kg)</Label>
                          <Input
                            type="number"
                            value={item.weight || ''}
                            onChange={(e) => updateOrderItem(item.id, 'weight', parseFloat(e.target.value) || undefined)}
                            placeholder="重量"
                            min="0"
                            step="0.1"
                          />
                        </div>

                        {/* 体积 */}
                        <div className="space-y-2">
                          <Label>体积 (m³)</Label>
                          <Input
                            type="number"
                            value={item.volume || ''}
                            onChange={(e) => updateOrderItem(item.id, 'volume', parseFloat(e.target.value) || undefined)}
                            placeholder="体积"
                            min="0"
                            step="0.001"
                          />
                        </div>

                        {/* 商品描述 */}
                        <div className="space-y-2 md:col-span-3">
                          <Label>商品描述</Label>
                          <Textarea
                            value={item.item_description}
                            onChange={(e) => updateOrderItem(item.id, 'item_description', e.target.value)}
                            placeholder="输入商品描述"
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* 小计 */}
                      <div className="flex justify-end">
                        <div className="text-sm text-muted-foreground">
                          小计: ¥{(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Separator />
                  
                  {/* 总计 */}
                  <div className="flex justify-end">
                    <div className="text-lg font-semibold">
                      总金额: ¥{calculateTotalAmount().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;