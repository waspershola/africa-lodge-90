import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface FeatureFlag {
  id: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  config: Record<string, any>;
  target_tenants: string[] | null;
  target_plans: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to check if a feature flag is enabled for the current tenant
 */
export function useFeatureFlag(flagName: string) {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['feature-flag', flagName, tenant?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_name', flagName)
        .single();

      if (error) {
        console.warn(`Feature flag ${flagName} not found, defaulting to disabled`);
        return false;
      }

      if (!data.is_enabled) return false;

      // Check if tenant is in target list (if specified)
      if (data.target_tenants && data.target_tenants.length > 0) {
        return tenant?.tenant_id ? data.target_tenants.includes(tenant.tenant_id) : false;
      }

      // Check if tenant plan is in target list (if specified)
      if (data.target_plans && data.target_plans.length > 0 && tenant?.plan_id) {
        return data.target_plans.includes(tenant.plan_id);
      }

      return true;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to get all feature flags (admin only)
 */
export function useAllFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name');

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
}

/**
 * Hook to create or update a feature flag (admin only)
 */
export function useUpsertFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flag: Partial<FeatureFlag> & { flag_name: string }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .upsert(flag)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flag'] });
    },
  });
}
