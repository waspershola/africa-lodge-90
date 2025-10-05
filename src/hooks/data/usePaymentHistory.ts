import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  processed_by: string | null;
  processor_name: string | null;
  department_name: string | null;
  terminal_name: string | null;
  is_verified: boolean;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
}

export function usePaymentHistory(folioId: string | undefined) {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['payment-history', folioId, tenant?.tenant_id],
    queryFn: async () => {
      if (!folioId || !tenant?.tenant_id) {
        throw new Error('Folio ID and tenant required');
      }

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_method,
          reference,
          status,
          payment_status,
          created_at,
          processed_by,
          is_verified,
          gross_amount,
          fee_amount,
          net_amount,
          processor:processed_by(name),
          department:departments(name),
          terminal:terminals(name)
        `)
        .eq('folio_id', folioId)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        reference: payment.reference,
        status: payment.status,
        payment_status: payment.payment_status,
        created_at: payment.created_at,
        processed_by: payment.processed_by,
        processor_name: payment.processor?.name || null,
        department_name: payment.department?.name || null,
        terminal_name: payment.terminal?.name || null,
        is_verified: payment.is_verified || false,
        gross_amount: payment.gross_amount || payment.amount,
        fee_amount: payment.fee_amount || 0,
        net_amount: payment.net_amount || payment.amount,
      })) as PaymentHistoryItem[];
    },
    enabled: !!folioId && !!tenant?.tenant_id,
  });
}
