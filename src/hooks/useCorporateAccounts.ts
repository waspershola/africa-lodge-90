import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
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
  payment_terms?: number;
  credit_limit?: number;
  current_balance?: number;
  discount_rate?: number;
  status?: string;
  billing_address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
  billing_address?: string;
  notes?: string;
}

export function useCorporateAccounts() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);

  const fetchAccounts = useCallback(async () => {
    if (!tenant?.tenant_id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('company_name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching corporate accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch corporate accounts');
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id]);

  const createAccount = useCallback(async (accountData: CreateCorporateAccountData) => {
    if (!tenant?.tenant_id) throw new Error('No tenant selected');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .insert({
          ...accountData,
          tenant_id: tenant.tenant_id,
          status: 'active',
          current_balance: 0
        })
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Corporate account created successfully",
      });

      return data;
    } catch (err) {
      console.error('Error creating corporate account:', err);
      const message = err instanceof Error ? err.message : 'Failed to create corporate account';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id, toast]);

  const updateAccount = useCallback(async (id: string, updates: Partial<CreateCorporateAccountData>) => {
    if (!tenant?.tenant_id) throw new Error('No tenant selected');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenant.tenant_id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, ...data } : account
      ));

      toast({
        title: "Success",
        description: "Corporate account updated successfully",
      });

      return data;
    } catch (err) {
      console.error('Error updating corporate account:', err);
      const message = err instanceof Error ? err.message : 'Failed to update corporate account';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id, toast]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!tenant?.tenant_id) throw new Error('No tenant selected');

    setLoading(true);
    try {
      const { error } = await supabase
        .from('corporate_accounts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      setAccounts(prev => prev.filter(account => account.id !== id));
      toast({
        title: "Success",
        description: "Corporate account deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting corporate account:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete corporate account';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id, toast]);

  const updateBalance = useCallback(async (id: string, amount: number) => {
    if (!tenant?.tenant_id) throw new Error('No tenant selected');

    try {
      const { data, error } = await supabase
        .from('corporate_accounts')
        .update({ 
          current_balance: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenant.tenant_id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, current_balance: amount } : account
      ));

      return data;
    } catch (err) {
      console.error('Error updating account balance:', err);
      throw err;
    }
  }, [tenant?.tenant_id]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    updateBalance
  };
}