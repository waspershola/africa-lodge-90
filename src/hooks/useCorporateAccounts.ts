import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CorporateAccount {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms: number;
  credit_limit: number;
  current_balance: number;
  discount_rate?: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  billing_address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCorporateAccountData {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms?: number;
  credit_limit?: number;
  discount_rate?: number;
  notes?: string;
  billing_address?: string;
}

export interface UpdateCorporateAccountData extends Partial<CreateCorporateAccountData> {
  id: string;
  status?: CorporateAccount['status'];
  current_balance?: number;
}

// Main hook for corporate accounts data
export const useCorporateAccounts = () => {
  return useQuery({
    queryKey: ['corporate-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook to get a single corporate account
export const useCorporateAccount = (accountId: string) => {
  return useQuery({
    queryKey: ['corporate-account', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });
};

// Create corporate account mutation
export const useCreateCorporateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountData: CreateCorporateAccountData) => {
      // Get current user to add tenant_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('corporate_accounts')
        .insert({
          ...accountData,
          tenant_id: user.user_metadata?.tenant_id,
          payment_terms: accountData.payment_terms || 30,
          credit_limit: accountData.credit_limit || 0,
          current_balance: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] });
      toast({
        title: "Success",
        description: "Corporate account created successfully"
      });
    },
    onError: (error) => {
      console.error('Corporate account creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create corporate account",
        variant: "destructive"
      });
    }
  });
};

// Update corporate account mutation
export const useUpdateCorporateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountData: UpdateCorporateAccountData) => {
      const { id, ...updateData } = accountData;
      const { data, error } = await supabase
        .from('corporate_accounts')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['corporate-account', data.id] });
      toast({
        title: "Success",
        description: "Corporate account updated successfully"
      });
    },
    onError: (error) => {
      console.error('Corporate account update error:', error);
      toast({
        title: "Error",
        description: "Failed to update corporate account",
        variant: "destructive"
      });
    }
  });
};

// Delete corporate account mutation
export const useDeleteCorporateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('corporate_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-accounts'] });
      toast({
        title: "Success",
        description: "Corporate account deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Corporate account deletion error:', error);
      toast({
        title: "Error",
        description: "Failed to delete corporate account",
        variant: "destructive"
      });
    }
  });
};