import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

// Updated interfaces to match Supabase schema
export interface WorkOrder {
  id: string;
  tenant_id: string;
  work_order_number: string;
  room_id?: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'escalated';
  assigned_to?: string;
  assigned_at?: string;
  created_by?: string;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  completion_notes?: string;
  qr_order_id?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy properties for compatibility
  workOrderNumber?: string;
  roomId?: string;
  issue?: string;
  assignedTo?: string;
  createdAt?: string;
  estimatedTime?: number;
}

export interface PreventiveTask {
  id: string;
  title: string;
  description: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastCompleted?: string;
  nextDue: string;
  assignedTo?: string;
  status: 'scheduled' | 'overdue' | 'completed';
  estimatedTime: number;
  location: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SupplyItem {
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
  minThreshold?: number;
  maxThreshold?: number;
  cost?: number;
  supplier?: string;
  lastRestocked?: string;
  location?: string;
}

interface MaintenanceStats {
  openIssues: number;
  completedToday: number;
  escalationsFromHousekeeping: number;
  pendingCritical: number;
  averageResolutionTime: number;
  suppliesLowStock: number;
  overduePreventive: number;
}

export function useMaintenanceApi() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    openIssues: 0,
    completedToday: 0,
    escalationsFromHousekeeping: 0,
    pendingCritical: 0,
    averageResolutionTime: 0,
    suppliesLowStock: 0,
    overduePreventive: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load work orders from Supabase
  const loadWorkOrders = useCallback(async () => {
    if (!user?.tenant_id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          room:rooms(room_number),
          assigned_user:users!work_orders_assigned_to_fkey(name, email)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedWorkOrders: WorkOrder[] = (data || []).map(wo => ({
        id: wo.id,
        tenant_id: wo.tenant_id,
        work_order_number: wo.work_order_number,
        room_id: wo.room_id,
        title: wo.title,
        description: wo.description,
        category: wo.category,
        priority: wo.priority as WorkOrder['priority'],
        status: wo.status,
        assigned_to: wo.assigned_to,
        assigned_at: wo.assigned_at,
        created_by: wo.created_by,
        estimated_hours: wo.estimated_hours,
        actual_hours: wo.actual_hours,
        estimated_cost: wo.estimated_cost,
        actual_cost: wo.actual_cost,
        completion_notes: wo.completion_notes,
        qr_order_id: wo.qr_order_id,
        created_at: wo.created_at,
        updated_at: wo.updated_at,
        // Legacy compatibility
        workOrderNumber: wo.work_order_number,
        roomId: wo.room?.room_number,
        issue: wo.title,
        assignedTo: wo.assigned_user?.name,
        createdAt: wo.created_at,
        estimatedTime: wo.estimated_hours ? wo.estimated_hours * 60 : undefined
      }));

      setWorkOrders(formattedWorkOrders);
      calculateStats(formattedWorkOrders);
    } catch (error) {
      console.error('Error loading work orders:', error);
      toast({
        title: "Error",
        description: "Failed to load work orders",
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
        .in('category', ['maintenance', 'electrical', 'plumbing', 'hvac', 'general', 'safety'])
        .order('name');

      if (error) throw error;

      const formattedSupplies: SupplyItem[] = (data || []).map(supply => ({
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
        minThreshold: supply.minimum_stock,
        maxThreshold: supply.maximum_stock,
        cost: supply.unit_cost,
        location: 'Maintenance Store'
      }));

      setSupplies(formattedSupplies);
    } catch (error) {
      console.error('Error loading supplies:', error);
      toast({
        title: "Error",
        description: "Failed to load maintenance supplies",
        variant: "destructive"
      });
    }
  }, [user?.tenant_id, toast]);

  // Calculate maintenance statistics
  const calculateStats = (orders: WorkOrder[]) => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(wo => 
      new Date(wo.created_at || '').toDateString() === today
    );

    const openIssues = orders.filter(wo => 
      ['pending', 'assigned', 'in_progress'].includes(wo.status)
    ).length;

    const completedToday = orders.filter(wo => 
      wo.status === 'completed' && 
      new Date(wo.updated_at || '').toDateString() === today
    ).length;

    const pendingCritical = orders.filter(wo => 
      wo.priority === 'critical' && wo.status !== 'completed'
    ).length;

    const escalationsFromHousekeeping = orders.filter(wo => 
      wo.qr_order_id && wo.status !== 'completed'
    ).length;

    // Calculate average resolution time for completed orders
    const completedOrders = orders.filter(wo => wo.status === 'completed' && wo.created_at && wo.updated_at);
    const avgResolutionTime = completedOrders.length > 0 
      ? completedOrders.reduce((sum, wo) => {
          const created = new Date(wo.created_at!).getTime();
          const completed = new Date(wo.updated_at!).getTime();
          return sum + (completed - created);
        }, 0) / completedOrders.length / (1000 * 60) // Convert to minutes
      : 0;

    const suppliesLowStock = supplies.filter(s => s.current_stock <= s.minimum_stock).length;

    setStats({
      openIssues,
      completedToday,
      escalationsFromHousekeeping,
      pendingCritical,
      averageResolutionTime: Math.round(avgResolutionTime),
      suppliesLowStock,
      overduePreventive: 0 // TODO: Implement preventive tasks
    });
  };

  // Accept work order
  const acceptWorkOrder = async (workOrderId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'assigned',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'work_order_assigned',
          resource_type: 'work_order',
          resource_id: workOrderId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Work order assigned to ${user.email}`,
          new_values: { status: 'assigned', assigned_to: user.id }
        }]);

      await loadWorkOrders();

      toast({
        title: "Work Order Accepted",
        description: "You have been assigned to this work order.",
      });
    } catch (error) {
      console.error('Error accepting work order:', error);
      toast({
        title: "Error",
        description: "Failed to accept work order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Complete work order
  const completeWorkOrder = async (
    workOrderId: string, 
    completionData: {
      notes?: string;
      actualHours?: number;
      actualCost?: number;
    }
  ) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
          description: `Work order completed${completionData.notes ? ` with notes: ${completionData.notes}` : ''}`,
          new_values: completionData
        }]);

      await loadWorkOrders();

      toast({
        title: "Work Order Completed",
        description: "Work order has been marked as completed successfully.",
      });
    } catch (error) {
      console.error('Error completing work order:', error);
      toast({
        title: "Error",
        description: "Failed to complete work order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create work order
  const createWorkOrder = async (workOrderData: {
    room_id?: string;
    title: string;
    description?: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_hours?: number;
    estimated_cost?: number;
  }) => {
    if (!user?.tenant_id || !user?.id) return;

    try {
      setIsLoading(true);

      // Generate work order number
      const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('work_orders')
        .insert([{
          tenant_id: user.tenant_id,
          work_order_number: workOrderNumber,
          ...workOrderData,
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
          action: 'work_order_created',
          resource_type: 'work_order',
          resource_id: data.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Work order created: ${workOrderData.title}`,
          new_values: workOrderData
        }]);

      await loadWorkOrders();

      toast({
        title: "Work Order Created",
        description: `Work order ${workOrderNumber} has been created successfully.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update supply stock
  const updateSupplyStock = async (supplyId: string, quantity: number, operation: 'add' | 'remove') => {
    if (!user?.tenant_id) return;

    try {
      setIsLoading(true);

      const quantityChange = operation === 'add' ? quantity : -quantity;
      
      const { error } = await supabase.rpc('update_supply_stock', {
        p_supply_id: supplyId,
        p_quantity_change: quantityChange
      });

      if (error) throw error;

      await loadSupplies();

      toast({
        title: "Inventory Updated",
        description: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating supply stock:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and user change
  useEffect(() => {
    if (user?.tenant_id) {
      loadWorkOrders();
      loadSupplies();
    }
  }, [user?.tenant_id, loadWorkOrders, loadSupplies]);

  return {
    workOrders,
    preventiveTasks: [], // TODO: Implement preventive tasks
    supplies,
    stats,
    isLoading,
    acceptWorkOrder,
    completeWorkOrder,
    createWorkOrder,
    completePreventiveTask: async () => {}, // TODO: Implement
    updateSupplyStock,
    refreshWorkOrders: loadWorkOrders,
    refreshSupplies: loadSupplies
  };
}