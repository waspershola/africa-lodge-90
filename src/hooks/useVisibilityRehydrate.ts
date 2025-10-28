import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { reinitializeSupabaseClient } from '@/integrations/supabase/client';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

/**
 * Phase 8.1: Visibility Rehydration Hook
 * 
 * Ensures data freshness when component mounts or tab becomes visible
 * Use this in critical pages like FrontDesk, GuestSearch, Folio
 * 
 * @param queryKeys - Array of query keys to invalidate on rehydration
 */
export function useVisibilityRehydrate(queryKeys: string[] = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let busy = false;

    const rehydrate = async () => {
      if (busy || document.visibilityState !== 'visible') return;
      busy = true;
      
      try {
        console.log('[VisibilityRehydrate] Revalidating session...');
        await validateAndRefreshToken();
        await reinitializeSupabaseClient();
        
        // Invalidate specified queries
        if (queryKeys.length > 0) {
          await Promise.all(
            queryKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] }))
          );
        }
        
        console.log('[VisibilityRehydrate] Complete');
      } catch (err) {
        console.warn('[VisibilityRehydrate] Failed:', err);
      } finally {
        busy = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') rehydrate();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    
    // Run on mount
    rehydrate();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [queryKeys.join(','), queryClient]);
}
