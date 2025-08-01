import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface DynamicFormRendererProps {
  templateId?: string;
  onSubmit?: (data: any) => void;
  initialData?: any;
  readonly?: boolean;
}

const DynamicFormRenderer = ({ 
  templateId, 
  onSubmit, 
  initialData, 
  readonly = false 
}: DynamicFormRendererProps) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState<Record<string, boolean>>({});
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    if (templateId) {
      loadFields();
    }
  }, [templateId]);

  useEffect(() => {
    if (initialData && fields.length > 0) {
      // 设置初始值
      fields.forEach(field => {
        if (initialData[field.field_name] !== undefined) {
          setValue(field.field_name, initialData[field.field_name]);
        }
      });
    }
  }, [initialData, fields, setValue]);

  const loadFields = async () => {
    if (!templateId) return;

    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_visible', true)
        .order('sort_order');

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('加载字段失败:', error);
      toast.error('加载表单字段失败');
    }
  };

  const handleFormSubmit = (data: any) => {
    // 处理加密字段
    const processedData = { ...data };
    fields.forEach(field => {
      if (field.is_encrypted && processedData[field.field_name]) {
        // 这里可以实现实际的加密逻辑
        processedData[field.field_name] = btoa(processedData[field.field_name]); // 简单的base64编码示例
      }
    });

    onSubmit?.(processedData);
  };

  const renderField = (field: FormField) => {
    const fieldValue = watch(field.field_name);
    const isEncrypted = field.is_encrypted;
    const shouldShowEncrypted = showEncrypted[field.field_name];

    const toggleEncryptedVisibility = () => {
      setShowEncrypted(prev => ({
        ...prev,
        [field.field_name]: !prev[field.field_name]
      }));
    };

    const commonProps = {
      disabled: readonly,
      required: field.is_required,
      ...register(field.field_name, { required: field.is_required })
    };

    const renderFieldInput = () => {
      switch (field.field_type) {
        case 'text':
          return (
            <Input
              {...commonProps}
              type={isEncrypted && !shouldShowEncrypted ? "password" : "text"}
              placeholder={`请输入${field.field_label}`}
            />
          );

        case 'number':
          return (
            <Input
              {...commonProps}
              type="number"
              placeholder={`请输入${field.field_label}`}
            />
          );

        case 'textarea':
          return (
            <Textarea
              {...commonProps}
              placeholder={`请输入${field.field_label}`}
              rows={3}
            />
          );

        case 'select':
          return (
            <Select
              onValueChange={(value) => setValue(field.field_name, value)}
              value={fieldValue || ''}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder={`请选择${field.field_label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.field_options?.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.field_name}
                checked={fieldValue || false}
                onCheckedChange={(checked) => setValue(field.field_name, checked)}
                disabled={readonly}
              />
              <Label htmlFor={field.field_name}>{field.field_label}</Label>
            </div>
          );

        case 'radio':
          return (
            <RadioGroup
              value={fieldValue || ''}
              onValueChange={(value) => setValue(field.field_name, value)}
              disabled={readonly}
            >
              {field.field_options?.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.field_name}_${option}`} />
                  <Label htmlFor={`${field.field_name}_${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          );

        case 'date':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fieldValue && "text-muted-foreground"
                  )}
                  disabled={readonly}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fieldValue ? (
                    format(new Date(fieldValue), "yyyy-MM-dd")
                  ) : (
                    <span>选择{field.field_label}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fieldValue ? new Date(fieldValue) : undefined}
                  onSelect={(date) => setValue(field.field_name, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          );

        case 'file':
          return (
            <Input
              type="file"
              disabled={readonly}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setValue(field.field_name, file);
                }
              }}
            />
          );

        default:
          return (
            <Input
              {...commonProps}
              placeholder={`请输入${field.field_label}`}
            />
          );
      }
    };

    if (field.field_type === 'checkbox') {
      return renderFieldInput();
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.field_name}>
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {isEncrypted && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleEncryptedVisibility}
            >
              {shouldShowEncrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {renderFieldInput()}
        {errors[field.field_name] && (
          <p className="text-sm text-destructive">
            {field.field_label}为必填项
          </p>
        )}
      </div>
    );
  };

  const calculateGridColumns = () => {
    const maxSpan = Math.max(...fields.map(f => f.grid_column_span));
    return Math.min(maxSpan, 3); // 最多3列
  };

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">暂无表单字段</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${calculateGridColumns()}, 1fr)`
        }}
      >
        {fields.map(field => (
          <div
            key={field.id}
            style={{
              gridColumn: `span ${Math.min(field.grid_column_span, calculateGridColumns())}`
            }}
          >
            {renderField(field)}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? '提交中...' : '提交'}
          </Button>
        </div>
      )}
    </form>
  );
};

export default DynamicFormRenderer;