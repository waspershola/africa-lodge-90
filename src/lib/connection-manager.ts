/**
 * Unified Connection Manager
 * 
 * Centralizes all connection health monitoring and query invalidation.
 * Eliminates the "death spiral" of simultaneous invalidations by:
 * - Consolidating visibility handlers
 * - Implementing prioritized query invalidation
 * - Debouncing reconnection attempts
 * - Coordinating with supabase-health-monitor
 */

// @ts-nocheck
import { queryClient } from './queryClient';
import { supabaseHealthMonitor } from './supabase-health-monitor';
import { realtimeChannelManager } from './realtime-channel-manager';

type QueryPriority = 'critical' | 'high' | 'normal';

interface PriorityGroup {
  priority: QueryPriority;
  queries: string[];
  delay: number;
}

// Query priority configuration - expanded to cover all major queries
const QUERY_PRIORITIES: Record<string, QueryPriority> = {
  // Critical - must update immediately for UX (< 30s stale)
  'qr-requests': 'critical',
  'qr-requests-staff': 'critical',
  'rooms': 'critical',
  'reservations': 'critical',
  'front-desk-room-counts': 'critical',
  'room-availability': 'critical',
  'arrivals': 'critical',
  'departures': 'critical',
  
  // High - user-facing features (< 1 min stale)
  'guests': 'high',
  'guest-search': 'high',
  'recent-guests': 'high',
  'qr-orders': 'high',
  'qr-codes': 'high',
  'qr-directory': 'high',
  'housekeeping-tasks': 'high',
  'pos-orders': 'high',
  'front-desk-alerts': 'high',
  'work-orders': 'high',
  'maintenance-issues': 'high',
  'room-service': 'high',
  'guest-requests': 'high',
  
  // Normal - everything else (< 2 min stale)
  'payments': 'normal',
  'folios': 'normal',
  'billing': 'normal',
  'analytics': 'normal',
  'reports': 'normal',
  'staff': 'normal',
  'settings': 'normal',
  'room-types': 'normal',
  'amenities': 'normal',
  'services': 'normal',
  'inventory': 'normal',
  'supplies': 'normal',
};

// Phase F.6: Optimized stale time thresholds (ms)
const STALE_THRESHOLDS = {
  critical: 0,             // Always fresh for realtime-critical data
  high: 30 * 1000,        // 30 seconds
  normal: 2 * 60 * 1000,  // 2 minutes
};

// Phase F.6: Cache time configuration
const CACHE_TIMES = {
  critical: 2 * 60 * 1000,    // 2 minutes
  high: 5 * 60 * 1000,        // 5 minutes
  normal: 10 * 60 * 1000,     // 10 minutes
};

class ConnectionManager {
  private isReconnecting = false;
  private reconnectDebounceTimeout: NodeJS.Timeout | null = null;
  private visibilityTimeout: NodeJS.Timeout | null = null;
  private lastVisibilityChange = 0;
  private lastRefetchTime = 0;
  
  // F.9.2: Global reconnection lock (prevents duplicate reconnects)
  private static reconnectLock = false;
  
  /**
   * F.12: Check if user is actively interacting with forms/dialogs
   */
  private userIsActivelyInteracting(): boolean {
    // Check if any modal/dialog is open
    const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]');
    const hasOpenPopover = document.querySelector('[data-radix-popper-content-wrapper]');
    
