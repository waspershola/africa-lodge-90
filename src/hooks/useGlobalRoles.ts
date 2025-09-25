import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGlobalRoles() {
  return useQuery({
    queryKey: ['global-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description')
        .eq('scope', 'global')
        .is('tenant_id', null)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}