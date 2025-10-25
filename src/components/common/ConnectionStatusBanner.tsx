import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabaseHealthMonitor } from '@/lib/supabase-health-monitor';
import { queryClient } from '@/lib/queryClient';

export const ConnectionStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  
  useEffect(() => {
    const unsubscribe = supabaseHealthMonitor.onHealthChange((healthy) => {
      setIsOnline(healthy);
      setReconnecting(false);
    });
    
    return unsubscribe;
  }, []);
  
  const handleRetry = async () => {
    setReconnecting(true);
    await supabaseHealthMonitor.checkHealth();
    queryClient.refetchQueries({ type: 'active' });
  };
  
  if (isOnline) return null;
  
  return (
    <Alert variant="destructive" className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Connection lost. Some features may not work until reconnected.</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={reconnecting}
          className="ml-4"
        >
          {reconnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Reconnecting...
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Retry Connection
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
