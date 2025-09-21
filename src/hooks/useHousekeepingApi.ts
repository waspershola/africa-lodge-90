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
        .eq('tenant_id' as any, user.tenant_id as any)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedTasks: HousekeepingTask[] = (data || []).map((task: any) => ({
        id: (task as any).id,
        tenant_id: (task as any).tenant_id,
        room_id: (task as any).room_id,
        title: (task as any).title,
        description: (task as any).description,
        task_type: (task as any).task_type,
        status: (task as any).status as HousekeepingTask['status'],
        priority: (task as any).priority as HousekeepingTask['priority'],
        assigned_to: (task as any).assigned_to,
        assigned_at: (task as any).assigned_at,
        created_by: (task as any).created_by,
        estimated_minutes: (task as any).estimated_minutes,
        actual_minutes: (task as any).actual_minutes,
        started_at: (task as any).started_at,
        completed_at: (task as any).completed_at,
        checklist: (task as any).checklist,
        qr_order_id: (task as any).qr_order_id,
        created_at: (task as any).created_at,
        updated_at: (task as any).updated_at,
        // Legacy compatibility
        roomNumber: (task as any).room?.room_number,
        type: (task as any).task_type as any,
        assignedTo: (task as any).assigned_user?.name,
        assignedStaff: (task as any).assigned_user?.name,
        dueDate: (task as any).assigned_at ? new Date((task as any).assigned_at) : undefined,
        estimatedDuration: (task as any).estimated_minutes,
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
        .eq('tenant_id' as any, user.tenant_id as any)
        .eq('is_active' as any, true as any)
        .order('name');

      if (error) throw error;

      const formattedSupplies: Supply[] = (data || []).map((supply: any) => ({
        id: (supply as any).id,
        tenant_id: (supply as any).tenant_id,
        name: (supply as any).name,
        category: (supply as any).category,
        current_stock: (supply as any).current_stock,
        minimum_stock: (supply as any).minimum_stock,
        maximum_stock: (supply as any).maximum_stock,
        unit: (supply as any).unit,
        unit_cost: (supply as any).unit_cost,
        is_active: (supply as any).is_active,
        created_at: (supply as any).created_at,
        updated_at: (supply as any).updated_at,
        // Legacy compatibility
        currentStock: (supply as any).current_stock,
        minimumStock: (supply as any).minimum_stock,
        maximumStock: (supply as any).maximum_stock,
        cost: (supply as any).unit_cost,
        status: (supply as any).current_stock <= (supply as any).minimum_stock ? 'low-stock' : 'in-stock'
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
        .eq('tenant_id' as any, user.tenant_id as any)
        .eq('resource_type' as any, 'housekeeping_task' as any)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedLogs: AuditLog[] = (data || []).map((log: any) => ({
        id: (log as any).id,
        timestamp: new Date((log as any).created_at || ''),
        staffMember: (log as any).actor_email || 'Unknown',
        staffId: (log as any).actor_id || '',
        action: (log as any).action,
        targetType: (log as any).resource_type,
        targetId: (log as any).resource_id || '',
        description: (log as any).description || '',
        metadata: ((log as any).metadata as Record<string, any>),
        ipAddress: ((log as any).ip_address as string) || '',
        userAgent: (log as any).user_agent || ''
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
        } as any)
        .eq('id' as any, taskId as any);

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
        } as any]);

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
        } as any)
        .eq('id' as any, taskId as any);

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
        } as any]);

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
        } as any])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'task_created',
          resource_type: 'housekeeping_task',
          resource_id: (data as any).id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Housekeeping task created: ${taskData.title}`,
          new_values: taskData
        } as any]);

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
        } as any]);

      if (usageError) throw usageError;

      // Update supply stock
      // Update supply stock directly for now
      const { data: currentSupply } = await supabase
        .from('supplies')
        .select('current_stock')
        .eq('id' as any, supplyId as any)

      if (currentSupply) {
        const { error: stockUpdateError } = await supabase
          .from('supplies')
          .update({ 
            current_stock: Math.max(0, (currentSupply as any).current_stock - quantity),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id' as any, supplyId as any);
        
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
