import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { soundManager } from '@/utils/soundManager';
import { toast } from '@/hooks/use-toast';

/**
 * Phase 1: Unified Real-Time Subscription Manager
 * 
 * Professional-grade real-time sync with:
 * - Single channel per tenant (eliminates race conditions)
 * - Role-based table subscriptions (optimized data flow)
 * - Debounced invalidations (prevents excessive re-renders)
 * - Exponential backoff error recovery
 * - Proper cleanup and memory management
 */

type UserRole = 'OWNER' | 'MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'POS' | 'MAINTENANCE' | 'SUPER_ADMIN';

interface RealtimeConfig {
  /** Enable role-based filtering (default: true) */
  roleBasedFiltering?: boolean;
  /** Debounce delay in ms (default: 300) */
  debounceDelay?: number;
  /** Enable error recovery (default: true) */
  errorRecovery?: boolean;
  /** Log real-time events (default: false in production) */
  verbose?: boolean;
  /** Enable sound notifications (default: true) */
  enableSound?: boolean;
  /** Enable toast notifications (default: true) */
  enableToast?: boolean;
}

interface SubscriptionState {
  channel: RealtimeChannel | null;
  reconnectAttempts: number;
  lastError: Error | null;
}

// Role-based table access configuration
const ROLE_TABLE_ACCESS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'qr_codes', 'qr_orders', 'group_reservations', 'work_orders', 'pos_orders', 'shift_sessions', 'audit_log'],
  OWNER: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'qr_codes', 'qr_orders', 'group_reservations', 'work_orders', 'pos_orders', 'shift_sessions'],
  MANAGER: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'qr_codes', 'qr_orders', 'group_reservations', 'work_orders', 'shift_sessions'],
  FRONT_DESK: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'qr_codes', 'qr_orders', 'group_reservations', 'work_orders'],
  HOUSEKEEPING: ['rooms', 'housekeeping_tasks', 'reservations'],
  POS: ['menu_items', 'menu_categories', 'qr_requests', 'qr_orders', 'pos_orders', 'payments'],
  MAINTENANCE: ['rooms', 'housekeeping_tasks', 'work_orders']
};

// Debounce groups - tables that should be invalidated together with same delay
const DEBOUNCE_GROUPS = {
  payments: ['payments', 'folios', 'folio-balances', 'billing', 'rooms', 'owner-overview'],
  folios: ['folios', 'folio-balances', 'billing'],
  rooms: ['rooms', 'room-availability', 'room-types'],
  reservations: ['reservations', 'rooms', 'guests', 'group-reservations'],
  guests: ['guests', 'guest-search', 'recent-guests'],
  housekeeping: ['housekeeping-tasks', 'rooms'],
  qr: ['qr-requests', 'qr-orders'],
  qr_codes: ['qr-codes', 'qr-directory'],
  qr_orders: ['qr-orders', 'qr-requests'],
  group_reservations: ['group-reservations', 'reservations'],
  work_orders: ['work-orders', 'housekeeping-tasks'],
  pos_orders: ['pos-orders', 'payments']
};

// Tiered debounce delays based on data priority (Phase 3.2)
const DEBOUNCE_TIERS = {
  INSTANT: 0,      // Critical UI updates (rooms, reservations)
  FAST: 100,       // High priority (guests, QR)
  NORMAL: 300,     // Standard updates
  SLOW: 500        // Batch operations (payments, folios)
};

// Table-specific debounce configuration
const TABLE_DEBOUNCE_CONFIG: Record<string, number> = {
  // Instant updates for critical frontdesk operations
  rooms: DEBOUNCE_TIERS.INSTANT,
  reservations: DEBOUNCE_TIERS.INSTANT,
  
  // Fast updates for user-facing features
  guests: DEBOUNCE_TIERS.FAST,
  qr_requests: DEBOUNCE_TIERS.FAST,
  qr_codes: DEBOUNCE_TIERS.FAST,
  qr_orders: DEBOUNCE_TIERS.FAST,
  housekeeping_tasks: DEBOUNCE_TIERS.FAST,
  pos_orders: DEBOUNCE_TIERS.FAST,
  
  // Normal updates for general operations
  group_reservations: DEBOUNCE_TIERS.NORMAL,
  work_orders: DEBOUNCE_TIERS.NORMAL,
  
  // Slow updates for financial operations (prevent loops)
  payments: DEBOUNCE_TIERS.SLOW,
  folios: DEBOUNCE_TIERS.SLOW,
  folio_charges: DEBOUNCE_TIERS.SLOW
};

