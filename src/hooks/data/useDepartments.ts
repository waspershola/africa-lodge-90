import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  revenue_account?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch all departments for current tenant
 */
export function useDepartments() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['departments', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Department[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to fetch active departments for dropdown selection
 */
export function useActiveDepartments() {
  const { data: departments, isLoading } = useDepartments();
  
  return {
    departments: departments || [],
    isLoading,
    options: (departments || []).map(dept => ({
      value: dept.id,
      label: dept.name,
      code: dept.code
    }))
  };
}

/**
 * Hook to get default department (FRONTDESK)
 */
export function useDefaultDepartment() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['default-department', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase.rpc('get_default_department', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

/**
 * Hook to create new department
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async (department: Omit<Department, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('departments')
        .insert({ ...department, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', tenantId] });
      toast.success('Department created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create department: ${error.message}`);
    },
  });
}

/**
 * Hook to update department
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Department> }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', tenantId] });
      toast.success('Department updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update department: ${error.message}`);
    },
  });
}
