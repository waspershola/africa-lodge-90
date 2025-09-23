import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TenantInfo {
  tenant_id: string;
  hotel_name: string;
  hotel_slug: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  currency?: string | null;
  timezone?: string | null;
}

export function useTenantInfo() {
  return useQuery<TenantInfo | null>({
    queryKey: ['tenant-info'],
    queryFn: async (): Promise<TenantInfo | null> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        // Extract tenant_id from JWT claims
        const claims = JSON.parse(atob(session.access_token.split('.')[1]));
        const tenantId = claims.user_metadata?.tenant_id;
        
        if (!tenantId) return null;

        const { data, error } = await supabase
          .from('tenants')
          .select('tenant_id, hotel_name, hotel_slug, address, city, country, phone, email, logo_url, currency, timezone')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching tenant info:', error);
          return null;
        }

        return data;
      } catch (err) {
        console.error('Error in useTenantInfo:', err);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}