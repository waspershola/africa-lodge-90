// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface BillData {
  id: string;
  folio_number: string;
  reservation_id: string;
  status: 'open' | 'closed';
  total_charges: number;
  total_payments: number;
  balance: number;
  created_at: string;
  updated_at: string;
  guest_name?: string;
  guest_email?: string;
  room_number?: string;
  check_in_date?: string;
  check_out_date?: string;
  charges?: any[];
  payments?: any[];
}

export function useBillingData() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all folios/bills with reservation details
  const { data: bills = [], isLoading, error } = useQuery({
    queryKey: ['bills', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('folios')
        .select(`
          *,
          reservation:reservations (
            guest_name,
            guest_email,
            check_in_date,
            check_out_date,
            room:rooms (
              room_number
            )
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((folio: any) => ({
        id: folio.id,
        folio_number: folio.folio_number,
        reservation_id: folio.reservation_id,
        status: folio.status,
        total_charges: folio.total_charges || 0,
        total_payments: folio.total_payments || 0,
        balance: folio.balance || (folio.total_charges - folio.total_payments),
        created_at: folio.created_at,
        updated_at: folio.updated_at,
        guest_name: folio.reservation?.guest_name,
        guest_email: folio.reservation?.guest_email,
        room_number: folio.reservation?.room?.room_number,
        check_in_date: folio.reservation?.check_in_date,
        check_out_date: folio.reservation?.check_out_date,
      })) as BillData[];
    },
    enabled: !!tenant?.tenant_id,
  });

  // Fetch charges for a specific folio
  const useFolioCharges = (folioId: string) => {
    return useQuery({
      queryKey: ['folio-charges', folioId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('folio_charges')
          .select('*')
          .eq('folio_id', folioId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      enabled: !!folioId,
    });
  };

  // Fetch payments for a specific folio
  const useFolioPayments = (folioId: string) => {
    return useQuery({
      queryKey: ['folio-payments', folioId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('folio_id', folioId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      enabled: !!folioId,
    });
  };

  // Add charge to folio
  const addCharge = useMutation({
    mutationFn: async ({ 
      folioId, 
      chargeType, 
      description, 
      amount 
    }: { 
      folioId: string; 
      chargeType: string; 
      description: string; 
      amount: number;
    }) => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('folio_charges')
        .insert({
          tenant_id: tenant.tenant_id,
          folio_id: folioId,
          charge_type: chargeType,
          description,
          amount,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['folio-charges'] });
      toast({
        title: 'Charge Added',
        description: 'The charge has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add charge',
        variant: 'destructive',
      });
    },
  });

  // Record payment
  const recordPayment = useMutation({
    mutationFn: async ({ 
      folioId, 
      amount, 
      paymentMethod, 
      reference,
      notes,
      departmentId,
      terminalId
    }: { 
      folioId: string; 
      amount: number; 
      paymentMethod: string; 
      reference?: string;
      notes?: string;
      departmentId?: string;
      terminalId?: string;
    }) => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      // Get current user ID for verification
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenant.tenant_id,
          folio_id: folioId,
          amount,
          payment_method: paymentMethod,
          reference: reference || `PAY-${Date.now()}`,
          status: 'completed',
          department_id: departmentId || null,
          terminal_id: terminalId || null,
          payment_source: 'frontdesk',
          payment_status: 'paid',
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id || null,
          gross_amount: amount,
          fee_amount: 0,
          net_amount: amount
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['folio-payments'] });
      toast({
        title: 'Payment Recorded',
        description: 'The payment has been recorded successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    },
  });

  return {
    bills,
    isLoading,
    error,
    useFolioCharges,
    useFolioPayments,
    addCharge,
    recordPayment,
  };
}
