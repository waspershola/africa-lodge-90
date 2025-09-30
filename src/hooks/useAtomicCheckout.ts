import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';

export interface AtomicCheckoutParams {
  reservationId: string;
}

export interface AtomicCheckoutResult {
  success: boolean;
  folio_id: string | null;
  room_id: string | null;
  message: string;
}

/**
 * Hook for atomic checkout operations
 * Uses database function to ensure all checkout steps happen in a single transaction
 */
export function useAtomicCheckout() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (params: AtomicCheckoutParams): Promise<AtomicCheckoutResult> => {
    if (!tenant?.tenant_id) {
      throw new Error('No tenant context available');
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    console.log('[Atomic Checkout] Starting checkout process:', {
      reservationId: params.reservationId,
      tenantId: tenant.tenant_id
    });

    // Set timeout to prevent infinite processing
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Checkout timeout after 30 seconds')), 30000);
    });

    try {
      // Call atomic checkout database function with timeout
      const checkoutPromise = supabase.rpc('atomic_checkout', {
        p_tenant_id: tenant.tenant_id,
        p_reservation_id: params.reservationId
      });

      const { data, error: rpcError } = await Promise.race([
        checkoutPromise,
        timeoutPromise
      ]);

      if (rpcError) {
        console.error('[Atomic Checkout] RPC error:', rpcError);
        throw new Error(rpcError.message || 'Checkout failed');
      }

      if (!data || data.length === 0) {
        throw new Error('No response from checkout function');
      }

      const result = data[0] as AtomicCheckoutResult;
      
      const duration = Date.now() - startTime;
      console.log('[Atomic Checkout] Result:', {
        ...result,
        duration: `${duration}ms`
      });

      // If successful, invalidate relevant queries for immediate UI update
      if (result.success) {
        console.log('[Atomic Checkout] Success - invalidating queries');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] })
        ]);
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during checkout';
      console.error('[Atomic Checkout] Error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkout,
    isLoading,
    error
  };
}
