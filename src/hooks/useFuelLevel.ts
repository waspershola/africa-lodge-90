import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export const useFuelLevel = () => {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['fuel-level', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return 0;

      // Get the latest fuel log entry
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('quantity_liters, log_date')
        .eq('tenant_id', tenant.tenant_id)
        .order('log_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return 65; // Default fuel level if no data
      }

      // Calculate fuel level percentage based on tank capacity (assume 1000L tank)
      const tankCapacity = 1000;
      const currentLevel = data[0].quantity_liters || 0;
      const percentage = Math.round((currentLevel / tankCapacity) * 100);
      
      return Math.min(100, Math.max(0, percentage));
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};