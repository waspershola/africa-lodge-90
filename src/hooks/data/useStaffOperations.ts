// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  is_active: boolean;
  employee_id: string | null;
  current_task_count?: number;
}

export interface Task {
  id: string;
  tenant_id: string;
  task_type: string;
  title: string;
  description: string | null;
  room_id: string | null;
  assigned_to: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  room?: {
    room_number: string;
  };
}

export function useStaffOperations() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active staff members
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff-active', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, department, is_active, employee_id')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .in('role', ['HOUSEKEEPING', 'MAINTENANCE', 'FRONT_DESK', 'MANAGER'])
        .order('name');

      if (error) throw error;

      // Get task counts for each staff member
      const staffWithCounts = await Promise.all(
        (data || []).map(async (member) => {
          const { count } = await supabase
            .from('housekeeping_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', member.id)
            .in('status', ['pending', 'in_progress']);

          return {
            ...member,
            current_task_count: count || 0,
          };
        })
      );

      return staffWithCounts as StaffMember[];
    },
    enabled: !!tenant?.tenant_id,
  });

  // Fetch tasks (from housekeeping_tasks table)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['staff-tasks', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          room:rooms (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!tenant?.tenant_id,
  });

  // Fetch pending tasks
  const usePendingTasks = () => {
    return useQuery({
      queryKey: ['staff-tasks', 'pending', tenant?.tenant_id],
      queryFn: async () => {
        if (!tenant?.tenant_id) throw new Error('No tenant');

        const { data, error } = await supabase
          .from('housekeeping_tasks')
          .select(`
            *,
            room:rooms (
              room_number
            )
          `)
          .eq('tenant_id', tenant.tenant_id)
          .in('status', ['pending', 'in_progress'])
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []) as Task[];
      },
      enabled: !!tenant?.tenant_id,
    });
  };

  // Assign task to staff
  const assignTask = useMutation({
    mutationFn: async ({ taskId, staffId }: { taskId: string; staffId: string }) => {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update({
          assigned_to: staffId,
          assigned_at: new Date().toISOString(),
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff-active'] });
      toast({
        title: 'Task Assigned',
        description: 'Task has been assigned to staff member.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign task',
        variant: 'destructive',
      });
    },
  });

  // Update task status
  const updateTaskStatus = useMutation({
    mutationFn: async ({ 
      taskId, 
      status 
    }: { 
      taskId: string; 
      status: Task['status'];
    }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'in_progress' && !tasks.find(t => t.id === taskId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['staff-active'] });
      toast({
        title: 'Status Updated',
        description: 'Task status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task status',
        variant: 'destructive',
      });
    },
  });

  return {
    staff,
    tasks,
    isLoading: staffLoading || tasksLoading,
    usePendingTasks,
    assignTask,
    updateTaskStatus,
  };
}
