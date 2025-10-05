import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CreditCard, 
  IdCard, 
  Wrench,
  ClipboardCheck,
  FileWarning,
  X 
} from "lucide-react";

interface AlertItem {
  id: string;
  type: 'payment' | 'id' | 'deposit' | 'maintenance' | 'compliance' | 'housekeeping';
  message: string;
  count?: number;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationBannerProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
  onViewAll: (type: string) => void;
}

export const NotificationBanner = ({ alerts, onDismiss, onViewAll }: NotificationBannerProps) => {
  if (!alerts.length) return null;

  const getIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'id': return <IdCard className="h-4 w-4" />;
      case 'deposit': return <CreditCard className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'compliance': return <FileWarning className="h-4 w-4" />;
      case 'housekeeping': return <ClipboardCheck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = (priority: AlertItem['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert 
          key={alert.id} 
          variant={getVariant(alert.priority) as any}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3 flex-1">
            {getIcon(alert.type)}
            <AlertDescription className="flex items-center gap-2">
              <span>{alert.message}</span>
              {alert.count && alert.count > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {alert.count}
                </Badge>
              )}
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAll(alert.type)}
            >
              View All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};