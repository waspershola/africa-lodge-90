import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

export interface AtomicCheckoutV2Params {
  reservationId: string;
}

export interface AtomicCheckoutV2Result {
  success: boolean;
  folio_id: string | null;
  room_id: string | null;
  message: string;
}

/**
 * Phase 5: Enhanced Atomic Checkout Hook
 * Features advisory locks, comprehensive logging, and race condition prevention
 */
export function useAtomicCheckoutV2() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (params: AtomicCheckoutV2Params): Promise<AtomicCheckoutV2Result> => {
    if (!tenant?.tenant_id) {
      throw new Error('No tenant context available');
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    console.log('[Atomic Checkout V2] Starting enhanced checkout:', {
      reservationId: params.reservationId,
      tenantId: tenant.tenant_id,
      timestamp: new Date().toISOString(),
    });

    // Set timeout to prevent infinite processing
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Checkout timeout after 30 seconds')), 30000);
    });

    try {
      // Phase R.9: Validate token before critical RPC operation
      await validateAndRefreshToken();
      
      // Call enhanced atomic checkout with advisory locks
      const checkoutPromise = supabase.rpc('atomic_checkout_v2', {
        p_tenant_id: tenant.tenant_id,
        p_reservation_id: params.reservationId,
      });

      const { data, error: rpcError } = await Promise.race([
        checkoutPromise,
        timeoutPromise,
      ]);

      if (rpcError) {
        console.error('[Atomic Checkout V2] RPC error:', rpcError);
        throw new Error(rpcError.message || 'Checkout failed');
      }

      if (!data || data.length === 0) {
        throw new Error('No response from enhanced checkout function');
      }

      const result = data[0] as AtomicCheckoutV2Result;

      const duration = Date.now() - startTime;
      console.log('[Atomic Checkout V2] Result:', {
        ...result,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Enhanced query invalidation
      if (result.success) {
        console.log('[Atomic Checkout V2] Success - invalidating all related queries');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['overstays', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['payments', tenant.tenant_id] }),
        ]);
      } else {
        setError(result.message);
        console.warn('[Atomic Checkout V2] Checkout not completed:', result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during checkout';
      console.error('[Atomic Checkout V2] Error:', {
        error: errorMessage,
        reservationId: params.reservationId,
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkout,
    isLoading,
    error,
  };
}
