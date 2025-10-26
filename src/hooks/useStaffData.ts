import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  department?: string;
}

export interface TaskSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  urgent_tasks: number;
}

export const useStaffData = () => {
  const { user, tenant } = useAuth();

  const { data: staffMembers, isLoading: staffLoading } = useQuery({
    queryKey: ['staff-data', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, is_active, department')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: !!tenant?.tenant_id,
  });

  const { data: taskSummary, isLoading: tasksLoading } = useQuery({
    queryKey: ['task-summary', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('status, priority')
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      const summary: TaskSummary = {
        total_tasks: data.length,
        completed_tasks: data.filter(t => t.status === 'completed').length,
        pending_tasks: data.filter(t => t.status === 'pending').length,
        urgent_tasks: data.filter(t => t.priority === 'urgent').length,
      };

      return summary;
    },
    enabled: !!tenant?.tenant_id,
  });

  return {
    staffMembers: staffMembers || [],
    taskSummary,
    isLoading: staffLoading || tasksLoading,
  };
};