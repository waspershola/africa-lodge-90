import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for Housekeeping API
export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  type: 'cleaning' | 'amenity' | 'maintenance' | 'inspection';
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedStaff?: string;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  description: string;
  checkoutId?: string;
  estimatedDuration: number;
  notes?: string;
  checklist?: ChecklistItem[];
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

export interface AmenityRequest {
  id: string;
  roomNumber: string;
  guestName: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'declined';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedAt: Date;
  dueBy?: Date;
  completedAt?: Date;
  assignedTo?: string;
  source: 'guest-qr' | 'front-desk' | 'phone' | 'concierge';
  items: AmenityItem[];
  specialInstructions?: string;
  notes?: string;
  estimatedDuration: number;
  isVip?: boolean;
}

export interface AmenityItem {
  id: string;
  name: string;
  category: 'bedding' | 'bathroom' | 'food' | 'baby' | 'electronics' | 'other';
  quantity: number;
  available: boolean;
  estimatedTime: number;
}

export interface Supply {
  id: string;
  name: string;
  category: 'bedding' | 'bathroom' | 'cleaning' | 'amenities' | 'maintenance' | 'food';
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  cost: number;
  supplier: string;
  lastRestocked: Date;
  location: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'ordered';
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
  ipAddress: string;
  userAgent: string;
  location?: string;
}

// Offline sync queue
interface OfflineAction {
  id: string;
  type: 'accept_task' | 'complete_task' | 'use_supply' | 'update_status';
  payload: any;
  timestamp: Date;
  retry: number;
}

class HousekeepingAPI {
  private offlineQueue: OfflineAction[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.syncOfflineActions.bind(this));
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Task Management
  async getTasks(): Promise<HousekeepingTask[]> {
    if (!this.isOnline) {
      return this.getTasksFromCache();
    }

    try {
      // Simulate API call
      await this.delay(500);
      return this.mockTasks();
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return this.getTasksFromCache();
    }
  }

  async acceptTask(taskId: string): Promise<void> {
    const action: OfflineAction = {
      id: this.generateId(),
      type: 'accept_task',
      payload: { taskId },
      timestamp: new Date(),
      retry: 0
    };

    if (!this.isOnline) {
      this.offlineQueue.push(action);
      this.updateTaskStatusLocally(taskId, 'in-progress');
      return;
    }

    try {
      await this.delay(300);
      this.updateTaskStatusLocally(taskId, 'in-progress');
      this.logAction('task_accepted', taskId);
    } catch (error) {
      this.offlineQueue.push(action);
      throw error;
    }
  }

  async completeTask(taskId: string, notes?: string, photos?: File[]): Promise<void> {
    const action: OfflineAction = {
      id: this.generateId(),
      type: 'complete_task',
      payload: { taskId, notes, photos },
      timestamp: new Date(),
      retry: 0
    };

    if (!this.isOnline) {
      this.offlineQueue.push(action);
      this.updateTaskStatusLocally(taskId, 'completed');
      return;
    }

    try {
      await this.delay(300);
      this.updateTaskStatusLocally(taskId, 'completed');
      this.logAction('task_completed', taskId, notes);
    } catch (error) {
      this.offlineQueue.push(action);
      throw error;
    }
  }

  // Supply Management
  async getSupplies(): Promise<Supply[]> {
    if (!this.isOnline) {
      return this.getSuppliesFromCache();
    }

    try {
      await this.delay(400);
      return this.mockSupplies();
    } catch (error) {
      console.error('Failed to fetch supplies:', error);
      return this.getSuppliesFromCache();
    }
  }

  async recordSupplyUsage(supplyId: string, roomNumber: string, quantity: number, notes?: string): Promise<void> {
    const action: OfflineAction = {
      id: this.generateId(),
      type: 'use_supply',
      payload: { supplyId, roomNumber, quantity, notes },
      timestamp: new Date(),
      retry: 0
    };

    if (!this.isOnline) {
      this.offlineQueue.push(action);
      this.updateSupplyStockLocally(supplyId, quantity);
      return;
    }

    try {
      await this.delay(200);
      this.updateSupplyStockLocally(supplyId, quantity);
      this.logAction('supply_used', supplyId, `Used ${quantity} in room ${roomNumber}`);
    } catch (error) {
      this.offlineQueue.push(action);
      throw error;
    }
  }

  // Amenity Requests
  async getAmenityRequests(): Promise<AmenityRequest[]> {
    if (!this.isOnline) {
      return this.getAmenityRequestsFromCache();
    }

    try {
      await this.delay(300);
      return this.mockAmenityRequests();
    } catch (error) {
      console.error('Failed to fetch amenity requests:', error);
      return this.getAmenityRequestsFromCache();
    }
  }

