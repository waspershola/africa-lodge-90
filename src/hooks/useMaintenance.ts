import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface WorkOrder {
  id: string;
  tenant_id: string;
  work_order_number: string;
  room_id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'escalated';
  assigned_to?: string;
  assigned_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  completion_notes?: string;
  qr_order_id?: string;
}

interface MaintenanceStats {
  openIssues: number;
  completedToday: number;
  pendingCritical: number;
  averageResolutionTime: number;
}

export function useMaintenanceApi() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    openIssues: 0,
    completedToday: 0,
    pendingCritical: 0,
    averageResolutionTime: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadWorkOrders();
      loadStats();
    }
  }, [user?.tenant_id]);

  const loadWorkOrders = async () => {
    if (!user?.tenant_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          rooms:room_id (room_number),
          assigned_user:assigned_to (name)
        `)
        .eq('tenant_id' as any, user.tenant_id as any)

      if (error) throw error;

      setWorkOrders((data || []).map((order: any) => ({
        id: (order as any).id,
        tenant_id: (order as any).tenant_id,
        work_order_number: (order as any).work_order_number,
        room_id: (order as any).room_id,
        title: (order as any).title,
        description: (order as any).description,
        category: (order as any).category,
        priority: (order as any).priority as 'low' | 'medium' | 'high' | 'critical',
        status: (order as any).status as 'pending' | 'in-progress' | 'completed' | 'escalated',
        assigned_to: (order as any).assigned_to,
        assigned_at: (order as any).assigned_at,
        estimated_hours: (order as any).estimated_hours,
        actual_hours: (order as any).actual_hours,
        estimated_cost: (order as any).estimated_cost,
        actual_cost: (order as any).actual_cost,
        created_by: (order as any).created_by,
        created_at: (order as any).created_at,
        updated_at: (order as any).updated_at,
        completed_at: (order as any).completed_at,
        completion_notes: (order as any).completion_notes,
        qr_order_id: (order as any).qr_order_id
      })));
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load work orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.tenant_id) return;

    try {
      // Get open issues count
      const { count: openCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .in('status', ['pending', 'in-progress']);

      // Get completed today count
      const today = new Date().toISOString().split('T')[0];
      const { count: completedCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'completed')
        .gte('completed_at', today);

      // Get critical pending count
      const { count: criticalCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('priority', 'critical')
        .in('status', ['pending', 'in-progress']);

      setStats({
        openIssues: openCount || 0,
        completedToday: completedCount || 0,
        pendingCritical: criticalCount || 0,
        averageResolutionTime: 85 // Would be calculated from actual data
      });
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const acceptWorkOrder = async (workOrderId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'in-progress',
          assigned_to: user.id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'work_order_accepted',
          resource_type: 'work_order',
          resource_id: workOrderId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Work order accepted by ${user.name || user.email}`
        }]);

      await loadWorkOrders();
      await loadStats();
      
      toast({
        title: "Work Order Accepted",
        description: "You have been assigned to this work order.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept work order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeWorkOrder = async (
    workOrderId: string, 
    completionData: {
      notes?: string;
      actualHours?: number;
      actualCost?: number;
    }
  ) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: completionData.notes,
          actual_hours: completionData.actualHours,
          actual_cost: completionData.actualCost
        })
        .eq('id', workOrderId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'work_order_completed',
          resource_type: 'work_order',
          resource_id: workOrderId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Work order completed by ${user.name || user.email}`,
          new_values: completionData
        }]);

      await loadWorkOrders();
      await loadStats();
      
      toast({
        title: "Work Order Completed",
        description: "Work order has been marked as completed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete work order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkOrder = async (workOrderData: Partial<WorkOrder>) => {
    if (!user?.tenant_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .insert([{
          tenant_id: user.tenant_id,
          work_order_number: `WO-${Date.now()}`,
          title: workOrderData.title || '',
          description: workOrderData.description || '',
          category: workOrderData.category || 'general',
          priority: workOrderData.priority || 'medium',
          status: 'pending',
          room_id: workOrderData.room_id,
          estimated_hours: workOrderData.estimated_hours,
          estimated_cost: workOrderData.estimated_cost,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'work_order_created',
          resource_type: 'work_order',
          resource_id: data.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Work order created: ${data.title}`,
          new_values: workOrderData
        }]);

      await loadWorkOrders();
      await loadStats();
      
      toast({
        title: "Work Order Created",
        description: `Work order ${data.work_order_number} has been created successfully.`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create work order",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    workOrders,
    stats,
    isLoading,
    acceptWorkOrder,
    completeWorkOrder,
    createWorkOrder,
    refresh: loadWorkOrders
  };
}