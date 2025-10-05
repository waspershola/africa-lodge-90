import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineDB, OfflineRequest } from '@/lib/offline-db';
import { supabase } from '@/integrations/supabase/client';
import { JWTClient } from '@/lib/jwt-client';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt?: Date;
  lastError?: string;
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0
  });

  const updatePendingCount = async () => {
    const pending = await offlineDB.getPendingRequests();
    setSyncStatus(prev => ({ ...prev, pendingCount: pending.length }));
  };

  const syncPendingRequests = async () => {
    if (!navigator.onLine || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true, lastError: undefined }));

    try {
      const pending = await offlineDB.getPendingRequests();
      
      for (const request of pending) {
        try {
          const token = JWTClient.getToken();
          
          const response = await supabase.functions.invoke('qr-unified-api/request', {
            body: {
              sessionId: request.sessionId,
              requestType: request.requestType,
              requestData: request.requestData,
              priority: request.priority
            },
            headers: token ? { 'x-session-token': token } : {}
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          await offlineDB.markRequestSynced(request.id);
          queryClient.invalidateQueries({ queryKey: ['qr-requests', request.sessionId] });
        } catch (error: any) {
          console.error('Failed to sync request:', error);
          await offlineDB.markRequestFailed(request.id, error.message);
        }
      }

      await updatePendingCount();
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date()
      }));
    } catch (error: any) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastError: error.message
      }));
    }
  };

  const queueOfflineRequest = async (
    sessionId: string,
    requestType: string,
    requestData: any,
    priority: string = 'normal'
  ) => {
    const request = await offlineDB.addOfflineRequest({
      sessionId,
      requestType,
      requestData,
      priority
    });

    await updatePendingCount();

    // Try to sync immediately if online
    if (navigator.onLine) {
      syncPendingRequests();
    }

    return request;
  };

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      syncPendingRequests();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync
    updatePendingCount();
    if (navigator.onLine) {
      syncPendingRequests();
    }

    // Periodic sync every 30 seconds
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingRequests();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  return {
    syncStatus,
    queueOfflineRequest,
    syncNow: syncPendingRequests,
    updatePendingCount
  };
}
