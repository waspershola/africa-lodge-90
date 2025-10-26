// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentPolicy {
  id: string;
  tenant_id: string;
  policy_name: string;
  deposit_percentage: number;
  payment_timing: 'at_booking' | 'at_checkin' | 'flexible';
  requires_deposit: boolean;
  auto_cancel_hours: number;
  payment_methods_accepted: string[];
  late_payment_fee: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentPolicyData {
  policy_name: string;
  deposit_percentage: number;
  payment_timing: 'at_booking' | 'at_checkin' | 'flexible';
  requires_deposit: boolean;
  auto_cancel_hours: number;
  payment_methods_accepted: string[];
  late_payment_fee: number;
  is_default?: boolean;
}

// Hook to fetch payment policies
export const usePaymentPolicies = () => {
  return useQuery({
    queryKey: ['payment-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_policies')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PaymentPolicy[];
    }
  });
};

// Hook to get default payment policy
export const useDefaultPaymentPolicy = () => {
  return useQuery({
    queryKey: ['default-payment-policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_policies')
        .select('*')
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data as PaymentPolicy;
    }
  });
};

// Hook to create payment policy
export const useCreatePaymentPolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (policyData: CreatePaymentPolicyData) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // If setting as default, unset other defaults first
      if (policyData.is_default) {
        await supabase
          .from('payment_policies')
          .update({ is_default: false })
          .eq('tenant_id', user.user_metadata?.tenant_id);
      }

      const { data, error } = await supabase
        .from('payment_policies')
        .insert({
          tenant_id: user.user_metadata?.tenant_id,
          ...policyData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-policies'] });
      queryClient.invalidateQueries({ queryKey: ['default-payment-policy'] });
      toast({
        title: "Success",
        description: "Payment policy created successfully"
      });
    },
    onError: (error) => {
      console.error('Payment policy creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create payment policy",
        variant: "destructive"
      });
    }
  });
};

// Hook to update payment policy
export const useUpdatePaymentPolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreatePaymentPolicyData>) => {
      // If setting as default, unset other defaults first
      if (updateData.is_default) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Not authenticated');

        await supabase
          .from('payment_policies')
          .update({ is_default: false })
          .eq('tenant_id', user.user_metadata?.tenant_id)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('payment_policies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-policies'] });
      queryClient.invalidateQueries({ queryKey: ['default-payment-policy'] });
      toast({
        title: "Success",
        description: "Payment policy updated successfully"
      });
    },
    onError: (error) => {
      console.error('Payment policy update error:', error);
      toast({
        title: "Error",
        description: "Failed to update payment policy",
        variant: "destructive"
      });
    }
  });
};

// Hook to calculate payment amounts based on policy
export const usePaymentCalculator = () => {
  const calculatePayment = (
    totalAmount: number, 
    policy: PaymentPolicy,
    paymentOption: 'full' | 'deposit' | 'none' = 'deposit'
  ) => {
    let depositAmount = 0;
    let balanceDue = totalAmount;

    switch (paymentOption) {
      case 'full':
        depositAmount = totalAmount;
        balanceDue = 0;
        break;
      case 'deposit':
        if (policy.requires_deposit) {
          depositAmount = (totalAmount * policy.deposit_percentage) / 100;
          balanceDue = totalAmount - depositAmount;
        }
        break;
      case 'none':
        depositAmount = 0;
        balanceDue = totalAmount;
        break;
    }

    return {
      totalAmount,
      depositAmount,
      balanceDue,
      paymentStatus: depositAmount === totalAmount ? 'paid' : 
                   depositAmount > 0 ? 'partial' : 'pending'
    };
  };

  return { calculatePayment };
};