  // Audit Logs
  async getAuditLogs(filters?: { staff?: string; room?: string; action?: string }): Promise<AuditLog[]> {
    try {
      await this.delay(200);
      return this.mockAuditLogs(filters);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  // Real-time updates simulation
  subscribeToUpdates(callback: (update: any) => void) {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance of update
        const updates = [
          { type: 'new_task', data: { roomNumber: '101', type: 'cleaning' } },
          { type: 'task_completed', data: { taskId: 'task-1', roomNumber: '205' } },
          { type: 'amenity_request', data: { roomNumber: '308', items: ['towels'] } }
        ];
        callback(updates[Math.floor(Math.random() * updates.length)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }

  // Offline sync
  private async syncOfflineActions() {
    this.isOnline = true;
    
    for (const action of this.offlineQueue) {
      try {
        switch (action.type) {
          case 'accept_task':
            await this.acceptTask(action.payload.taskId);
            break;
          case 'complete_task':
            await this.completeTask(action.payload.taskId, action.payload.notes);
            break;
          case 'use_supply':
            await this.recordSupplyUsage(
              action.payload.supplyId,
              action.payload.roomNumber,
              action.payload.quantity,
              action.payload.notes
            );
            break;
        }
        
        // Remove from queue if successful
        this.offlineQueue = this.offlineQueue.filter(a => a.id !== action.id);
      } catch (error) {
        action.retry++;
        if (action.retry > 3) {
          // Remove failed actions after 3 retries
          this.offlineQueue = this.offlineQueue.filter(a => a.id !== action.id);
        }
      }
    }
  }

  // Helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private updateTaskStatusLocally(taskId: string, status: string) {
    // Update local storage/cache
    const tasks = this.getTasksFromCache();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    );
    localStorage.setItem('housekeeping_tasks', JSON.stringify(updatedTasks));
  }

  private updateSupplyStockLocally(supplyId: string, quantityUsed: number) {
    // Update local storage/cache
    const supplies = this.getSuppliesFromCache();
    const updatedSupplies = supplies.map(supply => 
      supply.id === supplyId 
        ? { ...supply, currentStock: Math.max(0, supply.currentStock - quantityUsed) }
        : supply
    );
    localStorage.setItem('housekeeping_supplies', JSON.stringify(updatedSupplies));
  }

  private logAction(action: string, targetId: string, description?: string) {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      staffMember: 'Current User', // Get from auth context
      staffId: 'staff-001',
      action,
      targetType: 'task',
      targetId,
      description: description || `${action.replace('_', ' ')} for ${targetId}`,
      ipAddress: '192.168.1.25',
      userAgent: navigator.userAgent
    };

    const logs = this.getAuditLogsFromCache();
    logs.unshift(log);
    localStorage.setItem('housekeeping_audit_logs', JSON.stringify(logs.slice(0, 1000))); // Keep last 1000 logs
  }

  // Cache methods
  private getTasksFromCache(): HousekeepingTask[] {
    const cached = localStorage.getItem('housekeeping_tasks');
    return cached ? JSON.parse(cached) : this.mockTasks();
  }

  private getSuppliesFromCache(): Supply[] {
    const cached = localStorage.getItem('housekeeping_supplies');
    return cached ? JSON.parse(cached) : this.mockSupplies();
  }

  private getAmenityRequestsFromCache(): AmenityRequest[] {
    const cached = localStorage.getItem('housekeeping_amenities');
    return cached ? JSON.parse(cached) : this.mockAmenityRequests();
  }

  private getAuditLogsFromCache(): AuditLog[] {
    const cached = localStorage.getItem('housekeeping_audit_logs');
    return cached ? JSON.parse(cached) : [];
  }

  // Mock data methods
  private mockTasks(): HousekeepingTask[] {
    return [
      {
        id: 'task-1',
        roomNumber: '301',
        type: 'cleaning',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Maria Santos',
        assignedStaff: 'Maria Santos',
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        description: 'Post-checkout deep cleaning',
        estimatedDuration: 45,
        source: 'auto',
        checklist: [
          { id: 'c1', task: 'Strip and remake beds', completed: false, required: true },
          { id: 'c2', task: 'Clean bathroom thoroughly', completed: false, required: true },
          { id: 'c3', task: 'Vacuum carpets and floors', completed: false, required: true }
        ]
      },
      {
        id: 'task-2',
        roomNumber: '308',
        type: 'amenity',
        status: 'pending',
        priority: 'medium',
        assignedTo: 'Sarah Johnson',
        dueDate: new Date(Date.now() + 30 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        description: 'Guest amenity delivery request',
        estimatedDuration: 15,
        source: 'guest-qr',
        items: ['Extra Towels (x2)', 'Baby Cot', 'Extra Pillows']
      }
    ];
  }

  private mockSupplies(): Supply[] {
    return [
      {
        id: 'sup-1',
        name: 'Bath Towels',
        category: 'bathroom',
        currentStock: 45,
        minimumStock: 20,
        maximumStock: 100,
        unit: 'pieces',
        cost: 25.00,
        supplier: 'Hotel Linens Co.',
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        location: 'Linen Room A',
        status: 'in-stock'
      },
      {
        id: 'sup-2',
        name: 'Toilet Paper',
        category: 'bathroom',
        currentStock: 8,
        minimumStock: 15,
        maximumStock: 50,
        unit: 'rolls',
        cost: 12.50,
        supplier: 'CleanSupply Ltd.',
        lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        location: 'Storage Room B',
        status: 'low-stock'
      }
    ];
  }

  private mockAmenityRequests(): AmenityRequest[] {
    return [
      {
        id: 'req-1',
        roomNumber: '308',
        guestName: 'Sarah Johnson',
        status: 'pending',
        priority: 'medium',
        requestedAt: new Date(Date.now() - 15 * 60 * 1000),
        dueBy: new Date(Date.now() + 45 * 60 * 1000),
        source: 'guest-qr',
        estimatedDuration: 20,
        items: [
          { id: 'item-1', name: 'Extra Towels', category: 'bathroom', quantity: 2, available: true, estimatedTime: 5 },
          { id: 'item-2', name: 'Baby Cot', category: 'baby', quantity: 1, available: true, estimatedTime: 15 }
        ]
      }
    ];
  }

  private mockAuditLogs(filters?: any): AuditLog[] {
    return [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        staffMember: 'Maria Santos',
        staffId: 'staff-001',
        action: 'task_completed',
        targetType: 'task',
        targetId: 'task-301-cleaning',
        roomNumber: '301',
        description: 'Completed post-checkout cleaning for Room 301',
        ipAddress: '192.168.1.25',
        userAgent: 'Mozilla/5.0 (Mobile)'
      }
    ];
  }
}

// Singleton instance
const housekeepingAPI = new HousekeepingAPI();

// Custom hooks for React components
export function useHousekeepingTasks() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();