    return !!(hasOpenDialog || hasOpenPopover);
  }
  
  constructor() {
    this.setupVisibilityHandler();
    this.setupHealthMonitoring();
    this.setupReconnectCoordination();
  }

  /**
   * F.8.3: Robust visibility handler with throttling (singleton pattern)
   */
  private visibilityHandler = (() => {
    let last = 0;
    return () => {
      const now = Date.now();
      if (now - last < 1000) return; // Throttle to 1s
      last = now;
      if (document.visibilityState === 'visible') {
        console.log('[ConnectionManager] Tab became visible - triggering reconnect');
        this.handleTabBecameVisible();
      }
    };
  })();

  /**
   * F.8.3: Setup centralized visibility change handler (single source)
   */
  private setupVisibilityHandler() {
    if (typeof document === 'undefined') return;

    // F.8.3: Remove any existing listener first (idempotent)
    document.removeEventListener('visibilitychange', this.visibilityHandler as any);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Setup health monitoring integration
   */
  private setupHealthMonitoring() {
    supabaseHealthMonitor.onHealthChange((healthy) => {
      if (healthy) {
        console.log('[ConnectionManager] Connection restored');
        this.handleConnectionRestored();
      } else {
        console.warn('[ConnectionManager] Connection lost');
        this.handleConnectionLost();
      }
    });
  }

  /**
   * F.9.2: Setup custom event for reconnection coordination
   */
  private setupReconnectCoordination() {
    window.addEventListener('connection:force-reconnect', ((e: CustomEvent) => {
      this.triggerReconnect(e.detail || 'custom-event');
    }) as EventListener);
  }

  /**
   * F.9.2: Master reconnection controller (single authority)
   */
  async triggerReconnect(reason: string): Promise<void> {
    if (ConnectionManager.reconnectLock) {
      console.log(`[ConnectionManager] Reconnect suppressed (${reason}) - already running`);
      return;
    }
    
    ConnectionManager.reconnectLock = true;
    console.log(`[ConnectionManager] 🔄 Triggering reconnect: ${reason}`);
    
    try {
      await supabaseHealthMonitor.forceReconnect();
    } finally {
      ConnectionManager.reconnectLock = false;
    }
  }

  /**
   * G++.4: Handle tab becoming visible - active refetch mechanism
   */
  private async handleTabBecameVisible() {
    console.log('[ConnectionManager] Tab became visible');

    // Clear any pending visibility timeout
    if (this.visibilityTimeout) {
      clearTimeout(this.visibilityTimeout);
    }

    // Debounce: wait 500ms before refetching (prevents thrashing)
    this.visibilityTimeout = setTimeout(async () => {
      // STEP 1: Check Supabase connection health
      const isHealthy = await supabaseHealthMonitor.checkHealth();
      
      if (!isHealthy) {
        console.warn('[ConnectionManager] Connection unhealthy - forcing reconnect');
        await this.triggerReconnect('tab-visible');
      }
      
      // STEP 1.5: G++.4 PHASE 3 - Force invalidate guest-search immediately (backup mechanism)
      // This ensures guest search refetches even if React Query's focus manager missed the event
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ 
          predicate: q => ['guest-search', 'recent-guests'].includes(q.queryKey[0] as string) 
        });
      }
      
      // STEP 2: Reconnect all realtime channels BEFORE query invalidation
      console.log('[ConnectionManager] Reconnecting realtime channels...');
      await realtimeChannelManager.reconnectAll();
      
      // G++.4: Active prioritized refetch on tab visibility
      await this.onReconnect();
      
      this.visibilityTimeout = null;
    }, 500);
  }

  /**
   * Handle connection lost - pause non-critical operations
   */
  private handleConnectionLost() {
    // Cancel any pending reconnection
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
      this.reconnectDebounceTimeout = null;
    }
    
    this.isReconnecting = false;
  }

  /**
   * G++.4: Active prioritized refetch on reconnection
   */
  private async onReconnect() {
    console.log('[ConnectionManager] Reconnection sequence starting...');
    
    // Priority 1: Critical queries (folio, reservations, qr-requests)
    await queryClient.invalidateQueries({
      predicate: q => ['folio-calculation', 'reservations', 'qr-requests'].includes(q.queryKey[0] as string)
    });
    await new Promise(res => setTimeout(res, 300)); // Small gap
    
    // Priority 2: High queries (guest-search, recent-guests)
    await queryClient.invalidateQueries({
      predicate: q => ['guest-search', 'guests-search', 'recent-guests'].includes(q.queryKey[0] as string)
    });
    
    // G++.4: PHASE 6 - Monitoring: Track reconnect metrics
    console.log('[ConnectionManager] 📊 Reconnect metrics:', {
      priority1Invalidated: ['folio-calculation', 'reservations', 'qr-requests'],
      priority2Invalidated: ['guest-search', 'guests-search', 'recent-guests'],
      timestamp: new Date().toISOString()
    });
    
    console.log('[ConnectionManager] Reconnection sequence complete');
  }

  /**
   * G++.4: Handle connection restored with active refetch
   */
  private async handleConnectionRestored() {
    // Debounce reconnection - wait 2 seconds
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
    }

    this.reconnectDebounceTimeout = setTimeout(async () => {
      if (this.isReconnecting) {
        console.log('[ConnectionManager] Already reconnecting');
        return;
      }
      
      this.isReconnecting = true;
      console.log('[ConnectionManager] Connection restored - full recovery sequence');
      
      try {
        // STEP 1: Reconnect realtime channels FIRST (critical for live updates)
        console.log('[ConnectionManager] Reconnecting realtime channels...');
        await realtimeChannelManager.reconnectAll();
        
        // STEP 2: Wait 200ms for channels to stabilize
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // G++.4: Active prioritized refetch sequence
        await this.onReconnect();
        
        // STEP 3: Update refetch timestamp
        this.lastRefetchTime = Date.now();
      } finally {
        this.isReconnecting = false;
      }
      
      this.reconnectDebounceTimeout = null;
    }, 2000);
  }

  /**
   * F.12: Invalidate only critical queries that are stale
   * REMOVED auto-refetch to preserve active UI state (search, forms)
   */
  private invalidateStaleCriticalQueries() {
    const now = Date.now();
    const criticalQueries = Object.entries(QUERY_PRIORITIES)
      .filter(([_, priority]) => priority === 'critical')
      .map(([queryKey]) => queryKey);

    console.log('[ConnectionManager] Checking critical queries for staleness');

    // F.12: Only invalidate critical queries (mark stale), don't auto-refetch
    // This preserves active search results and form data
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        const isCritical = criticalQueries.includes(key as string);
        const isStale = now - query.state.dataUpdatedAt > STALE_THRESHOLDS.critical;
        
        return isCritical && isStale;
      }
    });

    // F.12: Removed auto-refetch - queries will refetch when components need them
    // OLD: queryClient.refetchQueries({ type: 'active', ... })
  }

  /**
   * F.12: Execute prioritized invalidation on reconnection
   * ONLY processes critical queries to avoid breaking active UI
   * Processes queries in waves: critical → high → normal
   */
  private async executePrioritizedInvalidation() {
    // F.12: Skip invalidation if user is actively interacting with forms/dialogs
    if (this.userIsActivelyInteracting()) {
      console.log('[ConnectionManager] Skipping invalidation - user is actively interacting with UI');
      return;
    }
    
    if (this.isReconnecting) {
      console.log('[ConnectionManager] Already reconnecting, skipping');
      return;
    }

    this.isReconnecting = true;
    const now = Date.now();

    try {
      // F.12: Only process critical queries - skip high/normal to preserve UI state
      const priorityGroups: PriorityGroup[] = [
        { priority: 'critical', queries: [], delay: 0 },
      ];

      // F.12: Only check critical queries for staleness
      queryClient.getQueryCache().getAll().forEach((query) => {
        const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        const priority = QUERY_PRIORITIES[key as string] || 'normal';
        
        // F.12: Skip non-critical queries (guest-search, guests, etc.)
        if (priority !== 'critical') return;
        
        const threshold = STALE_THRESHOLDS[priority];
        const isStale = now - query.state.dataUpdatedAt > threshold;

        if (isStale) {
          const group = priorityGroups.find(g => g.priority === priority);
          if (group) {
            group.queries.push(key as string);
          }
        }
      });

      // Process only critical queries
      for (const group of priorityGroups) {
        if (group.queries.length === 0) continue;

        console.log(`[ConnectionManager] Invalidating ${group.priority} queries (${group.queries.length})`);

        // Invalidate this priority group (mark as stale)
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
            return group.queries.includes(key as string);
          }
        });

        // F.12: Removed auto-refetch - let components refetch when they need data
        // This prevents clearing active search results and form data
        // OLD: queryClient.refetchQueries({ type: 'active', ... })
      }

      console.log('[ConnectionManager] Prioritized invalidation complete (critical only, no auto-refetch)');
    } finally {
      this.isReconnecting = false;
    }
  }

  /**
   * Get priority for a query key
   */
  getQueryPriority(queryKey: string): QueryPriority {
    return QUERY_PRIORITIES[queryKey] || 'normal';
  }
  
  /**
   * Phase F.6: Get stale time for a query key
   */
  getStaleTime(queryKey: string): number {
    const priority = this.getQueryPriority(queryKey);
    return STALE_THRESHOLDS[priority];
  }
  
  /**
   * Phase F.6: Get cache time for a query key
   */
  getCacheTime(queryKey: string): number {
    const priority = this.getQueryPriority(queryKey);
    return CACHE_TIMES[priority];
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
    }
    if (this.visibilityTimeout) {
      clearTimeout(this.visibilityTimeout);
    }
    
    // Destroy realtime channel manager
    realtimeChannelManager.destroy();
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
