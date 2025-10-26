import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface PendingPayment {
  id: string;
  guest_name: string;
  room_number: string;
  amount_due: number;
  days_overdue: number;
}

export const usePendingPayments = () => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['pending-payments', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('folios')
        .select(`
          id,
          folio_number,
          total_charges,
          total_payments,
          created_at,
          reservations!inner (
            guest_name,
            rooms!inner (
              room_number
            )
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'open')
        .gt('total_charges', 0);

      if (error) throw error;

      const pendingPayments = data
        .filter(folio => {
          const balance = (folio.total_charges || 0) - (folio.total_payments || 0);
          return balance > 0;
        })
        .map(folio => {
          const balance = (folio.total_charges || 0) - (folio.total_payments || 0);
          const createdDate = new Date(folio.created_at);
          const now = new Date();
          const daysOverdue = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            id: folio.id,
            guest_name: folio.reservations?.guest_name || 'Guest',
            room_number: folio.reservations?.rooms?.room_number || 'Unknown',
            amount_due: balance,
            days_overdue: Math.max(0, daysOverdue)
          };
        });

      return pendingPayments as PendingPayment[];
    },
    enabled: !!tenant?.tenant_id,
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
};