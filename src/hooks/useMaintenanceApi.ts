import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  room_id?: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed' | 'escalated';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  completion_notes?: string;
  // Legacy properties for compatibility
  workOrderNumber: string;
  roomId?: string;
  issue: string;
  assignedTo?: string;
  createdAt: string;
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
  name: string;
  category: 'electrical' | 'plumbing' | 'hvac' | 'general' | 'safety';
  currentStock: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  cost: number;
  supplier?: string;
  lastRestocked?: string;
  location: string;
}

export interface MaintenanceLog {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  action: string;
  workOrderId?: string;
  roomId?: string;
  facility?: string;
  details: string;
  category: 'work-order' | 'preventive' | 'supply' | 'escalation';
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

// Mock data - In production, this would come from your API
const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-001',
    work_order_number: 'WO205-01',
    room_id: '205',
    title: 'AC not cooling',
    description: 'Guest reported room temperature not dropping below 25°C',
    category: 'hvac',
    priority: 'high',
    status: 'in-progress',
    assigned_to: 'Mike Anderson',
    created_at: '2024-01-19T08:30:00Z',
    updated_at: '2024-01-19T09:15:00Z',
    estimated_hours: 1,
    completion_notes: 'Checking AC filter and refrigerant levels',
    // Legacy compatibility
    workOrderNumber: 'WO205-01',
    roomId: '205',
    issue: 'AC not cooling',
    assignedTo: 'Mike Anderson',
    createdAt: '2024-01-19T08:30:00Z',
    estimatedTime: 45
  },
  {
    id: 'wo-002',
    workOrderNumber: 'WO-POOL-07',
    facility: 'Swimming Pool',
    issue: 'Pool pump fault',
    description: 'Pool pump making unusual noise and reduced water circulation',
    source: 'manual',
    priority: 'critical',
    status: 'pending',
    createdAt: '2024-01-19T10:15:00Z',
    updatedAt: '2024-01-19T10:15:00Z',
    estimatedTime: 120
  },
  {
    id: 'wo-003',
    workOrderNumber: 'WO308-02',
    roomId: '308',
    issue: 'Shower leaking',
    description: 'Water dripping from shower head even when turned off',
    source: 'guest-qr',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'John Martinez',
    createdAt: '2024-01-19T07:00:00Z',
    updatedAt: '2024-01-19T08:30:00Z',
    completedAt: '2024-01-19T08:30:00Z',
    actualTime: 30,
    partsUsed: [
      { partId: 'valve-001', partName: 'Shower Valve Washer', quantity: 1, cost: 5.50 }
    ],
    notes: 'Replaced worn valve washer. Tested for 10 minutes - no leaks.'
  }
];

const mockPreventiveTasks: PreventiveTask[] = [
  {
    id: 'pt-001',
    title: 'AC Filter Replacement - Floor 2',
    description: 'Replace air conditioning filters for all rooms on floor 2',
    frequency: 'monthly',
    lastCompleted: '2024-12-19T00:00:00Z',
    nextDue: '2024-01-19T00:00:00Z',
    status: 'overdue',
    estimatedTime: 180,
    location: 'Floor 2 - All Rooms',
    priority: 'medium'
  },
  {
    id: 'pt-002',
    title: 'Generator Monthly Test',
    description: 'Monthly generator test and oil level check',
    frequency: 'monthly',
    nextDue: '2024-01-25T00:00:00Z',
    status: 'scheduled',
    estimatedTime: 60,
    location: 'Generator Room',
    priority: 'high'
  }
];

