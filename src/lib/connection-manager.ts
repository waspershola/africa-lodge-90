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
  
  constructor() {
    this.setupVisibilityHandler();
    this.setupHealthMonitoring();
  }

  /**
   * Setup centralized visibility change handler
   */
  private setupVisibilityHandler() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      
      // Debounce rapid visibility changes (tab switching)
      if (now - this.lastVisibilityChange < 1000) {
        console.log('[ConnectionManager] Debouncing rapid visibility change');
        return;
      }
      
      this.lastVisibilityChange = now;

      if (document.visibilityState === 'visible') {
        this.handleTabBecameVisible();
      }
    });
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
   * Phase F.6: Handle tab becoming visible - fallback refetch mechanism
   */
  private async handleTabBecameVisible() {
    console.log('[ConnectionManager] Tab became visible');

    // Clear any pending visibility timeout
    if (this.visibilityTimeout) {
      clearTimeout(this.visibilityTimeout);
    }

    const now = Date.now();
    const timeSinceLastRefetch = now - this.lastRefetchTime;

    // Debounce: wait 500ms before invalidating (prevents thrashing)
    this.visibilityTimeout = setTimeout(async () => {
      // STEP 1: Check Supabase connection health
      const isHealthy = await supabaseHealthMonitor.checkHealth();
      
      if (!isHealthy) {
        console.warn('[ConnectionManager] Connection unhealthy - forcing reconnect');
        await supabaseHealthMonitor.forceReconnect();
      }
      
      // STEP 2: Reconnect all realtime channels BEFORE query invalidation
      console.log('[ConnectionManager] Reconnecting realtime channels...');
      await realtimeChannelManager.reconnectAll();
      
      // STEP 3: Phase F.6 - Force refetch if tab was hidden >2 minutes
      if (timeSinceLastRefetch > 2 * 60 * 1000) {
        console.log('[ConnectionManager] Tab hidden >2 min - forcing active query refetch');
        this.lastRefetchTime = Date.now();
        
        // Phase F.6: Throttled refetch (max once per 30s)
        if (timeSinceLastRefetch > 30 * 1000) {
          await queryClient.refetchQueries({ 
            type: 'active', 
            stale: true 
          });
        }
      } else {
        // Normal flow - invalidate stale critical queries only
        console.log('[ConnectionManager] Invalidating stale critical queries...');
        this.invalidateStaleCriticalQueries();
      }
      
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
   * Phase F.6: Handle connection restored with query invalidation
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
        
        // STEP 3: Phase F.6 - Invalidate critical queries immediately
        console.log('[ConnectionManager] Invalidating critical queries on reconnect');
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
            const priority = QUERY_PRIORITIES[key as string];
            return priority === 'critical';
          }
        });
        
        // STEP 4: Execute prioritized query invalidation for rest
        console.log('[ConnectionManager] Executing prioritized invalidation');
        await this.executePrioritizedInvalidation();
        
        // STEP 5: Update refetch timestamp
        this.lastRefetchTime = Date.now();
      } finally {
        this.isReconnecting = false;
      }
      
      this.reconnectDebounceTimeout = null;
    }, 2000);
  }

  /**
   * Invalidate only critical queries that are stale
   */
  private invalidateStaleCriticalQueries() {
    const now = Date.now();
    const criticalQueries = Object.entries(QUERY_PRIORITIES)
      .filter(([_, priority]) => priority === 'critical')
      .map(([queryKey]) => queryKey);

    console.log('[ConnectionManager] Checking critical queries for staleness');

    // Only invalidate critical queries older than 30 seconds
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        const isCritical = criticalQueries.includes(key as string);
        const isStale = now - query.state.dataUpdatedAt > STALE_THRESHOLDS.critical;
        
        return isCritical && isStale;
      }
    });

    // Refetch only active (visible) critical queries
    queryClient.refetchQueries({
      type: 'active',
      predicate: (query) => {
        const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return criticalQueries.includes(key as string);
      }
    });
  }

  /**
   * Execute prioritized invalidation on reconnection
   * Processes queries in waves: critical → high → normal
   */
  private async executePrioritizedInvalidation() {
    if (this.isReconnecting) {
      console.log('[ConnectionManager] Already reconnecting, skipping');
      return;
    }

    this.isReconnecting = true;
    const now = Date.now();

    try {
      // Group queries by priority
      const priorityGroups: PriorityGroup[] = [
        { priority: 'critical', queries: [], delay: 0 },
        { priority: 'high', queries: [], delay: 500 },
        { priority: 'normal', queries: [], delay: 1500 },
      ];

      // Categorize stale queries by priority
      queryClient.getQueryCache().getAll().forEach((query) => {
        const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        const priority = QUERY_PRIORITIES[key as string] || 'normal';
        const threshold = STALE_THRESHOLDS[priority];
        const isStale = now - query.state.dataUpdatedAt > threshold;

        if (isStale) {
          const group = priorityGroups.find(g => g.priority === priority);
          if (group) {
            group.queries.push(key as string);
          }
        }
      });

      // Process each priority group sequentially with delays
      for (const group of priorityGroups) {
        if (group.queries.length === 0) continue;

        console.log(`[ConnectionManager] Invalidating ${group.priority} queries (${group.queries.length})`);

        // Wait for the specified delay
        if (group.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, group.delay));
        }

        // Invalidate this priority group
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
            return group.queries.includes(key as string);
          }
        });

        // Only refetch active queries for this group
        queryClient.refetchQueries({
          type: 'active',
          predicate: (query) => {
            const key = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
            return group.queries.includes(key as string);
          }
        });
      }

      console.log('[ConnectionManager] Prioritized invalidation complete');
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
