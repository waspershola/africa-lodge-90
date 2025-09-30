import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQueryClient } from '@tanstack/react-query';

export interface AtomicCheckInParams {
  reservationId: string;
  roomId: string;
  guestData?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    guest_id_number?: string;
    nationality?: string;
    address?: string;
  };
  initialCharges?: Array<{
    charge_type?: string;
    description: string;
    amount: number;
  }>;
}

export interface AtomicCheckInResult {
  success: boolean;
  reservation_id: string | null;
  room_id: string | null;
  folio_id: string | null;
  guest_id: string | null;
  message: string;
}

/**
 * Hook for atomic check-in operations
 * Uses database function to ensure all check-in steps happen in a single transaction
 */
export function useAtomicCheckIn() {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIn = async (params: AtomicCheckInParams): Promise<AtomicCheckInResult> => {
    if (!tenant?.tenant_id) {
      throw new Error('No tenant context available');
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    console.log('[Atomic Check-in] Starting check-in process:', {
      reservationId: params.reservationId,
      roomId: params.roomId,
      tenantId: tenant.tenant_id,
      hasGuestData: !!params.guestData,
      chargeCount: params.initialCharges?.length || 0
    });

    try {
      // Call atomic check-in database function
      const { data, error: rpcError } = await supabase.rpc('atomic_checkin_guest', {
        p_tenant_id: tenant.tenant_id,
        p_reservation_id: params.reservationId,
        p_room_id: params.roomId,
        p_guest_payload: params.guestData || null,
        p_initial_charges: params.initialCharges || []
      });

      if (rpcError) {
        console.error('[Atomic Check-in] RPC error:', rpcError);
        throw new Error(rpcError.message || 'Check-in failed');
      }

      if (!data || data.length === 0) {
        throw new Error('No response from check-in function');
      }

      const result = data[0] as AtomicCheckInResult;
      
      const duration = Date.now() - startTime;
      console.log('[Atomic Check-in] Result:', {
        ...result,
        duration: `${duration}ms`
      });

      // If successful, invalidate relevant queries for immediate UI update
      if (result.success) {
        console.log('[Atomic Check-in] Success - invalidating queries');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['rooms', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['reservations', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['folios', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['guests', tenant.tenant_id] }),
          queryClient.invalidateQueries({ queryKey: ['overstays', tenant.tenant_id] })
        ]);
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during check-in';
      console.error('[Atomic Check-in] Error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkIn,
    isLoading,
    error
  };
}
