import { queryClient } from "@/lib/queryClient";
import { reinitializeSupabaseClient } from "@/integrations/supabase/client";
import { validateAndRefreshToken } from "@/lib/auth-token-validator";

let isRehydrating = false;
let rehydrationPromise: Promise<void> | null = null;

/**
 * Phase 2: Global Rehydration Manager
 * 
 * Centralized rehydration logic that ensures:
 * 1. Token is fresh and valid
 * 2. Supabase client is synced with latest session
 * 3. All queries are invalidated and refetched
 * 4. No concurrent rehydrations (debounced)
 * 
 * Call this on:
 * - Tab visibility change (visible)
 * - Network reconnection
 * - Manual trigger before critical operations
 */
export async function rehydrateAll(): Promise<void> {
  // Prevent concurrent rehydrations
  if (isRehydrating && rehydrationPromise) {
    console.log('[RehydrationManager] Already rehydrating, waiting...');
    return rehydrationPromise;
  }

  isRehydrating = true;
  
  rehydrationPromise = (async () => {
    const startTime = Date.now();
    
    try {
      console.log('[RehydrationManager] Starting full rehydration', {
        timestamp: new Date().toISOString(),
        currentPath: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 50)
      });
      
      // Step 1: Validate and refresh token
      await validateAndRefreshToken();
      
      // Step 2: **CRITICAL** - Reinitialize Supabase client with fresh session
      await reinitializeSupabaseClient();
      
      // Step 3: Resume paused mutations (React Query feature for offline support)
      queryClient.resumePausedMutations();
      
      // Step 4: Invalidate all critical queries to trigger refetch
      await queryClient.invalidateQueries({
        predicate: (query) => {
          // Invalidate all queries except those marked as permanent cache
          const isPermanent = query.queryKey.includes('permanent');
          return !isPermanent;
        }
      });
      
      // Step 5: Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('app-rehydrated', { 
        detail: { 
          timestamp: Date.now(),
          duration: Date.now() - startTime
        } 
      }));
      
      const duration = Date.now() - startTime;
      console.log('[RehydrationManager] Full rehydration complete', {
        duration: `${duration}ms`,
        success: true
      });
      
    } catch (error) {
      console.error('[RehydrationManager] Rehydration failed:', error);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('app-rehydration-error', { 
        detail: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        } 
      }));
      
      throw error;
    } finally {
      isRehydrating = false;
      rehydrationPromise = null;
    }
  })();
  
  return rehydrationPromise;
}

/**
 * Check if a rehydration is currently in progress
 */
export function isRehydratingNow(): boolean {
  return isRehydrating;
}

/**
 * Hook for components to use rehydration
 */
export function useGlobalRehydration() {
  return { 
    rehydrateAll,
    isRehydrating: isRehydratingNow
  };
}
