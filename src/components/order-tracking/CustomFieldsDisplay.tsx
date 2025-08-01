import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CustomFieldsDisplayProps {
  customFields: Record<string, any>;
  templateId?: string;
}

const CustomFieldsDisplay = ({ customFields, templateId }: CustomFieldsDisplayProps) => {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  const renderFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? "default" : "secondary"}>{value ? "是" : "否"}</Badge>;
    }

    if (Array.isArray(value)) {
      return <span>{value.join(', ')}</span>;
    }

    if (typeof value === 'object') {
      return <span>{JSON.stringify(value)}</span>;
    }

    return <span>{String(value)}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">自定义字段</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(customFields).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <div className="text-sm">
                {renderFieldValue(key, value)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomFieldsDisplay;