import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

// Updated interfaces to match Supabase schema
export interface HousekeepingTask {
  id: string;
  tenant_id: string;
  room_id?: string;
  title: string;
  description?: string;
  task_type: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_at?: string;
  created_by?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  started_at?: string;
  completed_at?: string;
  checklist?: any;
  qr_order_id?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy properties for compatibility
  roomNumber?: string;
  type?: 'cleaning' | 'amenity' | 'maintenance' | 'inspection';
  assignedTo?: string;
  assignedStaff?: string;
  dueDate?: Date;
  estimatedDuration?: number;
  notes?: string;
  checkoutId?: string;
  source?: 'guest-qr' | 'front-desk' | 'auto' | 'manager';
  items?: string[];
  photos?: string[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
}

export interface Supply {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit: string;
  unit_cost?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy compatibility
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  cost?: number;
  supplier?: string;
  lastRestocked?: Date;
  location?: string;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'ordered';
}

export interface SupplyUsage {
  id: string;
  tenant_id: string;
  supply_id: string;
  room_id?: string;
  task_id?: string;
  quantity_used: number;
  used_by?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  staffMember: string;
  staffId: string;
  action: string;
  targetType: string;
  targetId: string;
  roomNumber?: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export function useHousekeepingApi() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load housekeeping tasks from Supabase
  const loadTasks = useCallback(async () => {
    if (!user?.tenant_id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          room:rooms(room_number),
          assigned_user:users!housekeeping_tasks_assigned_to_fkey(name, email)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedTasks: HousekeepingTask[] = (data || []).map(task => ({
        id: task.id,
        tenant_id: task.tenant_id,
        room_id: task.room_id,
        title: task.title,
        description: task.description,
        task_type: task.task_type,
        status: task.status as HousekeepingTask['status'],
        priority: task.priority as HousekeepingTask['priority'],
        assigned_to: task.assigned_to,
        assigned_at: task.assigned_at,
        created_by: task.created_by,
        estimated_minutes: task.estimated_minutes,
        actual_minutes: task.actual_minutes,
        started_at: task.started_at,
        completed_at: task.completed_at,
        checklist: task.checklist,
        qr_order_id: task.qr_order_id,
        created_at: task.created_at,
        updated_at: task.updated_at,
        // Legacy compatibility
        roomNumber: task.room?.room_number,
        type: task.task_type as any,
        assignedTo: task.assigned_user?.name,
        assignedStaff: task.assigned_user?.name,
        dueDate: task.assigned_at ? new Date(task.assigned_at) : undefined,
        estimatedDuration: task.estimated_minutes,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error loading housekeeping tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load housekeeping tasks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenant_id, toast]);

  // Load supplies from Supabase
  const loadSupplies = useCallback(async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const formattedSupplies: Supply[] = (data || []).map(supply => ({
        id: supply.id,
        tenant_id: supply.tenant_id,
        name: supply.name,
        category: supply.category,
        current_stock: supply.current_stock,
        minimum_stock: supply.minimum_stock,
        maximum_stock: supply.maximum_stock,
        unit: supply.unit,
        unit_cost: supply.unit_cost,
        is_active: supply.is_active,
        created_at: supply.created_at,
        updated_at: supply.updated_at,
        // Legacy compatibility
        currentStock: supply.current_stock,
        minimumStock: supply.minimum_stock,
        maximumStock: supply.maximum_stock,
        cost: supply.unit_cost,
        status: supply.current_stock <= supply.minimum_stock ? 'low-stock' : 'in-stock'
      }));

      setSupplies(formattedSupplies);
    } catch (error) {
      console.error('Error loading supplies:', error);
      toast({
        title: "Error",
        description: "Failed to load supplies",
        variant: "destructive"
      });
    }
  }, [user?.tenant_id, toast]);

  // Load audit logs from Supabase
  const loadAuditLogs = useCallback(async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .eq('resource_type', 'housekeeping_task')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedLogs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.created_at || ''),
        staffMember: log.actor_email || 'Unknown',
        staffId: log.actor_id || '',
        action: log.action,
        targetType: log.resource_type,
        targetId: log.resource_id || '',
        description: log.description || '',
        metadata: log.metadata as Record<string, any>,
        ipAddress: (log.ip_address as string) || '',
        userAgent: log.user_agent || ''
      }));