const mockSupplies: SupplyItem[] = [
  {
    id: 'sup-001',
    name: 'AC Filters (Standard)',
    category: 'hvac',
    currentStock: 8,
    minThreshold: 10,
    maxThreshold: 50,
    unit: 'pieces',
    cost: 12.50,
    supplier: 'HVAC Solutions Ltd',
    lastRestocked: '2024-01-10T00:00:00Z',
    location: 'Maintenance Store - Shelf A'
  },
  {
    id: 'sup-002',
    name: 'LED Bulbs (60W Equivalent)',
    category: 'electrical',
    currentStock: 25,
    minThreshold: 15,
    maxThreshold: 100,
    unit: 'pieces',
    cost: 8.00,
    location: 'Maintenance Store - Shelf B'
  },
  {
    id: 'sup-003',
    name: 'Plumbing Washers Set',
    category: 'plumbing',
    currentStock: 5,
    minThreshold: 10,
    maxThreshold: 30,
    unit: 'sets',
    cost: 15.00,
    location: 'Maintenance Store - Drawer C'
  }
];

export function useMaintenanceApi() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [preventiveTasks, setPreventiveTasks] = useState<PreventiveTask[]>(mockPreventiveTasks);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplies);
  const [stats, setStats] = useState<MaintenanceStats>({
    openIssues: 7,
    completedToday: 14,
    escalationsFromHousekeeping: 3,
    pendingCritical: 2,
    averageResolutionTime: 85,
    suppliesLowStock: 2,
    overduePreventive: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random updates to stats
      setStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + Math.floor(Math.random() * 2),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const acceptWorkOrder = async (workOrderId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWorkOrders(prev => prev.map(wo => 
        wo.id === workOrderId 
          ? { ...wo, status: 'in-progress', assigned_to: 'Current User', updated_at: new Date().toISOString() }
          : wo
      ));
      
      toast({
        title: "Work Order Accepted",
        description: "You have been assigned to this work order.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept work order. Please try again.",
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
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setWorkOrders(prev => prev.map(wo => 
        wo.id === workOrderId 
          ? { 
              ...wo, 
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              completion_notes: completionData.notes,
              actual_hours: completionData.actualHours,
              actual_cost: completionData.actualCost
            }
          : wo
      ));

      setStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1,
        openIssues: prev.openIssues - 1
      }));
      
      toast({
        title: "Work Order Completed",
        description: "Work order has been marked as completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete work order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkOrder = async (workOrderData: Partial<WorkOrder>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newWorkOrder: WorkOrder = {
        id: `wo-${Date.now()}`,
        workOrderNumber: `WO${workOrderData.roomId || 'FAC'}-${String(workOrders.length + 1).padStart(2, '0')}`,
        issue: workOrderData.issue || '',
        description: workOrderData.description,
        source: workOrderData.source || 'manual',
        priority: workOrderData.priority || 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedTime: workOrderData.estimatedTime,
        ...workOrderData
      };
      
      setWorkOrders(prev => [newWorkOrder, ...prev]);
      setStats(prev => ({ ...prev, openIssues: prev.openIssues + 1 }));
      
      toast({
        title: "Work Order Created",
        description: `Work order ${newWorkOrder.workOrderNumber} has been created successfully.`,
      });
      
      return newWorkOrder;
    } catch (error) {
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

  const completePreventiveTask = async (taskId: string, completionNotes?: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPreventiveTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed',
              lastCompleted: new Date().toISOString()
            }
          : task
      ));
      
      toast({
        title: "Preventive Task Completed",
        description: "Task has been marked as completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete preventive task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupplyStock = async (supplyId: string, quantity: number, operation: 'add' | 'remove') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSupplies(prev => prev.map(supply => 
        supply.id === supplyId 
          ? { 
              ...supply, 
              currentStock: operation === 'add' 
                ? supply.currentStock + quantity 
                : Math.max(0, supply.currentStock - quantity),
              lastRestocked: operation === 'add' ? new Date().toISOString() : supply.lastRestocked
            }
          : supply
      ));
      
      toast({
        title: "Inventory Updated",
        description: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    workOrders,
    preventiveTasks,
    supplies,
    stats,
    isLoading,
    acceptWorkOrder,
    completeWorkOrder,
    createWorkOrder,
    completePreventiveTask,
    updateSupplyStock
  };
}