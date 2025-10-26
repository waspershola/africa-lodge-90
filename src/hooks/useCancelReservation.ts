import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CancelReservationParams {
  reservationId: string;
  reason?: string;
}

export interface CancelReservationResult {
  success: boolean;
  message: string;
  reservation_id: string | null;
}

/**
 * Hook for atomic cancellation operations
 * Uses database function to ensure reservation and room are updated atomically
 */
export function useCancelReservation() {
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelReservation = async (params: CancelReservationParams): Promise<CancelReservationResult> => {
    if (!tenant?.tenant_id) {
      throw new Error('No tenant context available');
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    console.log('[Cancel Reservation] Starting cancellation:', {
      reservationId: params.reservationId,
      tenantId: tenant.tenant_id,
      reason: params.reason
    });

    try {
      const { data, error: rpcError } = await supabase.rpc('cancel_reservation_atomic', {
        p_tenant_id: tenant.tenant_id,
        p_reservation_id: params.reservationId,
        p_cancelled_by: user?.id || null,
        p_reason: params.reason || null
      });

      if (rpcError) {
        console.error('[Cancel Reservation] RPC error:', rpcError);
        throw new Error(rpcError.message || 'Cancellation failed');
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No response from cancellation function');
      }

      const result = (Array.isArray(data) ? data[0] : data) as unknown as CancelReservationResult;
      
      const duration = Date.now() - startTime;
      console.log('[Cancel Reservation] Result:', {
        ...result,
        duration: `${duration}ms`
      });

      if (result.success) {
        console.log('[Cancel Reservation] Success - invalidating queries');
        // Aggressive query invalidation to ensure room is released
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['room-availability', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        ]);
        
        // Force refetch to update UI immediately
        await queryClient.refetchQueries({ queryKey: ['rooms', tenant.tenant_id] });
        await queryClient.refetchQueries({ queryKey: ['reservations', tenant.tenant_id] });
        
        toast.success(result.message);
      } else {
        setError(result.message);
        toast.error(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during cancellation';
      console.error('[Cancel Reservation] Error:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelReservation,
    isLoading,
    error
  };
}
