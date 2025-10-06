import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { RealtimeChannel } from '@supabase/supabase-js';

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
}

interface SubscriptionState {
  channel: RealtimeChannel | null;
  reconnectAttempts: number;
  lastError: Error | null;
}

// Role-based table access configuration
const ROLE_TABLE_ACCESS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'shift_sessions', 'audit_log', 'qr_codes'],
  OWNER: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'shift_sessions', 'qr_codes'],
  MANAGER: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'shift_sessions', 'qr_codes'],
  FRONT_DESK: ['rooms', 'reservations', 'folios', 'folio_charges', 'payments', 'guests', 'housekeeping_tasks', 'qr_requests', 'qr_codes'],
  HOUSEKEEPING: ['rooms', 'housekeeping_tasks', 'reservations'],
  POS: ['menu_items', 'menu_categories', 'qr_requests', 'payments'],
  MAINTENANCE: ['rooms', 'housekeeping_tasks']
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
  qr_codes: ['qr-codes']
};

export function useUnifiedRealtime(config: RealtimeConfig = {}) {
  const {
    roleBasedFiltering = true,
    debounceDelay = 300,
    errorRecovery = true,
    verbose = false
  } = config;

  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const userRole = user?.role as UserRole;

  const subscriptionRef = useRef<SubscriptionState>({
    channel: null,
    reconnectAttempts: 0,
    lastError: null
  });

  const invalidationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced invalidation with grouping
  const debouncedInvalidate = useCallback((queryKeys: string[], delay: number = debounceDelay) => {
    queryKeys.forEach(key => {
      if (invalidationTimeoutsRef.current[key]) {
        clearTimeout(invalidationTimeoutsRef.current[key]);
      }

      invalidationTimeoutsRef.current[key] = setTimeout(() => {
        if (verbose) {
          console.log(`[Realtime] Invalidating query: ${key}`);
        }
        
        // Handle both array and string query keys
        const queryKey = key.includes('-') 
          ? key.split('-').filter(Boolean)
          : [key];
        
        queryClient.invalidateQueries({ queryKey });
        delete invalidationTimeoutsRef.current[key];
      }, delay);
    });
  }, [queryClient, debounceDelay, verbose]);

  // Get query keys for a specific group
  const getGroupQueryKeys = useCallback((table: string, tenantId: string): string[] => {
    const keys: string[] = [];
    
    switch (table) {
      case 'payments':
        DEBOUNCE_GROUPS.payments.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'folios':
      case 'folio_charges':
        DEBOUNCE_GROUPS.folios.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'rooms':
        DEBOUNCE_GROUPS.rooms.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'reservations':
        DEBOUNCE_GROUPS.reservations.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'guests':
        DEBOUNCE_GROUPS.guests.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'housekeeping_tasks':
        DEBOUNCE_GROUPS.housekeeping.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'qr_requests':
        DEBOUNCE_GROUPS.qr.forEach(k => keys.push(`${k}-${tenantId}`));
        break;
      case 'qr_codes':
        keys.push(`qr-codes-${tenantId}`);
        break;
      default:
        keys.push(`${table}-${tenantId}`);
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
        (payload) => {
          if (verbose) {
            const recordId = payload.new && typeof payload.new === 'object' && 'id' in payload.new 
              ? payload.new.id 
              : 'unknown';
            console.log(`[Realtime Event] ${table}:`, payload.eventType, recordId);
          }

          // Get all related query keys for this table
          const queryKeys = getGroupQueryKeys(table, tenant.tenant_id);
          
          // Use longer debounce for payments to prevent loops
          const delay = table === 'payments' ? 500 : debounceDelay;
          
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
  }, [user, tenant?.tenant_id, userRole, roleBasedFiltering, verbose, errorRecovery, debounceDelay, getGroupQueryKeys, debouncedInvalidate]);

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
  useEffect(() => {
    const channel = setupSubscriptions();
    subscriptionRef.current.channel = channel;

    return () => {
      if (verbose) {
        console.log('[Realtime] Cleaning up unified subscriptions');
      }

      // Clear all pending invalidation timeouts
      Object.values(invalidationTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      invalidationTimeoutsRef.current = {};

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

  // Return subscription state for debugging
  return {
    isConnected: subscriptionRef.current.channel !== null,
    reconnectAttempts: subscriptionRef.current.reconnectAttempts,
    lastError: subscriptionRef.current.lastError
  };
}
