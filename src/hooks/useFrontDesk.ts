import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock API delay
const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
const shouldFail = () => Math.random() < 0.1; // 10% failure rate

// Mock room data
const mockRooms = [
  // Available Rooms
  { id: '101', number: '101', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '102', number: '102', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '103', number: '103', name: 'Deluxe Room', type: 'Deluxe', status: 'available' as const },
  { id: '104', number: '104', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '105', number: '105', name: 'Suite', type: 'Executive Suite', status: 'available' as const },
  { id: '106', number: '106', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '107', number: '107', name: 'Deluxe Room', type: 'Deluxe', status: 'available' as const },
  { id: '109', number: '109', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '110', number: '110', name: 'Deluxe Room', type: 'Deluxe', status: 'available' as const },
  { id: '111', number: '111', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '112', number: '112', name: 'Standard Room', type: 'Standard', status: 'available' as const },
  { id: '113', number: '113', name: 'Deluxe Room', type: 'Deluxe', status: 'available' as const },

  // Occupied Rooms
  { id: '201', number: '201', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'John Smith', checkInDate: '2024-08-20', checkOutDate: '2024-08-25', revenue: 45000 },
  { id: '202', number: '202', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Sarah Johnson', checkInDate: '2024-08-19', checkOutDate: '2024-08-22', revenue: 65000, alerts: [{ type: 'deposit_due' as const, message: 'Deposit payment overdue' }] },
  { id: '203', number: '203', name: 'Suite', type: 'Executive Suite', status: 'occupied' as const, guestName: 'Michael Brown', checkInDate: '2024-08-18', checkOutDate: '2024-08-23', revenue: 120000 },
  { id: '204', number: '204', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'Emily Davis', checkInDate: '2024-08-21', checkOutDate: '2024-08-22', revenue: 42000 },
  { id: '206', number: '206', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Robert Wilson', checkInDate: '2024-08-20', checkOutDate: '2024-08-24', revenue: 68000 },
  { id: '207', number: '207', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'Lisa Anderson', checkInDate: '2024-08-19', checkOutDate: '2024-08-22', revenue: 48000 },

  // Reserved Rooms
  { id: '301', number: '301', name: 'Standard Room', type: 'Standard', status: 'reserved' as const, guestName: 'David Taylor', checkInDate: '2024-08-22', checkOutDate: '2024-08-26' },
  { id: '302', number: '302', name: 'Deluxe Room', type: 'Deluxe', status: 'reserved' as const, guestName: 'Jennifer Martinez', checkInDate: '2024-08-22', checkOutDate: '2024-08-25' },
  { id: '303', number: '303', name: 'Suite', type: 'Executive Suite', status: 'reserved' as const, guestName: 'Christopher Lee', checkInDate: '2024-08-22', checkOutDate: '2024-08-27' },

  // Out of Service Rooms
  { id: '108', number: '108', name: 'Standard Room', type: 'Standard', status: 'oos' as const, alerts: [{ type: 'maintenance' as const, message: 'AC not working - repair scheduled' }] },
  { id: '209', number: '209', name: 'Deluxe Room', type: 'Deluxe', status: 'oos' as const, alerts: [{ type: 'maintenance' as const, message: 'Plumbing issues - under repair' }] },

  // Overstay
  { id: '205', number: '205', name: 'Standard Room', type: 'Standard', status: 'overstay' as const, guestName: 'Mark Thompson', checkInDate: '2024-08-15', checkOutDate: '2024-08-20', revenue: 75000, alerts: [{ type: 'id_missing' as const, message: 'Guest ID not provided' }] },

  // Additional occupied rooms for better distribution
  { id: '208', number: '208', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Amanda White', checkInDate: '2024-08-20', checkOutDate: '2024-08-23', revenue: 72000 },
  { id: '210', number: '210', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'James Garcia', checkInDate: '2024-08-21', checkOutDate: '2024-08-24', revenue: 54000 },
  { id: '211', number: '211', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Nicole Rodriguez', checkInDate: '2024-08-19', checkOutDate: '2024-08-22', revenue: 63000 },
  { id: '212', number: '212', name: 'Suite', type: 'Executive Suite', status: 'occupied' as const, guestName: 'Kevin Lewis', checkInDate: '2024-08-18', checkOutDate: '2024-08-25', revenue: 180000 },
  { id: '304', number: '304', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'Rachel Clark', checkInDate: '2024-08-20', checkOutDate: '2024-08-23', revenue: 51000 },
  { id: '305', number: '305', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Daniel Hall', checkInDate: '2024-08-21', checkOutDate: '2024-08-26', revenue: 85000 },
  { id: '306', number: '306', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'Michelle Young', checkInDate: '2024-08-19', checkOutDate: '2024-08-22', revenue: 48000 },
  { id: '307', number: '307', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Ryan King', checkInDate: '2024-08-20', checkOutDate: '2024-08-24', revenue: 76000 },
  { id: '308', number: '308', name: 'Suite', type: 'Executive Suite', status: 'occupied' as const, guestName: 'Stephanie Wright', checkInDate: '2024-08-18', checkOutDate: '2024-08-27', revenue: 210000 },
  { id: '309', number: '309', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'Brian Lopez', checkInDate: '2024-08-21', checkOutDate: '2024-08-25', revenue: 60000 },
  { id: '310', number: '310', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Crystal Hill', checkInDate: '2024-08-19', checkOutDate: '2024-08-23', revenue: 68000 },
  { id: '311', number: '311', name: 'Standard Room', type: 'Standard', status: 'occupied' as const, guestName: 'Gregory Green', checkInDate: '2024-08-20', checkOutDate: '2024-08-24', revenue: 56000 },
  { id: '312', number: '312', name: 'Deluxe Room', type: 'Deluxe', status: 'occupied' as const, guestName: 'Tiffany Adams', checkInDate: '2024-08-18', checkOutDate: '2024-08-22', revenue: 64000, alerts: [{ type: 'deposit_due' as const, message: 'Deposit payment overdue' }] },
  { id: '313', number: '313', name: 'Suite', type: 'Executive Suite', status: 'occupied' as const, guestName: 'Anthony Nelson', checkInDate: '2024-08-19', checkOutDate: '2024-08-26', revenue: 195000 }
];

// Mock front desk data
const mockFrontDeskData = {
  rooms: mockRooms,
  roomsAvailable: mockRooms.filter(r => r.status === 'available').length,
  totalRooms: mockRooms.length,
  occupancyRate: Math.round((mockRooms.filter(r => r.status === 'occupied').length / mockRooms.length) * 100),
  arrivalsToday: mockRooms.filter(r => r.status === 'reserved' && r.checkInDate === '2024-08-22').length,
  departuresToday: mockRooms.filter(r => r.status === 'occupied' && r.checkOutDate === '2024-08-22').length,
  pendingCheckIns: mockRooms.filter(r => r.status === 'reserved').length,
  pendingCheckOuts: mockRooms.filter(r => r.status === 'occupied' && r.checkOutDate === '2024-08-22').length,
  overstays: mockRooms.filter(r => r.status === 'overstay').length,
  inHouseGuests: mockRooms.filter(r => r.status === 'occupied' || r.status === 'overstay').length,
  pendingPayments: mockRooms
    .filter(r => r.alerts?.some(a => a.type === 'deposit_due'))
    .reduce((sum, r) => sum + (r.revenue || 0), 0),
  pendingPaymentCount: mockRooms.filter(r => r.alerts?.some(a => a.type === 'deposit_due')).length,
  oosRooms: mockRooms.filter(r => r.status === 'oos').length,
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