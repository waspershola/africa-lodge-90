import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProcessingStateManagerProps {
  isProcessing: boolean;
  operation: string;
  startTime?: number;
  onTimeout?: () => void;
  onCancel?: () => void;
  timeoutMs?: number;
}

export const ProcessingStateManager = ({
  isProcessing,
  operation,
  startTime,
  onTimeout,
  onCancel,
  timeoutMs = 30000
}: ProcessingStateManagerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isProcessing || !startTime) {
      setElapsedTime(0);
      setHasTimedOut(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      if (elapsed >= timeoutMs && !hasTimedOut) {
        setHasTimedOut(true);
        onTimeout?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, startTime, timeoutMs, hasTimedOut, onTimeout]);

  if (!isProcessing) return null;

  const seconds = Math.floor(elapsedTime / 1000);
  const isWarning = seconds > 10;
  const isCritical = seconds > 20;

  return (
    <Card className="border-primary">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {hasTimedOut ? (
              <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
            ) : isCritical ? (
              <AlertCircle className="h-5 w-5 text-orange-500 animate-pulse" />
            ) : isWarning ? (
              <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
            ) : (
              <Clock className="h-5 w-5 text-primary animate-spin" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="font-medium">
              {hasTimedOut ? 'Operation Timeout' : `Processing ${operation}...`}
            </div>
            <div className="text-sm text-muted-foreground">
              {hasTimedOut ? (
                'The operation is taking longer than expected'
              ) : (
                `Elapsed time: ${seconds}s${isCritical ? ' (taking longer than usual)' : ''}`
              )}
            </div>
          </div>

          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasTimedOut && (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The operation has timed out. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        )}

        {isCritical && !hasTimedOut && (
          <Alert className="mt-3">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This operation is taking longer than usual. Please wait or try refreshing if it doesn't complete soon.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};