import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useFeatureFlag } from './useFeatureFlags';

export interface Payment {
  id: string;
  tenant_id: string;
  folio_id: string;
  amount: number;
  payment_method: string;
  payment_method_id: string | null;
  reference: string | null;
  status: string;
  processed_by: string | null;
  card_last_four: string | null;
  created_at: string;
}

interface UsePaymentsOptions {
  folioId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch payments with optional pagination
 * Supports feature flag: ff/paginated_reservations
 */
export function usePayments({ folioId, limit = 100, offset = 0 }: UsePaymentsOptions = {}) {
  const { tenant } = useAuth();
  const { data: paginationEnabled } = useFeatureFlag('ff/paginated_reservations');

  return useQuery({
    queryKey: ['payments', tenant?.tenant_id, folioId, limit, offset],
    queryFn: async () => {
      if (!tenant?.tenant_id) {
        throw new Error('No tenant context available');
      }

      let query = supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (folioId) {
        query = query.eq('folio_id', folioId);
      }

      // Apply pagination if feature flag is enabled
      if (paginationEnabled) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        payments: data as Payment[],
        count: count || 0,
        hasMore: paginationEnabled ? (count || 0) > offset + limit : false,
      };
    },
    enabled: !!tenant?.tenant_id,
  });
}

/**
 * Hook to fetch payment history for a specific folio
 */
export function useFolioPayments(folioId: string) {
  return usePayments({ folioId, limit: 50 });
}
