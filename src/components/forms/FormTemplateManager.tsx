import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Settings, Eye, EyeOff, Lock, Unlock, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableFieldItem';

interface FormField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options?: any;
  is_required: boolean;
  is_encrypted: boolean;
  is_visible: boolean;
  sort_order: number;
  grid_column_span: number;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
}

const FormTemplateManager = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fieldTypes = [
    { value: 'text', label: '文本输入' },
    { value: 'number', label: '数字输入' },
    { value: 'textarea', label: '多行文本' },
    { value: 'select', label: '下拉选择' },
    { value: 'date', label: '日期选择' },
    { value: 'checkbox', label: '复选框' },
    { value: 'radio', label: '单选框' },
    { value: 'file', label: '文件上传' },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadFields(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
      
      if (data && data.length > 0) {
        const defaultTemplate = data.find(t => t.is_default) || data[0];
        setSelectedTemplate(defaultTemplate);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      toast.error('加载模板失败');
    }
  };

  const loadFields = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order');

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('加载字段失败:', error);
      toast.error('加载字段失败');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);
      
      const newFields = arrayMove(fields, oldIndex, newIndex);
      
      // 更新排序
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        sort_order: index + 1
      }));
      
      setFields(updatedFields);
      
      // 批量更新数据库
      try {
        const updates = updatedFields.map(field => ({
          id: field.id,
          sort_order: field.sort_order
        }));

        for (const update of updates) {
          await supabase
            .from('form_fields')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }
        
        toast.success('字段顺序已更新');
      } catch (error) {
        console.error('更新排序失败:', error);
        toast.error('更新排序失败');
        // 恢复原始顺序
        loadFields(selectedTemplate!.id);
      }
    }
  };

  const saveField = async (fieldData: Partial<FormField>) => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      if (editingField) {
        // 更新字段
        const { error } = await supabase
          .from('form_fields')
          .update(fieldData)
          .eq('id', editingField.id);

        if (error) throw error;
        toast.success('字段更新成功');
      } else {
        // 创建新字段
        const { error } = await supabase
          .from('form_fields')
          .insert([{
            field_name: fieldData.field_name!,
            field_label: fieldData.field_label!,
            field_type: fieldData.field_type || 'text',
            field_options: fieldData.field_options,
            is_required: fieldData.is_required || false,
            is_encrypted: fieldData.is_encrypted || false,
            is_visible: fieldData.is_visible ?? true,
            grid_column_span: fieldData.grid_column_span || 1,
            template_id: selectedTemplate.id,
            sort_order: fields.length + 1
          }]);

        if (error) throw error;
        toast.success('字段创建成功');
      }

      loadFields(selectedTemplate.id);
      setIsFieldDialogOpen(false);
      setEditingField(null);
    } catch (error) {
      console.error('保存字段失败:', error);
      toast.error('保存字段失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleFieldVisibility = async (field: FormField) => {
    try {
      const { error } = await supabase
        .from('form_fields')
        .update({ is_visible: !field.is_visible })
        .eq('id', field.id);

      if (error) throw error;
      
      setFields(fields.map(f => 
        f.id === field.id ? { ...f, is_visible: !f.is_visible } : f
      ));
      
      toast.success(`字段已${field.is_visible ? '隐藏' : '显示'}`);
    } catch (error) {
      console.error('切换字段可见性失败:', error);
      toast.error('操作失败');
    }
  };

  const toggleFieldEncryption = async (field: FormField) => {
    try {
      const { error } = await supabase
        .from('form_fields')
        .update({ is_encrypted: !field.is_encrypted })
        .eq('id', field.id);

      if (error) throw error;
      
      setFields(fields.map(f => 
        f.id === field.id ? { ...f, is_encrypted: !f.is_encrypted } : f
      ));
      
      toast.success(`字段${field.is_encrypted ? '取消' : ''}加密成功`);
    } catch (error) {
      console.error('切换字段加密失败:', error);
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 模板选择 */}
      <Card>
        <CardHeader>
          <CardTitle>表单模板管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedTemplate?.id || ''} onValueChange={(value) => {
              const template = templates.find(t => t.id === value);
              setSelectedTemplate(template || null);
            }}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="选择模板" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.is_default && '(默认)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              新建模板
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 字段配置 */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>字段配置 - {selectedTemplate.name}</CardTitle>
              <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingField(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加字段
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingField ? '编辑字段' : '添加字段'}
                    </DialogTitle>
                  </DialogHeader>
                  <FieldEditor
                    field={editingField}
                    fieldTypes={fieldTypes}
                    onSave={saveField}
                    loading={loading}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {fields.map(field => (
                    <SortableItem key={field.id} id={field.id}>
                      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{field.field_label}</span>
                            <Badge variant="outline">{fieldTypes.find(t => t.value === field.field_type)?.label}</Badge>
                            {field.is_required && <Badge variant="secondary">必填</Badge>}
                            {field.is_encrypted && <Lock className="h-3 w-3 text-warning" />}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            字段名: {field.field_name}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFieldVisibility(field)}
                          >
                            {field.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFieldEncryption(field)}
                          >
                            {field.is_encrypted ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingField(field);
                              setIsFieldDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 字段编辑器组件
const FieldEditor = ({ field, fieldTypes, onSave, loading }: {
  field: FormField | null;
  fieldTypes: { value: string; label: string }[];
  onSave: (data: Partial<FormField>) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState({
    field_name: field?.field_name || '',
    field_label: field?.field_label || '',
    field_type: field?.field_type || 'text',
    is_required: field?.is_required || false,
    is_encrypted: field?.is_encrypted || false,
    is_visible: field?.is_visible ?? true,
    grid_column_span: field?.grid_column_span || 1,
    field_options: field?.field_options || null,
  });

  const [selectOptions, setSelectOptions] = useState(
    formData.field_options?.options?.join('\n') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let fieldOptions = formData.field_options;
    if (formData.field_type === 'select' && selectOptions.trim()) {
      fieldOptions = {
        options: selectOptions.split('\n').filter(opt => opt.trim())
      };
    }

    onSave({
      ...formData,
      field_options: fieldOptions
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="field_name">字段名</Label>
          <Input
            id="field_name"
            value={formData.field_name}
            onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
            placeholder="field_name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="field_label">显示标签</Label>
          <Input
            id="field_label"
            value={formData.field_label}
            onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
            placeholder="显示名称"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_type">字段类型</Label>
        <Select value={formData.field_type} onValueChange={(value) => setFormData({ ...formData, field_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.field_type === 'select' && (
        <div className="space-y-2">
          <Label htmlFor="options">选项 (每行一个)</Label>
          <textarea
            id="options"
            className="w-full min-h-[100px] p-2 border rounded"
            value={selectOptions}
            onChange={(e) => setSelectOptions(e.target.value)}
            placeholder="选项1&#10;选项2&#10;选项3"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_required"
            checked={formData.is_required}
            onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
          />
          <Label htmlFor="is_required">必填</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="is_encrypted"
            checked={formData.is_encrypted}
            onCheckedChange={(checked) => setFormData({ ...formData, is_encrypted: checked })}
          />
          <Label htmlFor="is_encrypted">加密</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
};

export default FormTemplateManager;