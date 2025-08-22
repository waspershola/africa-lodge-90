import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock API delay
const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
const shouldFail = () => Math.random() < 0.1; // 10% failure rate

// Mock front desk data
const mockFrontDeskData = {
  roomsAvailable: 12,
  totalRooms: 50,
  occupancyRate: 76,
  arrivalsToday: 8,
  departuresToday: 6,
  pendingCheckIns: 3,
  pendingCheckOuts: 2,
  overstays: 1,
  inHouseGuests: 38,
  pendingPayments: 125000,
  pendingPaymentCount: 4,
  oosRooms: 2,
  dieselLevel: 75,
  genRuntime: 4.5,
  alerts: [
    { type: 'ID Missing', message: 'Room 205 - Guest ID not provided' },
    { type: 'Deposit Due', message: 'Room 312 - Deposit payment overdue' },
    { type: 'Maintenance', message: 'Room 108 - AC not working' }
  ]
};

// IndexedDB/localStorage for offline queue
const QUEUE_KEY = 'frontdesk_action_queue';
const OFFLINE_TIME_KEY = 'frontdesk_offline_time';
const OFFLINE_DURATION = 24 * 60 * 60; // 24 hours in seconds

interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'retrying' | 'failed';
  retryCount?: number;
}

// Front Desk Data Hook
export const useFrontDeskData = (hotelSlug: string) => {
  const [isOffline, setIsOffline] = useState(false);
  const [offlineTimeRemaining, setOfflineTimeRemaining] = useState(OFFLINE_DURATION);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Simulate offline mode for testing
  useEffect(() => {
    const toggleOffline = () => {
      setIsOffline(prev => {
        const newOffline = !prev;
        if (newOffline) {
          // Start offline mode
          localStorage.setItem(OFFLINE_TIME_KEY, Date.now().toString());
        } else {
          // Go back online
          localStorage.removeItem(OFFLINE_TIME_KEY);
          setIsReadOnly(false);
        }
        return newOffline;
      });
    };

    // Keyboard shortcut to toggle offline mode (Ctrl+Shift+O)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        toggleOffline();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Offline timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOffline) {
      const startTime = localStorage.getItem(OFFLINE_TIME_KEY);
      if (startTime) {
        interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
          const remaining = Math.max(0, OFFLINE_DURATION - elapsed);
          
          setOfflineTimeRemaining(remaining);
          
          if (remaining === 0) {
            setIsReadOnly(true);
          }
        }, 1000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOffline]);

  const query = useQuery({
    queryKey: ['frontdesk', hotelSlug],
    queryFn: async () => {
      await delay();
      if (shouldFail()) throw new Error('Failed to load front desk data');
      return { data: mockFrontDeskData };
    },
    refetchInterval: isOffline ? false : 30000, // Refetch every 30s when online
    retry: !isOffline,
  });

  return {
    ...query,
    isOffline,
    offlineTimeRemaining,
    isReadOnly
  };
};

// Offline Queue Hook
export const useOfflineQueue = () => {
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_KEY);
    if (savedQueue) {
      try {
        setQueuedActions(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to parse saved queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queuedActions));
  }, [queuedActions]);

  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'status'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      status: 'pending'
    };

    setQueuedActions(prev => [...prev, queuedAction]);
  }, []);

  const removeFromQueue = useCallback((actionId: string) => {
    setQueuedActions(prev => prev.filter(action => action.id !== actionId));
  }, []);

  const updateActionStatus = useCallback((actionId: string, status: QueuedAction['status'], retryCount?: number) => {
    setQueuedActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, status, ...(retryCount !== undefined && { retryCount }) }
        : action
    ));
  }, []);

  const retryQueue = useCallback(async () => {
    const pendingActions = queuedActions.filter(action => 
      action.status === 'pending' || action.status === 'failed'
    );

    for (const action of pendingActions) {
      try {
        updateActionStatus(action.id, 'retrying', (action.retryCount || 0) + 1);
        
        // Simulate API call
        await delay();
        if (shouldFail()) throw new Error('Retry failed');
        
        // Success - remove from queue
        removeFromQueue(action.id);
      } catch (error) {
        updateActionStatus(action.id, 'failed');
      }
    }
  }, [queuedActions, updateActionStatus, removeFromQueue]);

  const clearQueue = useCallback(() => {
    setQueuedActions([]);
  }, []);

  return {
    queuedActions,
    addToQueue,
    removeFromQueue,
    updateActionStatus,
    retryQueue,
    clearQueue
  };
};

// Individual action hooks
export const useAssignRoom = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      await delay();
      if (shouldFail()) throw new Error('Failed to assign room');
      return { success: true };
    }
  });
};

export const useCheckIn = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      await delay();
      if (shouldFail()) throw new Error('Failed to check in guest');
      return { success: true };
    }
  });
};

export const useCheckOut = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      await delay();
      if (shouldFail()) throw new Error('Failed to check out guest');
      return { success: true };
    }
  });
};

export const useCollectPayment = () => {
  return useMutation({
    mutationFn: async (data: any) => {
      await delay();
      if (shouldFail()) throw new Error('Failed to collect payment');
      return { success: true };
    }
  });
};