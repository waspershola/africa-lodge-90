import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * PHASE 3: Centralized Folio Calculation Hook
 * Single source of truth for all billing displays
 * 
 * This hook provides:
 * - Consistent folio balance calculations across all UI components
 * - Proper handling of overpaid/negative balances
 * - Unified data structure for charges, payments, and tax breakdowns
 * - Real-time updates with React Query caching
 */

export interface FolioCharge {
  id: string;
  charge_type: string;
  description: string;
  base_amount: number;
  service_charge_amount: number;
  vat_amount: number;
  amount: number;
  created_at: string;
}

export interface FolioPayment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  processed_by: string;
}

export interface TaxBreakdown {
  subtotal: number;
  service_charge: number;
  vat: number;
  total: number;
}

export interface FolioCalculationResult {
  folioId: string;
  folioNumber: string;
  reservationId: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  creditAmount: number;
  chargeBreakdown: FolioCharge[];
  paymentBreakdown: FolioPayment[];
  taxBreakdown: TaxBreakdown;
}

/**
 * Hook to fetch and calculate folio data from the database
 * Uses the get_folio_with_breakdown RPC function for consistency
 */
export function useFolioCalculation(folioId: string | null | undefined) {
  return useQuery({
    queryKey: ['folio-calculation', folioId],
    queryFn: async (): Promise<FolioCalculationResult | null> => {
      if (!folioId) {
        console.log('[useFolioCalculation] No folioId provided');
        return null;
      }

      console.log('[🔍 FolioCalculation] Fetching folio breakdown for:', folioId);
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .rpc('get_folio_with_breakdown', { p_folio_id: folioId });
      
      const fetchTime = Date.now() - startTime;
      console.log('[⏱️ FolioCalculation] RPC completed in:', fetchTime, 'ms');

      if (error) {
        console.error('[❌ FolioCalculation] Error fetching folio:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('[⚠️ FolioCalculation] No folio data returned for ID:', folioId);
        return null;
      }
      
      console.log('[✅ FolioCalculation] Folio data loaded:', {
        folioNumber: data[0].folio_number,
        balance: data[0].balance,
        chargesCount: Array.isArray(data[0].charges) ? data[0].charges.length : 0,
        paymentsCount: Array.isArray(data[0].payments) ? data[0].payments.length : 0
      });

      const folio = data[0];

      return {
        folioId: folio.folio_id,
        folioNumber: folio.folio_number,
        reservationId: folio.reservation_id,
        totalCharges: folio.total_charges,
        totalPayments: folio.total_payments,
        balance: folio.balance,
        status: folio.payment_status as 'paid' | 'partial' | 'unpaid' | 'overpaid',
        creditAmount: folio.credit_amount,
        chargeBreakdown: (folio.charges as unknown) as FolioCharge[],
        paymentBreakdown: (folio.payments as unknown) as FolioPayment[],
        taxBreakdown: (folio.tax_breakdown as unknown) as TaxBreakdown
      };
    },
    enabled: !!folioId,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1s between retries
  });
}

/**
 * Helper function to format currency consistently
 */
export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Helper function to get payment status display text
 */
export const getPaymentStatusLabel = (status: FolioCalculationResult['status']): string => {
  switch (status) {
    case 'paid':
      return 'Fully Paid';
    case 'overpaid':
      return 'Overpaid';
    case 'partial':
      return 'Partial Payment';
    case 'unpaid':
      return 'Unpaid';
    default:
      return 'Unknown';
  }
};

/**
 * Helper function to determine if checkout is allowed
 */
export const canCheckout = (balance: number): boolean => {
  // Allow checkout if balance is 0 or negative (paid/overpaid)
  // Tolerance of ₦0.01 for rounding
  return balance <= 0.01;
};
