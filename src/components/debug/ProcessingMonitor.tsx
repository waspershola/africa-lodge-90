import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface ProcessingMonitorProps {
  isProcessing: boolean;
  processingStartTime?: Date;
  operation?: string;
}

export const ProcessingMonitor: React.FC<ProcessingMonitorProps> = ({
  isProcessing,
  processingStartTime,
  operation = 'Operation'
}) => {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!isProcessing || !processingStartTime) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - processingStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, processingStartTime]);

  if (!isProcessing) return null;

  const getStatusColor = () => {
    if (elapsed < 5) return 'bg-blue-100 text-blue-800';
    if (elapsed < 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getIcon = () => {
    if (elapsed < 5) return <Clock className="h-4 w-4" />;
    if (elapsed < 15) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {getIcon()}
          Processing Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Operation:</span>
            <span className="text-sm font-medium">{operation}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <Badge className={getStatusColor()}>
              {elapsed}s
            </Badge>
          </div>
          {elapsed > 10 && (
            <div className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Taking longer than expected
            </div>
          )}
          {elapsed > 25 && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              May timeout in {30 - elapsed}s
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};