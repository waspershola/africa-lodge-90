import { motion } from 'framer-motion';
import { WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface OfflineBannerProps {
  timeRemaining: number; // in seconds
  isReadOnly: boolean;
}

export default function OfflineBanner({ timeRemaining, isReadOnly }: OfflineBannerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const totalOfflineTime = 24 * 60 * 60; // 24 hours in seconds
  const progressValue = ((totalOfflineTime - timeRemaining) / totalOfflineTime) * 100;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-destructive/10 border-b border-destructive/20"
    >
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-destructive/30 bg-transparent">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-destructive" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <AlertDescription className="text-destructive font-medium">
                  {isReadOnly ? (
                    <>
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Offline mode expired - Dashboard is now read-only
                    </>
                  ) : (
                    `Offline Mode Active - ${minutes}:${seconds.toString().padStart(2, '0')} remaining`
                  )}
                </AlertDescription>
                {!isReadOnly && (
                  <span className="text-xs text-destructive/80">
                    {Math.round(progressValue)}% elapsed
                  </span>
                )}
              </div>
              
              {!isReadOnly && (
                <Progress 
                  value={progressValue} 
                  className="h-1.5 bg-destructive/20"
                />
              )}
              
              <p className="text-xs text-destructive/80">
                {isReadOnly 
                  ? "All actions are disabled. Reconnect to internet to restore functionality."
                  : "Actions are being queued and will sync when connection is restored."
                }
              </p>
            </div>
          </div>
        </Alert>
      </div>
    </motion.div>
  );
}