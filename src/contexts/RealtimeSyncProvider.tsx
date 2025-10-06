import { createContext, useContext, ReactNode } from 'react';
import { useBackgroundSyncWatcher } from '@/hooks/useBackgroundSyncWatcher';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

/**
 * Phase 2G: Global Realtime Sync Provider
 * 
 * Centralized real-time sync management for all modules:
 * - QR Codes
 * - Rooms
 * - Orders (POS & QR)
 * - Reservations
 * - Payments
 * 
 * Benefits:
 * - Single subscription point for all modules
 * - Consistent sync behavior across app
 * - Easy to add new modules
 */

interface SyncStatus {
  lastSync: Date;
  isConnected: boolean;
}

interface SyncContextValue {
  qrCodes: SyncStatus;
  rooms: SyncStatus;
  qrOrders: SyncStatus;
  reservations: SyncStatus;
  payments: SyncStatus;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

interface RealtimeSyncProviderProps {
  children: ReactNode;
  /** Enable QR codes sync (default: true) */
  enableQRCodes?: boolean;
  /** Enable rooms sync (default: true) */
  enableRooms?: boolean;
  /** Enable orders sync (default: true) */
  enableOrders?: boolean;
  /** Enable reservations sync (default: true) */
  enableReservations?: boolean;
  /** Enable payments sync (default: true) */
  enablePayments?: boolean;
}

export function RealtimeSyncProvider({ 
  children,
  enableQRCodes = true,
  enableRooms = true,
  enableOrders = true,
  enableReservations = true,
  enablePayments = true
}: RealtimeSyncProviderProps) {
  const { user } = useAuth();
  
  // Phase 3: Pass tenantId explicitly to all watchers
  const qrCodesSync = useBackgroundSyncWatcher({
    queryKey: ['qr-codes', user?.tenant_id || ''],
    realtimeTable: 'qr_codes',
    tenantId: user?.tenant_id || '',
    enableToast: enableQRCodes,
    pollInterval: 30000
  });
  
  // Rooms Sync
  const roomsSync = useBackgroundSyncWatcher({
    queryKey: ['rooms', user?.tenant_id || ''],
    realtimeTable: 'rooms',
    tenantId: user?.tenant_id || '',
    enableToast: false, // Less intrusive for background updates
    pollInterval: 45000
  });
  
  // QR Orders Sync
  const qrOrdersSync = useBackgroundSyncWatcher({
    queryKey: ['qr-orders', user?.tenant_id || ''],
    realtimeTable: 'qr_orders',
    tenantId: user?.tenant_id || '',
    enableToast: enableOrders,
    pollInterval: 20000, // More frequent for orders
    onNewData: (payload) => {
      console.log('[Sync] New QR order received:', payload.new);
    }
  });
  
  // Reservations Sync
  const reservationsSync = useBackgroundSyncWatcher({
    queryKey: ['reservations', user?.tenant_id || ''],
    realtimeTable: 'reservations',
    tenantId: user?.tenant_id || '',
    enableToast: enableReservations,
    pollInterval: 30000
  });
  
  // Payments Sync
  const paymentsSync = useBackgroundSyncWatcher({
    queryKey: ['payments', user?.tenant_id || ''],
    realtimeTable: 'payments',
    tenantId: user?.tenant_id || '',
    enableToast: enablePayments,
    pollInterval: 25000,
    onNewData: (payload) => {
      console.log('[Sync] New payment recorded:', payload.new);
    }
  });
  
  const value: SyncContextValue = {
    qrCodes: {
      lastSync: qrCodesSync.lastSync,
      isConnected: qrCodesSync.isConnected
    },
    rooms: {
      lastSync: roomsSync.lastSync,
      isConnected: roomsSync.isConnected
    },
    qrOrders: {
      lastSync: qrOrdersSync.lastSync,
      isConnected: qrOrdersSync.isConnected
    },
    reservations: {
      lastSync: reservationsSync.lastSync,
      isConnected: reservationsSync.isConnected
    },
    payments: {
      lastSync: paymentsSync.lastSync,
      isConnected: paymentsSync.isConnected
    }
  };
  
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

/**
 * Hook to access sync status for any module
 * 
 * @example
 * const { qrCodes, rooms } = useSyncWatcher();
 * console.log('QR Codes last synced:', qrCodes.lastSync);
 * console.log('Rooms connected:', rooms.isConnected);
 */
export function useSyncWatcher() {
  const context = useContext(SyncContext);
  
  if (!context) {
    throw new Error('useSyncWatcher must be used within RealtimeSyncProvider');
  }
  
  return context;
}

/**
 * Hook to check overall sync health
 * 
 * @returns Whether all modules are connected and syncing
 */
export function useSyncHealth() {
  const sync = useSyncWatcher();
  
  const allConnected = Object.values(sync).every(module => module.isConnected);
  const mostRecentSync = Object.values(sync)
    .map(module => module.lastSync)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  
  return {
    allConnected,
    mostRecentSync,
    modules: sync
  };
}
