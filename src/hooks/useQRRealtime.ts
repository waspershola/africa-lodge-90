// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';
import { useCreateServiceAlert } from './useNotificationScheduler';
import { useQRShiftRouting } from './useQRShiftRouting';
import { realtimeChannelManager } from '@/lib/realtime-channel-manager';
import { queryClient } from '@/lib/queryClient';

export interface QROrder {
  id: string;
  tenant_id: string;
  qr_code_id: string;
  request_type: string; // Changed from service_type
  status: string;
  request_data: any; // Changed from request_details
  priority: string; // Changed from number to string
  assigned_to?: string;
  assigned_team?: string;
  room_id?: string;
  session_id?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_at?: string;
  notes?: string;
  messages?: Array<{
    id: string;
    sender_role: string;
    message: string;
    created_at: string;
    is_read: boolean;
  }>;
}

// Helper functions for staff notifications
const getServiceDepartment = (serviceType: string): string => {
  switch (serviceType) {
    case 'room_service':
    case 'food_beverage':
      return 'KITCHEN';
    case 'housekeeping':
    case 'laundry':
      return 'HOUSEKEEPING';
    case 'maintenance':
      return 'MAINTENANCE';
    case 'concierge':
      return 'FRONT_DESK';
    default:
      return 'GENERAL';
  }
};

const getPriorityLevel = (priority: string): 'low' | 'medium' | 'high' => {
  const normalizedPriority = priority.toLowerCase();
  if (normalizedPriority === 'urgent' || normalizedPriority === 'high') return 'high';
  if (normalizedPriority === 'medium') return 'medium';
  return 'low';
};

const getServiceDescription = (order: QROrder): string => {
  const details = order.request_data;
  if (details?.items && Array.isArray(details.items)) {
    const itemCount = details.items.length;
    return `${order.request_type.replace('_', ' ')} order with ${itemCount} item(s)`;
  }
  return details?.description || `${order.request_type.replace('_', ' ')} request`;
};

export const useQRRealtime = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<QROrder[]>([]);
  const [loading, setLoading] = useState(true);
  const createServiceAlert = useCreateServiceAlert();
  const { findBestStaffForService, getShiftCoverage } = useQRShiftRouting();

  // Fetch initial data
  useEffect(() => {
    if (!user?.tenant_id) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('qr_requests')
          .select('*')
          .eq('tenant_id', user.tenant_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching QR requests:', error);
        toast.error('Failed to load QR requests');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.tenant_id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channelId = `qr-requests-${user.tenant_id}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${user.tenant_id}`,
        },
        (payload) => {
          const newOrder = payload.new as QROrder;
          setOrders(prev => [newOrder, ...prev]);
          
          // Check shift coverage for intelligent routing
          const shiftCoverage = getShiftCoverage();
          const bestStaff = findBestStaffForService(newOrder.request_type);
          
          let toastDescription = `Room ${newOrder.room_id || 'Unknown'} - Priority ${newOrder.priority}`;
          
          if (!shiftCoverage.hasActiveCoverage) {
            toastDescription += ' ⚠️ Limited coverage';
          } else if (bestStaff) {
            toastDescription += ` → Assigned to ${bestStaff.staff_name}`;
            
            // Auto-assign to best available staff if they have expertise
            assignOrder(newOrder.id, bestStaff.staff_id);
          }
          
          // Show notification for new requests
          toast.success(`New ${newOrder.request_type.replace('_', ' ')} request received`, {
            description: toastDescription,
          });

          // Trigger staff alert notification
          const department = getServiceDepartment(newOrder.request_type);
          const priority = getPriorityLevel(newOrder.priority);
          
          createServiceAlert.mutate({
            sourceId: newOrder.id,
            sourceType: 'qr_request',
            title: `New ${newOrder.request_type.replace('_', ' ')} Request`,
            description: getServiceDescription(newOrder) + (bestStaff ? ` (Assigned to ${bestStaff.staff_name})` : ''),
            roomNumber: newOrder.room_id,
            priority: priority,
            department: department
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${user.tenant_id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as QROrder;
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );

          // Show notification for status changes
          if (payload.old && payload.old.status !== updatedOrder.status) {
            toast.info(`Request ${updatedOrder.status}`, {
              description: `${updatedOrder.request_type.replace('_', ' ')} request updated`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'qr_requests',
          filter: `tenant_id=eq.${user.tenant_id}`,
        },
        (payload) => {
          const deletedOrder = payload.old as QROrder;
          setOrders(prev => prev.filter(order => order.id !== deletedOrder.id));
        }
      )
      .subscribe();

    // ✅ F.3: Register with RealtimeChannelManager for lifecycle management
    realtimeChannelManager.registerChannel(channelId, channel, {
      type: 'qr_requests',
      priority: 'critical',
      retryLimit: 5
    });

    return () => {
      realtimeChannelManager.unregisterChannel(channelId);
    };
  }, [user?.tenant_id]);

  // ✅ F.4: Add window focus query revalidation
  useEffect(() => {
    const handleFocus = () => {
      console.log('[QRRealtime] Tab focused - revalidating QR orders');
      // Refetch orders when tab comes back into focus
      if (user?.tenant_id) {
        setLoading(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.tenant_id]);

  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString()
      };

      if (notes) updateData.notes = notes;
      if (status === 'assigned') updateData.assigned_at = new Date().toISOString();
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('qr_requests')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Request updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update request');
      return false;
    }
  };

  const assignOrder = async (orderId: string, assignedTo?: string, assignedTeam?: string) => {
    try {
      const { error } = await supabase
        .from('qr_requests')
        .update({
          assigned_to: assignedTo,
          assigned_team: assignedTeam,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Request assigned successfully');
      return true;
    } catch (error) {
      console.error('Error assigning order:', error);
      toast.error('Failed to assign request');
      return false;
    }
  };

  return {
    orders,
    loading,
    updateOrderStatus,
    assignOrder,
    refreshOrders: () => {
      // Trigger a refresh if needed
      if (user?.tenant_id) {
        setLoading(true);
        // The useEffect will handle the refresh
      }
    }
  };
};