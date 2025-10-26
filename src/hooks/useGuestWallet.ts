// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

export interface GuestWallet {
  id: string;
  tenant_id: string;
  guest_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  guest_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  payment_method?: string;
  payment_method_id?: string;
  processed_by?: string;
  created_at: string;
}

export function useGuestWallet(guestId?: string) {
  const { tenant } = useAuth();
  const queryClient = useQueryClient();

  // Get or create wallet for guest
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['guest-wallet', tenant?.tenant_id, guestId],
    queryFn: async () => {
      if (!tenant?.tenant_id || !guestId) return null;

      // Try to get existing wallet
      const { data, error } = await supabase
        .from('guest_wallets')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('guest_id', guestId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not "not found" error
        throw error;
      }

      // If no wallet exists, create one
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from('guest_wallets')
          .insert({
            tenant_id: tenant.tenant_id,
            guest_id: guestId,
            balance: 0,
            currency: 'NGN'
          })
          .select()
          .single();

        if (createError) throw createError;
        return newWallet as GuestWallet;
      }

      return data as GuestWallet;
    },
    enabled: !!tenant?.tenant_id && !!guestId,
  });

  // Get wallet transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', tenant?.tenant_id, wallet?.id],
    queryFn: async () => {
      if (!tenant?.tenant_id || !wallet?.id) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!tenant?.tenant_id && !!wallet?.id,
  });

  // Process wallet transaction mutation
  const processTransaction = useMutation({
    mutationFn: async (params: {
      walletId: string;
      transactionType: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'adjustment';
      amount: number;
      description: string;
      referenceType?: string;
      referenceId?: string;
      paymentMethod?: string;
      paymentMethodId?: string;
    }) => {
      const { data, error } = await supabase.rpc('process_wallet_transaction', {
        p_wallet_id: params.walletId,
        p_transaction_type: params.transactionType,
        p_amount: params.amount,
        p_description: params.description,
        p_reference_type: params.referenceType || null,
        p_reference_id: params.referenceId || null,
        p_payment_method: params.paymentMethod || null,
        p_payment_method_id: params.paymentMethodId || null,
        p_metadata: {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate wallet and transaction queries
      queryClient.invalidateQueries({ queryKey: ['guest-wallet', tenant?.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', tenant?.tenant_id] });
      toast.success('Wallet transaction processed successfully');
    },
    onError: (error: any) => {
      console.error('Wallet transaction error:', error);
      toast.error(error.message || 'Failed to process wallet transaction');
    }
  });

  // Deposit to wallet
  const depositToWallet = async (params: {
    amount: number;
    paymentMethod: string;
    paymentMethodId?: string;
    description?: string;
  }) => {
    if (!wallet) throw new Error('Wallet not found');
    
    return processTransaction.mutateAsync({
      walletId: wallet.id,
      transactionType: 'deposit',
      amount: params.amount,
      description: params.description || `Wallet deposit via ${params.paymentMethod}`,
      paymentMethod: params.paymentMethod,
      paymentMethodId: params.paymentMethodId
    });
  };

  // Pay from wallet
  const payFromWallet = async (params: {
    amount: number;
    description: string;
    referenceType?: string;
    referenceId?: string;
  }) => {
    if (!wallet) throw new Error('Wallet not found');
    
    return processTransaction.mutateAsync({
      walletId: wallet.id,
      transactionType: 'payment',
      amount: params.amount,
      description: params.description,
      referenceType: params.referenceType,
      referenceId: params.referenceId
    });
  };

  // Refund to wallet
  const refundToWallet = async (params: {
    amount: number;
    description: string;
    referenceType?: string;
    referenceId?: string;
  }) => {
    if (!wallet) throw new Error('Wallet not found');
    
    return processTransaction.mutateAsync({
      walletId: wallet.id,
      transactionType: 'refund',
      amount: params.amount,
      description: params.description,
      referenceType: params.referenceType,
      referenceId: params.referenceId
    });
  };

  return {
    wallet,
    transactions,
    walletLoading,
    transactionsLoading,
    depositToWallet,
    payFromWallet,
    refundToWallet,
    processTransaction: processTransaction.mutateAsync
  };
}
