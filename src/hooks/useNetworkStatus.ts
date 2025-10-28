import { useState, useEffect, useCallback } from 'react';

/**
 * Phase 2: Network Status Hook
 * 
 * Tracks online/offline/syncing states with:
 * - Browser online/offline events
 * - Supabase connection health
 * - Last sync timestamp
 * - Automatic reconnection detection
 */

export type NetworkStatus = 'online' | 'offline' | 'syncing' | 'error';

interface NetworkState {
  status: NetworkStatus;
  isOnline: boolean;
  lastSyncAt: Date | null;
  errorMessage: string | null;
}

interface UseNetworkStatusReturn extends NetworkState {
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  updateLastSync: () => void;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [state, setState] = useState<NetworkState>({
    status: 'online',
    isOnline: navigator.onLine,
    lastSyncAt: new Date(),
    errorMessage: null
  });

  // Phase 8: Listen for status updates from TabRehydrationManager
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      const { status, message } = event.detail;
      console.log('[NetworkStatus] Received update from TabRehydration:', status);
      
      setState(prev => ({
        ...prev,
        status,
        errorMessage: message || null,
        lastSyncAt: status === 'online' ? new Date() : prev.lastSyncAt
      }));
    };

    window.addEventListener('network-status-update', handleStatusUpdate as EventListener);
    return () => {
      window.removeEventListener('network-status-update', handleStatusUpdate as EventListener);
    };
  }, []);

  // Update online status from browser - SIMPLIFIED (Phase 8)
  // Removed visibility handler - TabRehydrationManager handles reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Browser online');
      setState(prev => ({
        ...prev,
        status: 'syncing',
        isOnline: true,
        errorMessage: null
      }));

      // Auto-transition to online after sync indicator
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'online',
          lastSyncAt: new Date()
        }));
      }, 2000);
    };

    const handleOffline = () => {
      console.log('[Network] Browser offline');
      setState(prev => ({
        ...prev,
        status: 'offline',
        isOnline: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Removed manual status setter to prevent offline simulation

  // Toggle syncing state
  const setSyncing = useCallback((syncing: boolean) => {
    setState(prev => ({
      ...prev,
      status: syncing ? 'syncing' : 'online',
      lastSyncAt: syncing ? prev.lastSyncAt : new Date()
    }));
  }, []);

  // Set error message
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      status: error ? 'error' : 'online',
      errorMessage: error
    }));
  }, []);

  // Update last sync timestamp
  const updateLastSync = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastSyncAt: new Date()
    }));
  }, []);

  return {
    ...state,
    setSyncing,
    setError,
    updateLastSync
  };
}
