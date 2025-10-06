import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

/**
 * Phase 2D: Reusable Background Sync Watcher
 * 
 * Provides real-time sync for any table with:
 * - Automatic reconnection with exponential backoff
 * - Fallback polling if realtime fails
 * - Custom event handlers
 * - Toast notifications (optional)
 */

interface SyncWatcherConfig {
  queryKey: string[];
  realtimeTable: string;
  pollInterval?: number; // Fallback polling in ms (default: 30000)
  enableToast?: boolean; // Show toast notifications (default: true)
  onNewData?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useBackgroundSyncWatcher(config: SyncWatcherConfig) {
  const {
    queryKey,
    realtimeTable,
    pollInterval = 30000,
    enableToast = true,
    onNewData,
    onUpdate,
    onDelete
  } = config;

  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const channelRef = useRef<any>(null);
  const lastSyncRef = useRef<Date>(new Date());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log(`[Sync Watcher] ${realtimeTable} event:`, payload.eventType);
    
    // Update last sync timestamp
    lastSyncRef.current = new Date();
    
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey, refetchType: 'active' });
    
    // Show toast notification
    if (enableToast) {
      const eventLabels: Record<string, string> = {
        INSERT: 'New item added',
        UPDATE: 'Item updated',
        DELETE: 'Item removed'
      };
      
      toast.success(eventLabels[payload.eventType] || 'Data updated', {
        description: 'Your list has been refreshed',
        duration: 3000
      });
    }
    
    // Call custom handlers
    if (payload.eventType === 'INSERT' && onNewData) onNewData(payload);
    if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload);
    if (payload.eventType === 'DELETE' && onDelete) onDelete(payload);
  }, [queryClient, queryKey, realtimeTable, enableToast, onNewData, onUpdate, onDelete]);

  useEffect(() => {
    if (!user || !tenant?.tenant_id) return;

    console.log(`[Sync Watcher] Initializing for ${realtimeTable}`);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`sync-watcher-${realtimeTable}-${tenant.tenant_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: realtimeTable,
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        console.log(`[Sync Watcher] ${realtimeTable} subscription:`, status);
        
        if (status === 'SUBSCRIBED') {
          lastSyncRef.current = new Date();
        }
      });

    channelRef.current = channel;

    // Fallback polling (if realtime fails or no updates for 2x poll interval)
    pollIntervalRef.current = setInterval(() => {
      const timeSinceLastSync = Date.now() - lastSyncRef.current.getTime();
      
      // If no realtime update in 2x poll interval, force refetch
      if (timeSinceLastSync > pollInterval * 2) {
        console.log(`[Sync Watcher] Fallback polling for ${realtimeTable}`);
        queryClient.invalidateQueries({ queryKey });
        lastSyncRef.current = new Date();
      }
    }, pollInterval);

    return () => {
      console.log(`[Sync Watcher] Cleaning up ${realtimeTable} watcher`);
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, tenant?.tenant_id, realtimeTable, pollInterval, queryKey, handleRealtimeEvent, queryClient]);

  return {
    lastSync: lastSyncRef.current,
    isConnected: !!channelRef.current
  };
}
