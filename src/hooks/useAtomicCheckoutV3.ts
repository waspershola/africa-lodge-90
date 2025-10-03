import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';

export interface AtomicCheckoutV3Params {
  reservationId: string;
}

export interface AtomicCheckoutV3Result {
  success: boolean;
  folio_id: string | null;
  room_id: string | null;
  message: string;
  final_balance: number;
}

/**
 * Hook for atomic checkout operations V3
 * Uses enhanced database function with payment validation
 * Ensures room status updates to 'dirty' after checkout
 */
export function useAtomicCheckoutV3() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (params: AtomicCheckoutV3Params): Promise<AtomicCheckoutV3Result> => {
    if (!tenant?.tenant_id) {
      throw new Error('No tenant context available');
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    console.log('[Atomic Checkout V3] Starting checkout process:', {
      reservationId: params.reservationId,
      tenantId: tenant.tenant_id
    });

    // PHASE 5: Pre-Checkout Validation (CRITICAL)
    // Validate balance before allowing checkout
    const { data: folio, error: folioError } = await supabase
      .from('folios')
      .select('total_charges, total_payments, folio_number')
      .eq('reservation_id', params.reservationId)
      .eq('status', 'open')
      .single();

    if (folioError || !folio) {
      const errorMsg = 'No active folio found for this reservation';
      console.error('[Atomic Checkout V3] Validation error:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }

    const balance = (folio.total_charges || 0) - (folio.total_payments || 0);
    console.log('[Atomic Checkout V3] Folio validation:', {
      folioNumber: folio.folio_number,
      totalCharges: folio.total_charges,
      totalPayments: folio.total_payments,
      balance
    });

    // Block checkout if balance > ₦0.01
    if (balance > 0.01) {
      const errorMsg = `Cannot checkout with outstanding balance of ₦${balance.toFixed(2)}. Please settle payment before checkout.`;
      console.error('[Atomic Checkout V3] Checkout blocked:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }

    // Log if guest has credit (overpaid)
    if (balance < -0.01) {
      console.log('[Atomic Checkout V3] Guest has credit:', {
        creditAmount: Math.abs(balance).toFixed(2),
        note: 'Consider refund or store as credit for future stay'
      });
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Checkout timeout after 30 seconds')), 30000);
    });

    try {
      const checkoutPromise = supabase.rpc('atomic_checkout_v3', {
        p_tenant_id: tenant.tenant_id,
        p_reservation_id: params.reservationId
      });

      const { data, error: rpcError } = await Promise.race([
        checkoutPromise,
        timeoutPromise
      ]);

      if (rpcError) {
        console.error('[Atomic Checkout V3] RPC error:', rpcError);
        throw new Error(rpcError.message || 'Checkout failed');
      }

      if (!data || data.length === 0) {
        throw new Error('No response from checkout function');
      }

      const result = data[0] as AtomicCheckoutV3Result;
      
      const duration = Date.now() - startTime;
      console.log('[Atomic Checkout V3] Result:', {
        ...result,
        duration: `${duration}ms`
      });

      if (result.success) {
        console.log('[Atomic Checkout V3] Success - invalidating queries');
        // Aggressive query invalidation to ensure UI updates
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['room-availability', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folio-balances', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['payments', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['overstays', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        ]);
        
        // Force refetch rooms to update UI immediately
        await queryClient.refetchQueries({ queryKey: ['rooms', tenant.tenant_id] });
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during checkout';
      console.error('[Atomic Checkout V3] Error:', errorMessage);
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
