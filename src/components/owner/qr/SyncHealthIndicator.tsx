import { Activity, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSyncHealth } from '@/contexts/RealtimeSyncProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Phase 2G: Sync Health Indicator
 * 
 * Shows overall real-time sync health across all modules
 * Can be placed in app header/navbar
 */
export function SyncHealthIndicator() {
  const { allConnected, mostRecentSync, modules } = useSyncHealth();

  const getStatusIcon = () => {
    if (allConnected) return <Wifi className="h-4 w-4 text-success" />;
    return <WifiOff className="h-4 w-4 text-warning" />;
  };

  const getStatusText = () => {
    if (allConnected) return 'All synced';
    
    const connectedCount = Object.values(modules).filter(m => m.isConnected).length;
    const totalCount = Object.values(modules).length;
    return `${connectedCount}/${totalCount} synced`;
  };

  const disconnectedModules = Object.entries(modules)
    .filter(([_, module]) => !module.isConnected)
    .map(([name]) => name);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={allConnected ? "default" : "outline"} 
            className="cursor-help gap-2"
          >
            {allConnected ? (
              <Activity className="h-3 w-3 animate-pulse" />
            ) : (
              getStatusIcon()
            )}
            <span className="text-xs">{getStatusText()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">Real-Time Sync Status</p>
            
            <div className="space-y-1 text-xs">
              {Object.entries(modules).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between gap-4">
                  <span className="capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className={status.isConnected ? 'text-success' : 'text-destructive'}>
                    {status.isConnected ? '✓ Connected' : '✗ Disconnected'}
                  </span>
                </div>
              ))}
            </div>
            
            {disconnectedModules.length > 0 && (
              <p className="text-xs text-warning">
                {disconnectedModules.join(', ')} not syncing
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Last sync: {mostRecentSync.toLocaleTimeString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
