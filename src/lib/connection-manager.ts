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

import { queryClient } from './queryClient';
import { supabaseHealthMonitor } from './supabase-health-monitor';

type QueryPriority = 'critical' | 'high' | 'normal';

interface PriorityGroup {
  priority: QueryPriority;
  queries: string[];
  delay: number;
}

// Query priority configuration
const QUERY_PRIORITIES: Record<string, QueryPriority> = {
  // Critical - must update immediately for UX
  'qr-requests': 'critical',
  'qr-requests-staff': 'critical',
  'rooms': 'critical',
  'reservations': 'critical',
  
  // High - user-facing features
  'guests': 'high',
  'guest-search': 'high',
  'qr-orders': 'high',
  'qr-codes': 'high',
  'housekeeping-tasks': 'high',
  'pos-orders': 'high',
  
  // Normal - everything else
  'payments': 'normal',
  'folios': 'normal',
  'billing': 'normal',
};

// Stale time thresholds (ms)
const STALE_THRESHOLDS = {
  critical: 30 * 1000,    // 30 seconds
  high: 60 * 1000,        // 1 minute
  normal: 2 * 60 * 1000,  // 2 minutes
};

class ConnectionManager {
  private isReconnecting = false;
  private reconnectDebounceTimeout: NodeJS.Timeout | null = null;
  private visibilityTimeout: NodeJS.Timeout | null = null;
  private lastVisibilityChange = 0;
  
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
   * Handle tab becoming visible - check for stale data
   */
  private handleTabBecameVisible() {
    console.log('[ConnectionManager] Tab became visible');

    // Clear any pending visibility timeout
    if (this.visibilityTimeout) {
      clearTimeout(this.visibilityTimeout);
    }

    // Debounce: wait 500ms before invalidating (prevents thrashing)
    this.visibilityTimeout = setTimeout(() => {
      this.invalidateStaleCriticalQueries();
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
   * Handle connection restored - intelligent invalidation
   */
  private handleConnectionRestored() {
    // Debounce reconnection - wait 2 seconds
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
    }

    this.reconnectDebounceTimeout = setTimeout(() => {
      console.log('[ConnectionManager] Executing prioritized invalidation');
      this.executePrioritizedInvalidation();
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
   * Cleanup
   */
  destroy() {
    if (this.reconnectDebounceTimeout) {
      clearTimeout(this.reconnectDebounceTimeout);
    }
    if (this.visibilityTimeout) {
      clearTimeout(this.visibilityTimeout);
    }
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
