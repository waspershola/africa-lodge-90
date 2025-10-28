import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { OptimisticUpdateManager, createArrayItemUpdate } from '@/lib/optimistic-updates';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

export interface AtomicCheckoutV3Params {
  reservationId: string;
}

export interface AtomicCheckoutV3Result {
  success: boolean;
  folio_id: string | null;
  room_id: string | null;
  message: string;
  final_balance?: number;
}

/**
 * Enhanced atomic checkout with pre-validation
 */
export function useAtomicCheckoutV3() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optimisticManager = new OptimisticUpdateManager(queryClient);

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

    // Apply optimistic updates immediately for instant UI feedback
    const opId = optimisticManager.applyOptimistic([
      {
        queryKey: ['reservations', tenant.tenant_id],
        updater: createArrayItemUpdate(params.reservationId, (res: any) => ({
          ...res,
          status: 'checked_out'
        }))
      }
    ]);

    try {
      // Phase 2: Use protected mutation wrapper for token validation + client reinitialization
      const { protectedMutate } = await import('@/lib/mutation-utils');
      
      const { data, error: rpcError } = await protectedMutate(async () => {
        // Pre-checkout validation: Check folio balance
        const { data: reservation, error: resError } = await supabase
          .from('reservations')
          .select(`
            id,
            status,
            total_amount,
            folios!inner (
              id,
              total_charges,
              total_payments,
              balance
            )
          `)
          .eq('id', params.reservationId)
          .single();

        if (resError || !reservation) {
          throw new Error(`Reservation not found: ${resError?.message || 'Unknown error'}`);
        }

        const folio = reservation.folios[0];
        if (!folio) {
          throw new Error('No folio found for this reservation');
        }

        console.log('[Atomic Checkout V3] Folio balance check:', {
          folioBalance: folio.balance,
          totalCharges: folio.total_charges,
          totalPayments: folio.total_payments
        });

        // Allow checkout if balance is 0 or nearly 0 (within ₦0.01 tolerance)
        // Only block if balance is POSITIVE (unpaid) - negative means overpaid/credit
        const balanceTolerance = 0.01;
        if (folio.balance > balanceTolerance) {
          const message = `Cannot checkout: Outstanding balance of ₦${folio.balance.toFixed(2)}. Please settle all charges before checkout.`;
          console.error('[Atomic Checkout V3] Pre-checkout validation failed:', message);
          
          optimisticManager.rollback(opId);
          setError(message);
          setIsLoading(false);
          
          return {
            data: null,
            error: { message } as any
          };
        }

        // Log if guest has credit balance (overpayment)
        if (folio.balance < -balanceTolerance) {
          console.log('[Atomic Checkout V3] ✅ Checkout allowed with credit balance:', folio.balance);
        } else {
          console.log('[Atomic Checkout V3] ✅ Pre-checkout validation passed!');
        }

        // Call atomic checkout database function
        return await supabase.rpc('atomic_checkout_v3', {
          p_tenant_id: tenant.tenant_id,
          p_reservation_id: params.reservationId
        });
      }, 'atomicCheckoutV3');

      // Handle validation failure (balance check)
      if (rpcError?.message) {
        optimisticManager.rollback(opId);
        setError(rpcError.message);
        setIsLoading(false);
        
        return {
          success: false,
          folio_id: null,
          room_id: null,
          message: rpcError.message
        };
      }

      if (rpcError) {
        console.error('[Atomic Checkout V3] RPC error:', rpcError);
        throw new Error(rpcError.message || 'Checkout failed');
      }

      if (!data) {
        throw new Error('No response from checkout function');
      }

      // Handle both array and object responses from RPC
      const result = (Array.isArray(data) ? data[0] : data) as unknown as AtomicCheckoutV3Result;
      
      const duration = Date.now() - startTime;
      console.log('[Atomic Checkout V3] Result:', {
        ...result,
        duration: `${duration}ms`
      });

      if (result.success) {
        console.log('[Atomic Checkout V3] Success - committing optimistic updates');
        optimisticManager.commit(opId);
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['overstays', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['billing', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] })
        ]);

        // Optimistically update room status in cache
        if (result.room_id) {
          queryClient.setQueryData(['rooms', tenant.tenant_id], (oldRooms: any[] = []) => {
            return oldRooms.map(room => 
              room.id === result.room_id 
                ? { ...room, status: 'dirty' }
                : room
            );
          });
        }
      } else {
        console.log('[Atomic Checkout V3] Failed - rolling back optimistic updates');
        optimisticManager.rollback(opId);
        setError(result.message);
      }

      return result;
    } catch (err) {
      console.error('[Atomic Checkout V3] Error - rolling back optimistic updates');
      optimisticManager.rollback(opId);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during checkout';
      console.error('[Atomic Checkout V3] Error:', errorMessage);
      setError(errorMessage);
      
      return {
        success: false,
        folio_id: null,
        room_id: null,
        message: errorMessage
      };
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
