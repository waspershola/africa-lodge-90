import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'PAY_LATER' | 'OVERDUE';

export interface PaymentStatusInfo {
  status: PaymentStatus;
  totalAmount: number;
  totalPayments: number;
  balance: number;
  isOverdue: boolean;
  daysSinceCheckout?: number;
}

export const usePaymentStatusManager = () => {
  const getPaymentStatus = (reservationId: string) => {
    return useQuery({
      queryKey: ['payment-status', reservationId],
      queryFn: async (): Promise<PaymentStatusInfo> => {
        const { data: folio } = await supabase
          .from('folios')
          .select('total_charges, total_payments, balance')
          .eq('reservation_id', reservationId)
          .maybeSingle();

        if (!folio) {
          return {
            status: 'UNPAID',
            totalAmount: 0,
            totalPayments: 0,
            balance: 0,
            isOverdue: false
          };
        }

        const balance = folio.balance || 0;
        let status: PaymentStatus = 'PAID';
        
        if (balance > 0) {
          if (folio.total_payments > 0) {
            status = 'PARTIAL';
          } else {
            status = 'UNPAID';
          }
        }

        return {
          status,
          totalAmount: folio.total_charges || 0,
          totalPayments: folio.total_payments || 0,
          balance,
          isOverdue: false
        };
      }
    });
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return { variant: 'default' as const, color: 'bg-green-100 text-green-800', label: 'PAID' };
      case 'PARTIAL': 
        return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800', label: 'PARTIAL' };
      case 'UNPAID':
        return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800', label: 'UNPAID' };
      case 'PAY_LATER':
        return { variant: 'outline' as const, color: 'bg-blue-100 text-blue-800', label: 'PAY LATER' };
      default:
        return { variant: 'outline' as const, color: '', label: 'UNKNOWN' };
    }
  };

  const checkPaymentRequired = (balance: number) => balance > 0;

  return {
    getPaymentStatus,
    getPaymentStatusBadge,
    checkPaymentRequired
  };
};