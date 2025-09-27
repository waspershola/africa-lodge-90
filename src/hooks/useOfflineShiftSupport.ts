import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface OfflineShiftAction {
  id: string;
  type: 'start_shift' | 'end_shift' | 'cash_count' | 'handover_note';
  data: any;
  timestamp: string;
  synced: boolean;
}

export const useOfflineShiftSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineShiftAction[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Syncing offline shift data...",
        duration: 3000,
      });
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Working Offline",
        description: "Shift data will be synced when connection is restored.",
        duration: 5000,
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pending-shift-actions');
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load pending shift actions:', error);
      }
    }
  }, []);

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pending-shift-actions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Add action to offline queue
  const queueOfflineAction = (action: Omit<OfflineShiftAction, 'id' | 'synced'>) => {
    const newAction: OfflineShiftAction = {
      ...action,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synced: false
    };

    setPendingActions(prev => [...prev, newAction]);

    if (!isOnline) {
      toast({
        title: "Action Queued",
        description: "This action will be synced when connection is restored.",
        duration: 3000,
      });
    }

    return newAction.id;
  };

  // Sync pending actions when online
  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const unsynced = pendingActions.filter(action => !action.synced);
    
    for (const action of unsynced) {
      try {
        // Here you would normally call the appropriate API
        // For now, we'll simulate the sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mark as synced
        setPendingActions(prev => 
          prev.map(a => a.id === action.id ? { ...a, synced: true } : a)
        );

        console.log('Synced offline action:', action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }

    // Remove synced actions older than 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    setPendingActions(prev => 
      prev.filter(action => 
        !action.synced || 
        new Date(action.timestamp).getTime() > oneDayAgo
      )
    );

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['shift-sessions'] });
    
    if (unsynced.length > 0) {
      toast({
        title: "Sync Complete",
        description: `${unsynced.length} offline actions synchronized successfully.`,
        duration: 3000,
      });
    }
  };

  // Get offline shift data for display
  const getOfflineShiftData = () => {
    const offlineShifts = pendingActions
      .filter(action => action.type === 'start_shift' && !action.synced)
      .map(action => ({
        id: action.id,
        ...action.data,
        isOffline: true,
        timestamp: action.timestamp
      }));

    return offlineShifts;
  };

  // Check if there are pending actions
  const hasPendingActions = pendingActions.some(action => !action.synced);

  // Force sync (for manual retry)
  const forcSync = () => {
    if (isOnline) {
      syncPendingActions();
    } else {
      toast({
        title: "No Connection",
        description: "Cannot sync while offline. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  return {
    isOnline,
    pendingActions: pendingActions.filter(a => !a.synced),
    hasPendingActions,
    queueOfflineAction,
    syncPendingActions,
    getOfflineShiftData,
    forcSync
  };
};