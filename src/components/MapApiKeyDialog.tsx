import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Key } from "lucide-react";

interface MapApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet: (apiKey: string) => void;
}

export default function MapApiKeyDialog({ open, onOpenChange, onApiKeySet }: MapApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem("amap_api_key", apiKey.trim());
      onApiKeySet(apiKey.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            配置高德地图API Key
          </DialogTitle>
          <DialogDescription>
            为了使用实时地图功能，您需要提供高德地图的API Key
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p>如何获取高德地图API Key：</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>访问高德开放平台</li>
                <li>注册并创建应用</li>
                <li>选择"Web端(JS API)"</li>
                <li>复制生成的Key</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              placeholder="请输入您的高德地图API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open("https://console.amap.com/dev/key/app", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              获取API Key
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit">
                确认
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}