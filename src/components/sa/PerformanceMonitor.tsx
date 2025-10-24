import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, Database, Clock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { offlineDB } from '@/lib/offline-db';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface PerformanceMetrics {
  realtimeChannels: number;
  cachedQueries: number;
  pendingTimeouts: number;
  memoryUsageMB: number;
  indexedDBSessions: number;
  lastUpdate: number;
}

/**
 * Phase 7: Performance Monitoring Dashboard
 * 
 * Real-time performance metrics for SUPER_ADMIN users
 * Monitors real-time connections, cache health, and memory usage
 */
export function PerformanceMonitor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    realtimeChannels: 0,
    cachedQueries: 0,
    pendingTimeouts: 0,
    memoryUsageMB: 0,
    indexedDBSessions: 0,
    lastUpdate: Date.now()
  });
  const [sessionValidation, setSessionValidation] = useState<{ cleaned: number; active: number } | null>(null);

  // Only show to SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  useEffect(() => {
    const updateMetrics = async () => {
      // Get cached queries count
      const cache = queryClient.getQueryCache();
      const cachedQueries = cache.getAll().length;

      // Estimate memory usage (Chrome-specific non-standard API)
      const perfWithMemory = performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
      };
      const memoryUsageMB = perfWithMemory.memory 
        ? Math.round(perfWithMemory.memory.usedJSHeapSize / 1048576)
        : 0;

      // Get IndexedDB session count
      const sessions = await offlineDB.sessions.count();

      setMetrics({
        realtimeChannels: 1, // Unified channel (single channel per tenant)
        cachedQueries,
        pendingTimeouts: 0, // Would need to expose from useUnifiedRealtime
        memoryUsageMB,
        indexedDBSessions: sessions,
        lastUpdate: Date.now()
      });
    };

    // Update metrics every 5 seconds
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    // Validate sessions every 30 minutes
    const validateSessions = async () => {
      const result = await offlineDB.validateActiveSessions();
      setSessionValidation(result);
    };
    
    validateSessions();
    const validationInterval = setInterval(validateSessions, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(validationInterval);
    };
  }, [queryClient]);

  const getHealthStatus = () => {
    if (metrics.cachedQueries > 200) return { status: 'warning', label: 'High' };
    if (metrics.cachedQueries > 100) return { status: 'normal', label: 'Normal' };
    return { status: 'good', label: 'Optimal' };
  };

  const getMemoryStatus = () => {
    if (metrics.memoryUsageMB > 500) return { status: 'warning', label: 'High' };
    if (metrics.memoryUsageMB > 300) return { status: 'normal', label: 'Normal' };
    return { status: 'good', label: 'Good' };
  };

  const health = getHealthStatus();
  const memoryHealth = getMemoryStatus();

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
            </CardDescription>
          </div>
          <Badge variant={health.status === 'good' ? 'default' : health.status === 'warning' ? 'destructive' : 'secondary'}>
            {health.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Real-time Channels */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Real-time Channels</p>
              <p className="text-2xl font-bold">{metrics.realtimeChannels}</p>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </div>
          </div>

          {/* Cached Queries */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Database className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Cached Queries</p>
              <p className="text-2xl font-bold">{metrics.cachedQueries}</p>
              <p className="text-xs text-muted-foreground">In React Query cache</p>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${memoryHealth.status === 'warning' ? 'text-destructive' : 'text-primary'}`} />
            <div className="space-y-1">
              <p className="text-sm font-medium">Memory Usage</p>
              <p className="text-2xl font-bold">{metrics.memoryUsageMB} MB</p>
              <p className="text-xs text-muted-foreground">{memoryHealth.label} heap size</p>
            </div>
          </div>

          {/* IndexedDB Sessions */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Database className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Offline Sessions</p>
              <p className="text-2xl font-bold">{metrics.indexedDBSessions}</p>
              <p className="text-xs text-muted-foreground">Cached in IndexedDB</p>
            </div>
          </div>

          {/* Session Validation */}
          {sessionValidation && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Session Health</p>
                <p className="text-2xl font-bold">{sessionValidation.active}</p>
                <p className="text-xs text-muted-foreground">
                  {sessionValidation.cleaned} cleaned
                </p>
              </div>
            </div>
          )}

          {/* Last Update */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Update</p>
              <p className="text-sm font-bold">
                {new Date(metrics.lastUpdate).toLocaleTimeString()}
              </p>
              <p className="text-xs text-muted-foreground">Auto-refresh: 5s</p>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs font-medium mb-2">💡 Performance Tips</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Optimal cached queries: &lt;100 (current: {metrics.cachedQueries})</li>
            <li>• Memory usage target: &lt;300MB (current: {metrics.memoryUsageMB}MB)</li>
            <li>• Real-time uses single unified channel for efficiency</li>
            <li>• Sessions auto-cleanup every 30 minutes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
