import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

// Updated types to match Supabase schema
export interface HousekeepingTask {
  id: string;
  tenant_id: string;
  room_id?: string;
  title: string;
  description?: string;
  task_type: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_at?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  checklist?: ChecklistItem[];
  qr_order_id?: string;
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
  category: 'bedding' | 'bathroom' | 'cleaning' | 'amenities' | 'maintenance' | 'food';
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  unit: string;
  unit_cost?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
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
}

export function useHousekeepingTasks() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadTasks();
    }
  }, [user?.tenant_id]);

  const loadTasks = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select(`
          *,
          rooms:room_id (room_number),
          assigned_user:assigned_to (name)
        `)
        .eq('tenant_id' as any, user.tenant_id as any)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks((data || []).map((task: any) => ({
        id: (task as any).id,
        tenant_id: (task as any).tenant_id,
        room_id: (task as any).room_id,
        title: (task as any).title,
        description: (task as any).description,
        task_type: (task as any).task_type,
        status: (task as any).status as 'pending' | 'in-progress' | 'completed' | 'delayed',
        priority: (task as any).priority as 'low' | 'medium' | 'high' | 'urgent',
        assigned_to: (task as any).assigned_to,
        assigned_at: (task as any).assigned_at,
        estimated_minutes: (task as any).estimated_minutes,
        actual_minutes: (task as any).actual_minutes,
        started_at: (task as any).started_at,
        completed_at: (task as any).completed_at,
        created_by: (task as any).created_by,
        created_at: (task as any).created_at,
        updated_at: (task as any).updated_at,
        checklist: Array.isArray((task as any).checklist) ? ((task as any).checklist as unknown as ChecklistItem[]) : [],
        qr_order_id: (task as any).qr_order_id
      })));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load housekeeping tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({
          status: 'in-progress',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          started_at: new Date().toISOString()
        } as any)
        .eq('id' as any, taskId as any);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'task_accepted',
          resource_type: 'housekeeping_task',
          resource_id: taskId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Housekeeping task accepted by ${user.name || user.email}`
        } as any]);

      await loadTasks();
      
      toast({
        title: "Task Accepted",
        description: "You have been assigned to this task.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to accept task",
        variant: "destructive"
      });
    }
  };

  const completeTask = async (taskId: string, notes?: string, actualMinutes?: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('housekeeping_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
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
          description: `Housekeeping task completed by ${user.name || user.email}`,
          new_values: { notes, actual_minutes: actualMinutes }
        } as any]);

      await loadTasks();
      
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  return {
    tasks,
    loading,
    error,
    acceptTask,
    completeTask,
    refresh: loadTasks
  };
}

export function useHousekeepingSupplies() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadSupplies();
    }
  }, [user?.tenant_id]);

  const loadSupplies = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('tenant_id' as any, user.tenant_id as any)
        .eq('is_active' as any, true as any)
        .order('name');

      if (error) throw error;

      setSupplies((data || []).map((supply: any) => ({
        id: (supply as any).id,
        tenant_id: (supply as any).tenant_id,
        name: (supply as any).name,
        category: (supply as any).category as 'bedding' | 'bathroom' | 'cleaning' | 'amenities' | 'maintenance' | 'food',
        current_stock: (supply as any).current_stock,
        minimum_stock: (supply as any).minimum_stock,
        maximum_stock: (supply as any).maximum_stock,
        unit: (supply as any).unit,
        unit_cost: (supply as any).unit_cost,
        is_active: (supply as any).is_active,
        created_at: (supply as any).created_at,
        updated_at: (supply as any).updated_at
      })));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load supplies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordUsage = async (supplyId: string, roomId: string, quantityUsed: number, notes?: string) => {
    if (!user) return;

    try {
      // Record usage
      const { error: usageError } = await supabase
        .from('supply_usage')
        .insert([{
          supply_id: supplyId,
          room_id: roomId,
          quantity_used: quantityUsed,
          used_by: user.id,
          tenant_id: user.tenant_id
        } as any]);

      if (usageError) throw usageError;

      // Update supply stock
      const supply = supplies.find(s => s.id === supplyId);
      if (supply) {
        const newStock = Math.max(0, supply.current_stock - quantityUsed);
        
        const { error: updateError } = await supabase
          .from('supplies')
          .update({ current_stock: newStock } as any)
          .eq('id' as any, supplyId as any);

        if (updateError) throw updateError;
      }

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'supply_used',
          resource_type: 'supply',
          resource_id: supplyId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Used ${quantityUsed} units of supply`,
          new_values: { quantity_used: quantityUsed, room_id: roomId, notes }
        } as any]);

      await loadSupplies();
      
      toast({
        title: "Usage Recorded",
        description: `${quantityUsed} units have been recorded as used.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to record usage",
        variant: "destructive"
      });
    }
  };

  return {
    supplies,
    loading,
    error,
    recordUsage,
    refresh: loadSupplies
  };
}

export function useAuditLogs(filters?: { staff?: string; room?: string; action?: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadLogs();
    }
  }, [user?.tenant_id, filters]);

  const loadLogs = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id' as any, user.tenant_id as any)
        .in('resource_type' as any, ['housekeeping_task', 'supply'] as any)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters?.staff) {
        query = query.eq('actor_id' as any, filters.staff as any);
      }
      if (filters?.action) {
        query = query.eq('action' as any, filters.action as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      const auditLogs: AuditLog[] = (data || []).map((log: any) => ({
        id: (log as any).id,
        timestamp: (log as any).created_at || '',
        staffMember: (log as any).actor_email || 'Unknown',
        staffId: (log as any).actor_id || '',
        action: (log as any).action,
        targetType: (log as any).resource_type,
        targetId: (log as any).resource_id || '',
        description: (log as any).description || '',
        oldValue: JSON.stringify((log as any).old_values),
        newValue: JSON.stringify((log as any).new_values),
        metadata: ((log as any).metadata as Record<string, any>) || {}
      }));

      setLogs(auditLogs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    error,
    refresh: loadLogs
  };
}