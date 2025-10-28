import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { rehydrateAll } from '@/lib/rehydration-manager';

/**
 * Phase 2: Visibility Rehydration Hook
 * 
 * Ensures data freshness when component mounts or receives rehydration events.
 * Use this in critical pages/components like:
 * - FrontDesk Dashboard
 * - Checkout Dialog
 * - Guest Search
 * - Reservation Management
 * - Folio Management
 * 
 * @param options.onMount - Run rehydration when component mounts (default: true)
 * @param options.queryKeys - Specific query keys to invalidate (optional)
 */
export function useVisibilityRehydrate(options?: { 
  onMount?: boolean; 
  queryKeys?: string[] 
}) {
  const { onMount = true, queryKeys = [] } = options || {};
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const handleRehydrate = async () => {
      try {
        console.log('[useVisibilityRehydrate] Starting component rehydration');
        
        // Use global rehydration manager
        await rehydrateAll();
        
        // Additionally invalidate specific query keys if provided
        if (queryKeys.length > 0) {
          await Promise.all(
            queryKeys.map(key => 
              queryClient.invalidateQueries({ queryKey: [key] })
            )
          );
          console.log('[useVisibilityRehydrate] Invalidated specific keys:', queryKeys);
        }
        
      } catch (error) {
        console.warn('[useVisibilityRehydrate] Rehydration failed:', error);
      }
    };
    
    // Run on mount if enabled
    if (onMount) {
      handleRehydrate();
    }
    
    // Listen to global app-rehydrated event
    const handleAppRehydrated = () => {
      console.log('[useVisibilityRehydrate] App rehydrated, component updated');
      
      // Refetch specific queries if provided
      if (queryKeys.length > 0) {
        queryKeys.forEach(key => {
          queryClient.refetchQueries({ queryKey: [key] });
        });
      }
    };
    
    window.addEventListener('app-rehydrated', handleAppRehydrated);
    
    return () => {
      window.removeEventListener('app-rehydrated', handleAppRehydrated);
    };
  }, [onMount, queryKeys.join(','), queryClient]);
}
