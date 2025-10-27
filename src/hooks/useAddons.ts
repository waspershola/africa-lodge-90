import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Addon, TenantAddon, SMSCredits } from '@/types/billing';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

export const useAddons = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [tenantAddons, setTenantAddons] = useState<TenantAddon[]>([]);
  const [smsCredits, setSmsCredits] = useState<SMSCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { tenant } = useAuth();
  const { toast } = useToast();

  const loadAddons = async () => {
    try {
      const { data, error: addonsError } = await supabase
        .from('addons')
        .select('*')
        .eq('is_active', true)
        .order('addon_type', { ascending: true })
        .order('price', { ascending: true });

      if (addonsError) throw addonsError;
      setAddons((data || []) as Addon[]);
    } catch (err: any) {
      console.error('Error loading addons:', err);
      setError(err.message);
    }
  };

  const loadTenantAddons = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error: tenantAddonsError } = await supabase
        .from('tenant_addons')
        .select(`
          *,
          addon:addons(*)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true);

      if (tenantAddonsError) throw tenantAddonsError;
      setTenantAddons((data || []) as TenantAddon[]);
    } catch (err: any) {
      console.error('Error loading tenant addons:', err);
      setError(err.message);
    }
  };

  const loadSMSCredits = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error: creditsError } = await supabase
        .from('sms_credits')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .single();

      if (creditsError && creditsError.code !== 'PGRST116') {
        throw creditsError;
      }
      
      setSmsCredits(data || null);
    } catch (err: any) {
      console.error('Error loading SMS credits:', err);
      setError(err.message);
    }
  };

  const purchaseAddon = async (addonId: string, quantity: number = 1, autoRenew: boolean = false) => {
    if (!tenant?.tenant_id) {
      toast({
        title: "Error",
        description: "No tenant selected",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Phase 6.1: Validate token before addon purchase (financial operation)
      await validateAndRefreshToken();

      const { data, error } = await supabase.functions.invoke('purchase-addon', {
        body: {
          tenant_id: tenant.tenant_id,
          addon_id: addonId,
          quantity,
          auto_renew: autoRenew
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });

        // Refresh data
        await Promise.all([loadTenantAddons(), loadSMSCredits()]);
        return true;
      } else {
        throw new Error(data.error || 'Purchase failed');
      }
    } catch (err: any) {
      console.error('Error purchasing addon:', err);
      toast({
        title: "Purchase Failed",
        description: err.message || 'Failed to purchase addon',
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelAddon = async (tenantAddonId: string) => {
    if (!tenant?.tenant_id) return false;

    try {
      const { error } = await supabase
        .from('tenant_addons')
        .update({ is_active: false })
        .eq('id', tenantAddonId)
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Addon cancelled successfully",
      });

      await loadTenantAddons();
      return true;
    } catch (err: any) {
      console.error('Error cancelling addon:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to cancel addon',
        variant: "destructive",
      });
      return false;
    }
  };

  const topUpSMSCredits = async (credits: number) => {
    if (!tenant?.tenant_id) return false;

    try {
      setLoading(true);

      // Phase 6.1: Validate token before SMS credits purchase (financial operation)
      await validateAndRefreshToken();

      const { data, error } = await supabase.functions.invoke('provision-sms-credits', {
        body: {
          tenant_id: tenant.tenant_id,
          credits,
          source_type: 'manual_topup',
          purpose: 'Manual SMS credits top-up'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Added ${credits} SMS credits`,
        });

        await loadSMSCredits();
        return true;
      } else {
        throw new Error(data.error || 'Top-up failed');
      }
    } catch (err: any) {
      console.error('Error topping up SMS credits:', err);
      toast({
        title: "Top-up Failed",
        description: err.message || 'Failed to add SMS credits',
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadAddons(),
          loadTenantAddons(),
          loadSMSCredits()
        ]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenant?.tenant_id]);

  const refresh = () => {
    return Promise.all([loadAddons(), loadTenantAddons(), loadSMSCredits()]);
  };

  return {
    addons,
    tenantAddons,
    smsCredits,
    loading,
    error,
    purchaseAddon,
    cancelAddon,
    topUpSMSCredits,
    refresh
  };
};