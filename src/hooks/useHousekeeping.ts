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
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks((data || []).map(task => ({
        ...task,
        status: task.status as 'pending' | 'in-progress' | 'completed' | 'delayed',
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent'
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
        })
        .eq('id', taskId);

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
        }]);

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
          description: `Housekeeping task completed by ${user.name || user.email}`,
          new_values: { notes, actual_minutes: actualMinutes }
        }]);

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
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setSupplies((data || []).map(supply => ({
        ...supply,
        category: supply.category as 'bedding' | 'bathroom' | 'cleaning' | 'amenities' | 'maintenance' | 'food'
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
        }]);

      if (usageError) throw usageError;

      // Update supply stock
      const supply = supplies.find(s => s.id === supplyId);
      if (supply) {
        const newStock = Math.max(0, supply.current_stock - quantityUsed);
        
        const { error: updateError } = await supabase
          .from('supplies')
          .update({ current_stock: newStock })
          .eq('id', supplyId);

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
        }]);

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
        .eq('tenant_id', user.tenant_id)
        .in('resource_type', ['housekeeping_task', 'supply'])
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters?.staff) {
        query = query.eq('actor_id', filters.staff);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query;

      if (error) throw error;

      const auditLogs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        timestamp: log.created_at || '',
        staffMember: log.actor_email || 'Unknown',
        staffId: log.actor_id || '',
        action: log.action,
        targetType: log.resource_type,
        targetId: log.resource_id || '',
        description: log.description || '',
        oldValue: JSON.stringify(log.old_values),
        newValue: JSON.stringify(log.new_values),
        metadata: log.metadata as Record<string, any> || {}
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