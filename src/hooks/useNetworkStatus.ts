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

  // Update online status from browser
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

    // Phase R.5: Check connection health on tab activation
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.log('[NetworkStatus] Tab visible - validating connection');
        
        setState(prev => ({
          ...prev,
          status: 'syncing'
        }));
        
        // Test connection with lightweight query
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { error } = await supabase
            .from('rooms')
            .select('count', { count: 'exact', head: true })
            .limit(0);
          
          if (error) {
            console.error('[NetworkStatus] Connection test failed:', error);
            setState(prev => ({
              ...prev,
              status: 'error',
              errorMessage: 'Connection failed - retrying...'
            }));
            
            // Retry after 2 seconds
            setTimeout(handleVisibilityChange, 2000);
          } else {
            console.log('[NetworkStatus] Connection healthy');
            setState(prev => ({
              ...prev,
              status: 'online',
              lastSyncAt: new Date(),
              errorMessage: null
            }));
          }
        } catch (err) {
          console.error('[NetworkStatus] Unexpected error during connection test:', err);
          setState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: 'Connection test failed'
          }));
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