      setAuditLogs(formattedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  }, [user?.tenant_id]);

  // Accept/assign task
  const acceptTask = async (taskId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({
          status: 'assigned',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'task_assigned',
          resource_type: 'housekeeping_task',
          resource_id: taskId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Task assigned to ${user.email}`,
          new_values: { status: 'assigned', assigned_to: user.id }
        }]);

      await loadTasks();

      toast({
        title: "Task Accepted",
        description: "You have been assigned to this task",
      });
    } catch (error) {
      console.error('Error accepting task:', error);
      toast({
        title: "Error",
        description: "Failed to accept task",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Complete task
  const completeTask = async (taskId: string, notes?: string, actualMinutes?: number) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          actual_minutes: actualMinutes
        })
        .eq('id', taskId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'task_completed',
          resource_type: 'housekeeping_task',
          resource_id: taskId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Task completed${notes ? ` with notes: ${notes}` : ''}`,
          new_values: { status: 'completed', notes, actual_minutes: actualMinutes }
        }]);

      await loadTasks();

      toast({
        title: "Task Completed",
        description: "Task has been marked as completed",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create new task
  const createTask = async (taskData: {
    room_id?: string;
    title: string;
    description?: string;
    task_type: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimated_minutes?: number;
  }) => {
    if (!user?.tenant_id || !user?.id) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .insert([{
          tenant_id: user.tenant_id,
          ...taskData,
          status: 'pending',
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'task_created',
          resource_type: 'housekeeping_task',
          resource_id: data.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Housekeeping task created: ${taskData.title}`,
          new_values: taskData
        }]);

      await loadTasks();

      toast({
        title: "Task Created",
        description: "New housekeeping task has been created",
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Record supply usage
  const recordSupplyUsage = async (
    supplyId: string, 
    roomId: string, 
    quantity: number, 
    taskId?: string
  ) => {
    if (!user?.tenant_id || !user?.id) return;

    try {
      setIsLoading(true);

      // Record usage
      const { error: usageError } = await supabase
        .from('supply_usage')
        .insert([{
          tenant_id: user.tenant_id,
          supply_id: supplyId,
          room_id: roomId,
          task_id: taskId,
          quantity_used: quantity,
          used_by: user.id
        }]);

      if (usageError) throw usageError;

      // Update supply stock
      // Update supply stock directly for now
      const { data: currentSupply } = await supabase
        .from('supplies')
        .select('current_stock')
        .eq('id', supplyId)
        .single();
      
      if (currentSupply) {
        const { error: stockUpdateError } = await supabase
          .from('supplies')
          .update({ 
            current_stock: Math.max(0, currentSupply.current_stock - quantity),
            updated_at: new Date().toISOString()
          })
          .eq('id', supplyId);
        
        if (stockUpdateError) throw stockUpdateError;
      }

      await loadSupplies();

      toast({
        title: "Supply Usage Recorded",
        description: `Used ${quantity} units of supply`,
      });
    } catch (error) {
      console.error('Error recording supply usage:', error);
      toast({
        title: "Error",
        description: "Failed to record supply usage",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback((callback: (update: any) => void) => {
    if (!user?.tenant_id) return () => {};

    const channel = supabase
      .channel('housekeeping_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'housekeeping_tasks',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        (payload) => {
          callback({
            type: payload.eventType === 'INSERT' ? 'new_task' : 'task_updated',
            data: payload.new
          });
          loadTasks(); // Refresh tasks
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id, loadTasks]);

  // Load data on mount and user change
  useEffect(() => {
    if (user?.tenant_id) {
      loadTasks();
      loadSupplies();
      loadAuditLogs();
    }
  }, [user?.tenant_id, loadTasks, loadSupplies, loadAuditLogs]);

  return {
    tasks,
    supplies,
    auditLogs,
    isLoading,
    acceptTask,
    completeTask,
    createTask,
    recordSupplyUsage,
    subscribeToUpdates,
    refreshTasks: loadTasks,
    refreshSupplies: loadSupplies
  };
}

// Legacy exports for backward compatibility  
export const useHousekeepingTasks = () => {
  const api = useHousekeepingApi();
  return {
    tasks: api.tasks,
    loading: api.isLoading,
    error: null,
    acceptTask: api.acceptTask,
    completeTask: api.completeTask,
    createTask: api.createTask,
    refreshTasks: api.refreshTasks
  };
};

export const useAmenityRequests = () => {
  // Mock amenity requests for now
  return {
    requests: [],
    loading: false,
    acceptRequest: async () => {},
    completeRequest: async () => {},
    refreshRequests: async () => {}
  };
};

export const useHousekeepingSupplies = () => {
  const api = useHousekeepingApi();
  return {
    supplies: api.supplies,
    loading: api.isLoading,
    recordUsage: api.recordSupplyUsage,
    refreshSupplies: api.refreshSupplies
  };
};
