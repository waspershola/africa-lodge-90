import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface QRServiceStatusProps {
  isOnline: boolean;
  lastSync?: string;
  pendingRequests?: number;
}

export const QRServiceStatus = ({ 
  isOnline, 
  lastSync, 
  pendingRequests = 0 
}: QRServiceStatusProps) => {
  return (
    <Card className={`border-2 ${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {pendingRequests > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {pendingRequests} pending
              </Badge>
            )}
            
            <Badge 
              variant="secondary"
              className={isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            >
              {isOnline ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {isOnline ? 'Live' : 'Cached'}
            </Badge>
          </div>
        </div>
        
        {lastSync && (
          <p className="text-xs text-muted-foreground mt-1">
            Last sync: {new Date(lastSync).toLocaleTimeString()}
          </p>
        )}
        
        {!isOnline && (
          <p className="text-xs text-red-600 mt-1">
            Working offline. Your requests will sync when connection is restored.
          </p>
        )}
      </CardContent>
    </Card>
  );
};