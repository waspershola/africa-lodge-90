import { QueryClient } from '@tanstack/react-query';

export interface OptimisticUpdate<T = any> {
  queryKey: string[];
  updater: (oldData: T) => T;
  rollback?: (oldData: T) => T;
}

export interface OptimisticOperation {
  id: string;
  updates: OptimisticUpdate[];
  originalData: Map<string, any>;
}

/**
 * OptimisticUpdateManager - Manages optimistic UI updates for instant feedback
 * 
 * Usage:
 * const manager = new OptimisticUpdateManager(queryClient);
 * const opId = manager.applyOptimistic([{
 *   queryKey: ['rooms', tenantId],
 *   updater: (old) => old.map(r => r.id === roomId ? { ...r, status: 'occupied' } : r)
 * }]);
 * 
 * // On success: commit (no-op, changes are already applied)
 * manager.commit(opId);
 * 
 * // On error: rollback
 * manager.rollback(opId);
 */
export class OptimisticUpdateManager {
  private queryClient: QueryClient;
  private operations: Map<string, OptimisticOperation> = new Map();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Apply optimistic updates immediately to query cache
   * Returns operation ID for commit/rollback
   */
  applyOptimistic(updates: OptimisticUpdate[]): string {
    const opId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const originalData = new Map<string, any>();

    updates.forEach(({ queryKey, updater }) => {
      // Store original data for potential rollback
      const current = this.queryClient.getQueryData(queryKey);
      originalData.set(queryKey.join('::'), current);

      // Apply optimistic update
      this.queryClient.setQueryData(queryKey, updater);
    });

    this.operations.set(opId, { id: opId, updates, originalData });
    return opId;
  }

  /**
   * Commit the operation (no-op, changes already applied)
   * Cleans up stored rollback data
   */
  commit(opId: string): void {
    this.operations.delete(opId);
  }

  /**
   * Rollback optimistic changes on error
   */
  rollback(opId: string): void {
    const operation = this.operations.get(opId);
    if (!operation) return;

    operation.updates.forEach(({ queryKey, rollback }) => {
      const originalKey = queryKey.join('::');
      const originalData = operation.originalData.get(originalKey);

      if (rollback) {
        // Use custom rollback function if provided
        this.queryClient.setQueryData(queryKey, rollback);
      } else {
        // Restore original data
        this.queryClient.setQueryData(queryKey, originalData);
      }
    });

    this.operations.delete(opId);
  }

  /**
   * Clear all pending operations (use on unmount or reset)
   */
  clearAll(): void {
    this.operations.clear();
  }
}

/**
 * Helper to create optimistic update for array item mutation
 */
export const createArrayItemUpdate = <T extends { id: string }>(
  itemId: string,
  updater: (item: T) => T
) => {
  return (oldData: T[] | undefined): T[] => {
    if (!oldData) return [];
    return oldData.map(item => 
      item.id === itemId ? updater(item) : item
    );
  };
};

/**
 * Helper to create optimistic update for single item mutation
 */
export const createSingleItemUpdate = <T>(
  updater: (item: T | undefined) => T
) => {
  return (oldData: T | undefined): T => {
    return updater(oldData);
  };
};

/**
 * Helper to create optimistic update for adding item to array
 */
export const createArrayAppendUpdate = <T>(newItem: T) => {
  return (oldData: T[] | undefined): T[] => {
    return [...(oldData || []), newItem];
  };
};

/**
 * Helper to create optimistic update for removing item from array
 */
export const createArrayRemoveUpdate = <T extends { id: string }>(itemId: string) => {
  return (oldData: T[] | undefined): T[] => {
    if (!oldData) return [];
    return oldData.filter(item => item.id !== itemId);
  };
};