export function useUnifiedRealtime(config: RealtimeConfig = {}) {
  const {
    roleBasedFiltering = true,
    debounceDelay = 300,
    errorRecovery = true,
    verbose = false,
    enableSound = true,
    enableToast = true
  } = config;

  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const userRole = user?.role as UserRole;
  const { isOnline, updateLastSync } = useNetworkStatus();

  const subscriptionRef = useRef<SubscriptionState>({
    channel: null,
    reconnectAttempts: 0,
    lastError: null
  });

  const invalidationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventCoalescingRef = useRef<Record<string, { count: number; firstEvent: number }>>({});
  
  // Phase 4: Timeout accumulation prevention
  const MAX_PENDING_TIMEOUTS = 50;
  const timeoutCountRef = useRef<number>(0);

  // Handle notifications for important realtime events
  const handleRealtimeNotification = useCallback(async (table: string, eventType: string, record: any) => {
    // Only notify for INSERTs on important tables
    if (eventType !== 'INSERT') return;

    // Check if notification permissions have been granted
    const hasPermission = localStorage.getItem('notification_permission_granted') === 'true';
    if (!hasPermission) return;

    let shouldNotify = false;
    let title = '';
    let description = '';
    let soundType: 'alert-medium' | 'alert-high' | 'alert-critical' = 'alert-medium';

    switch (table) {
      case 'qr_requests':
        shouldNotify = true;
        title = 'New Guest Request';
        description = `${record.request_type?.replace('_', ' ') || 'Service'} request received`;
        soundType = 'alert-high'; // Thai bell sound for all QR requests
        break;
      case 'guest_messages':
        shouldNotify = record.sender_type === 'guest';
        title = 'New Guest Message';
        description = 'A guest has sent a new message';
        soundType = 'alert-high'; // Thai bell sound for guest messages
        break;
      case 'qr_orders':
        shouldNotify = true;
        title = 'New Order';
        description = 'New order received from guest';
        soundType = 'alert-high'; // Thai bell sound for orders
        break;
      case 'payments':
        shouldNotify = true;
        title = 'Payment Received';
        description = `Payment of ${record.amount || '0'} received`;
        soundType = 'alert-high'; // Thai bell sound for payments
        break;
    }

    if (shouldNotify) {
      // Play sound
      if (enableSound) {
        await soundManager.play(soundType);
      }

      // Show toast
      if (enableToast) {
        toast({
          title,
          description,
          duration: 5000,
        });
      }
    }
  }, [enableSound, enableToast]);

  // Event coalescing - batch multiple events within a short window (Phase 3.2)
  // Skip coalescing for high-priority notification tables
  const shouldCoalesceEvent = useCallback((table: string): boolean => {
    // Never coalesce QR requests, orders, or other high-priority notification tables
    const noCoalesceTables = ['qr_requests', 'qr_orders', 'guest_messages', 'staff_notifications'];
    if (noCoalesceTables.includes(table)) {
      return false; // Always process these immediately
    }

    const now = Date.now();
    const coalescingWindow = 50; // 50ms window for coalescing
    
    if (!eventCoalescingRef.current[table]) {
      eventCoalescingRef.current[table] = { count: 1, firstEvent: now };
      return false;
    }
    
    const eventData = eventCoalescingRef.current[table];
    const timeSinceFirst = now - eventData.firstEvent;
    
    if (timeSinceFirst < coalescingWindow) {
      // Within coalescing window - increment count and skip this event
      eventData.count++;
      
      if (verbose) {
        console.log(`[Realtime] Coalescing event ${eventData.count} for ${table}`);
      }
      
      return true; // Skip this event
    }
    
    // Outside window - reset and process
    if (verbose && eventData.count > 1) {
      console.log(`[Realtime] Processed ${eventData.count} coalesced events for ${table}`);
    }
    
    eventCoalescingRef.current[table] = { count: 1, firstEvent: now };
    return false;
  }, [verbose]);

  // Debounced invalidation with grouping and tiered delays (Phase 3.2 + Phase 4)
  // Adjusted for visibility state to prevent accumulation when tab is backgrounded
  const debouncedInvalidate = useCallback((queryKeys: string[], delay: number) => {
    // If tab is hidden, use longer delays to prevent accumulation
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const adjustedDelay = isHidden ? delay * 5 : delay;
    
    if (verbose && isHidden) {
      console.log('[Realtime] Tab hidden - using extended debounce:', adjustedDelay);
    }
    // Phase 4: Prevent timeout accumulation memory leak
    if (timeoutCountRef.current >= MAX_PENDING_TIMEOUTS) {
      if (verbose) {
        console.warn(`[Realtime] Max pending timeouts (${MAX_PENDING_TIMEOUTS}) reached - forcing flush`);
      }
      
      // Force immediate invalidation for all queued queries
      Object.entries(invalidationTimeoutsRef.current).forEach(([key, timeout]) => {
        clearTimeout(timeout);
        const queryKey = key.includes(',') 
          ? key.split(',').filter(Boolean)
          : [key];
        queryClient.invalidateQueries({ queryKey });
      });
      
      invalidationTimeoutsRef.current = {};
      timeoutCountRef.current = 0;
    }
    
    queryKeys.forEach(key => {
      if (invalidationTimeoutsRef.current[key]) {
        clearTimeout(invalidationTimeoutsRef.current[key]);
        timeoutCountRef.current--;
      }

      timeoutCountRef.current++;
      invalidationTimeoutsRef.current[key] = setTimeout(() => {
        if (verbose) {
          console.log(`[Realtime] Invalidating query: ${key} (delay: ${delay}ms, pending: ${timeoutCountRef.current})`);
        }
        
        // Handle query keys that contain tenant IDs (format: "key,tenantId")
        // Split by comma to handle array-based query keys
        const queryKey = key.includes(',') 
          ? key.split(',').filter(Boolean)
          : [key];
        
        queryClient.invalidateQueries({ queryKey });
        delete invalidationTimeoutsRef.current[key];
        timeoutCountRef.current--;
      }, adjustedDelay);
    });
  }, [queryClient, verbose]);

  // Get query keys for a specific group
  // Uses comma separator to support React Query's array-based query keys: ['key', tenantId]
  const getGroupQueryKeys = useCallback((table: string, tenantId: string): string[] => {
    const keys: string[] = [];
    
    switch (table) {
      case 'payments':
        // Critical: payments affect folios, billing, and rooms
        DEBOUNCE_GROUPS.payments.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'folios':
      case 'folio_charges':
        DEBOUNCE_GROUPS.folios.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'rooms':
        DEBOUNCE_GROUPS.rooms.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'reservations':
        DEBOUNCE_GROUPS.reservations.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'guests':
        DEBOUNCE_GROUPS.guests.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'housekeeping_tasks':
        DEBOUNCE_GROUPS.housekeeping.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'qr_requests':
        DEBOUNCE_GROUPS.qr.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'qr_codes':
        DEBOUNCE_GROUPS.qr_codes.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'qr_orders':
        DEBOUNCE_GROUPS.qr_orders.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'group_reservations':
        DEBOUNCE_GROUPS.group_reservations.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'work_orders':
        DEBOUNCE_GROUPS.work_orders.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      case 'pos_orders':
        DEBOUNCE_GROUPS.pos_orders.forEach(k => keys.push(`${k},${tenantId}`));
        break;
      default:
        keys.push(`${table},${tenantId}`);
    }
    
    return keys;
  }, []);

  // Setup subscriptions with exponential backoff
  const setupSubscriptions = useCallback(() => {
    if (!user || !tenant?.tenant_id || !userRole) {
      if (verbose) {
        console.log('[Realtime] Skipping setup - missing auth data');
      }
      return null;
    }

    // Determine which tables this role can access
    const accessibleTables = roleBasedFiltering 
      ? ROLE_TABLE_ACCESS[userRole] || []
      : Object.keys(DEBOUNCE_GROUPS);

    if (accessibleTables.length === 0) {
      if (verbose) {
        console.log(`[Realtime] No tables accessible for role: ${userRole}`);
      }
      return null;
    }

    const channelName = `unified-tenant-${tenant.tenant_id}-${userRole.toLowerCase()}`;
    
    if (verbose) {
      console.log(`[Realtime] Setting up unified channel: ${channelName}`);
      console.log(`[Realtime] Subscribing to tables:`, accessibleTables);
    }

    const channel = supabase.channel(channelName);

    // Subscribe to each accessible table
    accessibleTables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        async (payload) => {
          if (verbose) {
            const recordId = payload.new && typeof payload.new === 'object' && 'id' in payload.new 
              ? payload.new.id 
              : 'unknown';
            console.log(`[Realtime Event] ${table}:`, payload.eventType, recordId);
          }

          // Event coalescing - skip if within coalescing window
          if (shouldCoalesceEvent(table)) {
            return;
          }

          // Handle notifications for high-priority events
          if (enableSound || enableToast) {
            await handleRealtimeNotification(table, payload.eventType, payload.new);
          }

          // Get all related query keys for this table
          const queryKeys = getGroupQueryKeys(table, tenant.tenant_id);
          
          // Use table-specific debounce delay from tiered configuration
          const delay = TABLE_DEBOUNCE_CONFIG[table] ?? DEBOUNCE_TIERS.NORMAL;
          
          debouncedInvalidate(queryKeys, delay);
          
          // Reset reconnect attempts on successful event
          subscriptionRef.current.reconnectAttempts = 0;
        }
      );
    });

    // Subscribe and handle connection status
    channel.subscribe((status) => {
      if (verbose) {
        console.log(`[Realtime] Subscription status: ${status}`);
      }

      if (status === 'SUBSCRIBED') {
        subscriptionRef.current.reconnectAttempts = 0;
        subscriptionRef.current.lastError = null;
      } else if (status === 'CHANNEL_ERROR' && errorRecovery) {
        handleConnectionError();
      }
    });

    return channel;
  }, [user, tenant?.tenant_id, userRole, roleBasedFiltering, verbose, errorRecovery, getGroupQueryKeys, debouncedInvalidate, shouldCoalesceEvent]);

  // Exponential backoff reconnection
  const handleConnectionError = useCallback(() => {
    const state = subscriptionRef.current;
    state.reconnectAttempts++;

    // Max 5 reconnection attempts with exponential backoff
    if (state.reconnectAttempts > 5) {
      console.error('[Realtime] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
    
    if (verbose) {
      console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts})`);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (verbose) {
        console.log('[Realtime] Attempting reconnection...');
      }
      
      // Cleanup old channel
      if (state.channel) {
        supabase.removeChannel(state.channel);
      }
      
      // Setup new channel
      const newChannel = setupSubscriptions();
      subscriptionRef.current.channel = newChannel;
    }, delay);
  }, [setupSubscriptions, verbose]);

  // Main effect - setup and cleanup
  // Visibility handling now managed by ConnectionManager to prevent cascading invalidations
  useEffect(() => {
    const channel = setupSubscriptions();
    subscriptionRef.current.channel = channel;

    return () => {
      if (verbose) {
        console.log('[Realtime] Cleaning up unified subscriptions');
      }

      // Visibility handling now in ConnectionManager - no listener to remove

      // Clear all pending invalidation timeouts (Phase 4: with counter reset)
      Object.values(invalidationTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      invalidationTimeoutsRef.current = {};
      timeoutCountRef.current = 0;

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Remove channel
      if (subscriptionRef.current.channel) {
        supabase.removeChannel(subscriptionRef.current.channel);
        subscriptionRef.current.channel = null;
      }
    };
  }, [setupSubscriptions, verbose]);

  // Network recovery - refetch critical queries on reconnection
  useEffect(() => {
    if (isOnline && subscriptionRef.current.channel && tenant?.tenant_id) {
      const criticalQueries = [
        'rooms', 'reservations', 'payments', 
        'qr-codes', 'qr-orders', 'folios',
        'qr-directory', 'folio-balances'
      ];
      
      if (verbose) {
        console.log('[Realtime] Network reconnected - invalidating critical queries');
      }
      
      criticalQueries.forEach(key => {
        queryClient.invalidateQueries({ 
          queryKey: [key, tenant.tenant_id] 
        });
      });
      
      updateLastSync();
    }
  }, [isOnline, tenant?.tenant_id, queryClient, updateLastSync, verbose]);

  // ✅ PHASE 2: Heartbeat monitoring to detect dead subscriptions
  useEffect(() => {
    if (!subscriptionRef.current.channel) return;
    
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
    
    const heartbeatTimer = setInterval(() => {
      const channel = subscriptionRef.current.channel;
      if (!channel) return;
      
      const state = channel.state;
      if (verbose) {
        console.log(`[Realtime Heartbeat] Channel state: ${state}`);
      }
      
      // If channel is in error state or not joined, attempt reconnection
      if (state !== 'joined' && state !== 'joining') {
        console.warn(`[Realtime Heartbeat] Unhealthy channel detected (${state}) - reconnecting`);
        handleConnectionError();
      }
    }, HEARTBEAT_INTERVAL);
    
    return () => clearInterval(heartbeatTimer);
  }, [subscriptionRef.current.channel, verbose, handleConnectionError]);

  // Return subscription state for debugging
  return {
    isConnected: subscriptionRef.current.channel !== null,
    reconnectAttempts: subscriptionRef.current.reconnectAttempts,
    lastError: subscriptionRef.current.lastError
  };
}
