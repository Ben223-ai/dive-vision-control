import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, MapPin, Brain, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AlertIndicatorProps {
  orderId: string;
  orderNumber: string;
  alerts?: Array<{
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    confidence_score?: number;
  }>;
}

export default function AlertIndicator({ orderId, orderNumber, alerts = [] }: AlertIndicatorProps) {
  const [testing, setTesting] = useState(false);

  const getHighestSeverityAlert = () => {
    if (alerts.length === 0) return null;
    
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return alerts.reduce((highest, current) => {
      const currentSeverity = severityOrder[current.severity as keyof typeof severityOrder] || 0;
      const highestSeverity = severityOrder[highest.severity as keyof typeof severityOrder] || 0;
      return currentSeverity > highestSeverity ? current : highest;
    });
  };

  const triggerTestAlert = async () => {
    setTesting(true);
    try {
      // Call AI alert engine with test data
      const testFactors = {
        route_complexity: Math.floor(Math.random() * 5) + 5, // 5-10
        weather_severity: Math.floor(Math.random() * 4) + 6, // 6-10
        traffic_density: Math.floor(Math.random() * 3) + 7,  // 7-10
        carrier_performance: Math.floor(Math.random() * 3) + 3, // 3-6 (poor performance)
        distance_km: 500 + Math.floor(Math.random() * 300),  // 500-800km
        current_hour: new Date().getHours()
      };

      const response = await supabase.functions.invoke('ai-alert-engine', {
        body: {
          order_id: orderId,
          factors: testFactors
        }
      });

      if (response.error) {
        console.error('Error calling AI alert engine:', response.error);
      } else {
        console.log('AI prediction result:', response.data);
        // Refresh the page to show new alerts
        window.location.reload();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTesting(false);
    }
  };

  const highestAlert = getHighestSeverityAlert();

  if (!highestAlert && alerts.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-success rounded-full"></div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={triggerTestAlert}
          disabled={testing}
          className="text-xs h-6 px-2"
        >
          <Brain className="h-3 w-3 mr-1" />
          {testing ? "测试中..." : "AI测试"}
        </Button>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground animate-pulse";
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "delay_prediction":
        return Clock;
      case "route_deviation":
        return MapPin;
      case "status_anomaly":
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  if (highestAlert) {
    const Icon = getAlertIcon(highestAlert.alert_type);
    return (
      <div className="flex items-center space-x-2">
        <Badge className={getSeverityColor(highestAlert.severity)}>
          <Icon className="h-3 w-3 mr-1" />
          {alerts.length > 1 ? `${alerts.length}个预警` : highestAlert.title}
        </Badge>
        {highestAlert.confidence_score && (
          <span className="text-xs text-muted-foreground">
            AI: {Math.round(highestAlert.confidence_score * 100)}%
          </span>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={triggerTestAlert}
          disabled={testing}
          className="text-xs h-6 px-2"
        >
          <Zap className="h-3 w-3 mr-1" />
          {testing ? "测试中..." : "重新预测"}
        </Button>
      </div>
    );
  }

  return null;
}