// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Terminal {
  id: string;
  tenant_id: string;
  department_id?: string;
  terminal_code: string;
  terminal_name: string;
  location?: string;
  terminal_type: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch all terminals for current tenant
 */
export function useTerminals(departmentId?: string) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['terminals', tenantId, departmentId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      let query = supabase
        .from('terminals')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query.order('terminal_name');

      if (error) throw error;
      return data as Terminal[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to fetch active terminals for dropdown selection
 */
export function useActiveTerminals(departmentId?: string) {
  const { data: terminals, isLoading } = useTerminals(departmentId);
  
  return {
    terminals: terminals || [],
    isLoading,
    options: (terminals || []).map(terminal => ({
      value: terminal.id,
      label: terminal.terminal_name,
      code: terminal.terminal_code,
      location: terminal.location
    }))
  };
}

/**
 * Hook to get default terminal for a department
 */
export function useDefaultTerminal(departmentId?: string) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['default-terminal', tenantId, departmentId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase.rpc('get_default_terminal', {
        p_tenant_id: tenantId,
        p_department_id: departmentId || null
      });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to create new terminal
 */
export function useCreateTerminal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async (terminal: Omit<Terminal, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('terminals')
        .insert({ ...terminal, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals', tenantId] });
      toast.success('Terminal created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create terminal: ${error.message}`);
    },
  });
}

/**
 * Hook to update terminal
 */
export function useUpdateTerminal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Terminal> }) => {
      const { data, error } = await supabase
        .from('terminals')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals', tenantId] });
      toast.success('Terminal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update terminal: ${error.message}`);
    },
  });
}
