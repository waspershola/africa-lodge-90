import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface QROrder {
  id: string;
  tenant_id: string;
  qr_code_id: string;
  session_id: string | null;
  room_id: string | null;
  request_type: string; // Changed from service_type
  request_data: any; // Changed from request_details
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  room?: {
    room_number: string;
  };
  assigned_staff?: {
    name: string;
  };
}

export function useQROrders() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all QR orders
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['qr-orders', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('qr_requests')
        .select(`
          *,
          room:rooms (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((order: any) => ({
        ...order,
        priority: String(order.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
      })) as QROrder[];
    },
    enabled: !!tenant?.tenant_id,
  });

  // Fetch pending orders only
  const usePendingOrders = () => {
    return useQuery({
      queryKey: ['qr-orders', 'pending', tenant?.tenant_id],
      queryFn: async () => {
        if (!tenant?.tenant_id) throw new Error('No tenant');

        const { data, error } = await supabase
          .from('qr_requests')
          .select(`
            *,
            room:rooms (
              room_number
            )
          `)
          .eq('tenant_id', tenant.tenant_id)
          .in('status', ['pending', 'acknowledged', 'in_progress'])
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map((order: any) => ({
          ...order,
          priority: String(order.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        })) as QROrder[];
      },
      enabled: !!tenant?.tenant_id,
    });
  };

  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      assignedTo,
      notes 
    }: { 
      orderId: string; 
      status: QROrder['status']; 
      assignedTo?: string;
      notes?: string;
    }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (assignedTo) updates.assigned_to = assignedTo;
      if (notes) updates.notes = notes;
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('qr_requests')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-orders'] });
      toast({
        title: 'Status Updated',
        description: 'Order status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    },
  });

  // Assign order to staff
  const assignOrder = useMutation({
    mutationFn: async ({ orderId, staffId }: { orderId: string; staffId: string }) => {
      const { data, error } = await supabase
        .from('qr_requests')
        .update({
          assigned_to: staffId,
          status: 'acknowledged',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-orders'] });
      toast({
        title: 'Order Assigned',
        description: 'Order has been assigned to staff member.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign order',
        variant: 'destructive',
      });
    },
  });

  return {
    orders,
    isLoading,
    error,
    usePendingOrders,
    updateOrderStatus,
    assignOrder,
  };
}