    // Subscribe to real-time updates
    const unsubscribe = housekeepingAPI.subscribeToUpdates((update) => {
      if (update.type === 'new_task' || update.type === 'task_completed') {
        loadTasks();
        toast({
          title: "Task Update",
          description: `${update.type.replace('_', ' ')} - Room ${update.data.roomNumber}`,
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await housekeepingAPI.getTasks();
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (taskId: string) => {
    try {
      await housekeepingAPI.acceptTask(taskId);
      await loadTasks();
      toast({
        title: "Task Accepted",
        description: "Task has been assigned to you",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to accept task",
        variant: "destructive"
      });
    }
  };

  const completeTask = async (taskId: string, notes?: string) => {
    try {
      await housekeepingAPI.completeTask(taskId, notes);
      await loadTasks();
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to complete task",
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
    refreshTasks: loadTasks
  };
}

export function useHousekeepingSupplies() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const suppliesData = await housekeepingAPI.getSupplies();
      setSupplies(suppliesData);
    } catch (err) {
      setError('Failed to load supplies');
      console.error('Error loading supplies:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordUsage = async (supplyId: string, roomNumber: string, quantity: number, notes?: string) => {
    try {
      await housekeepingAPI.recordSupplyUsage(supplyId, roomNumber, quantity, notes);
      await loadSupplies();
      toast({
        title: "Usage Recorded",
        description: `${quantity} items recorded for room ${roomNumber}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to record supply usage",
        variant: "destructive"
      });
    }
  };

  return {
    supplies,
    loading,
    error,
    recordUsage,
    refreshSupplies: loadSupplies
  };
}

export function useAmenityRequests() {
  const [requests, setRequests] = useState<AmenityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();

    // Subscribe to real-time updates
    const unsubscribe = housekeepingAPI.subscribeToUpdates((update) => {
      if (update.type === 'amenity_request') {
        loadRequests();
        toast({
          title: "New Amenity Request",
          description: `Room ${update.data.roomNumber} - ${update.data.items.join(', ')}`,
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const requestsData = await housekeepingAPI.getAmenityRequests();
      setRequests(requestsData);
    } catch (err) {
      setError('Failed to load amenity requests');
      console.error('Error loading amenity requests:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    requests,
    loading,
    error,
    refreshRequests: loadRequests
  };
}

export function useAuditLogs(filters?: { staff?: string; room?: string; action?: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logsData = await housekeepingAPI.getAuditLogs(filters);
      setLogs(logsData);
    } catch (err) {
      setError('Failed to load audit logs');
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    error,
    refreshLogs: loadLogs
  };
}
