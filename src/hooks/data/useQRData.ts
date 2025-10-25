// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

/**
 * QR Order Data Hook - MIGRATION IN PROGRESS
 * 
 * HOTFIX (2025-01-22): Queries BOTH qr_orders (legacy) AND qr_requests (new) tables
 * during migration period to ensure no data loss.
 * 
 * Migration Status:
 * - ✅ New table (qr_requests) is active
 * - ⚠️ Old table (qr_orders) still queried for backward compatibility
 * - 🔄 All mutations attempt both tables
 * 
 * Action Required: Remove qr_orders queries after complete migration
 */

export interface QROrder {
  id: string;
  tenant_id: string;
  qr_code_id: string;
  session_id: string | null;
  room_id: string | null;
  request_type: string;
  request_data: any;
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
    floor?: string;
  };
  assigned_staff?: {
    name: string;
  };
  _source?: 'legacy' | 'unified'; // Debug marker
}

export function useQROrders() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // HOTFIX: Fetch from BOTH tables during migration
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['qr-orders', tenant?.tenant_id],
    meta: { 
      priority: 'high',
      maxAge: 60000 // 1 minute
    },
    staleTime: 60 * 1000, // 1 minute - high priority for guest services
    queryFn: async () => {
      if (!tenant?.tenant_id) throw new Error('No tenant');

      // Query NEW unified table (qr_requests)
      const { data: newRequests, error: newError } = await supabase
        .from('qr_requests')
        .select(`
          *,
          room:rooms (
            room_number,
            floor
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      // Query OLD legacy table (qr_orders) for backward compatibility
      const { data: oldOrders, error: oldError } = await supabase
        .from('qr_orders')
        .select(`
          *,
          room:rooms (
            room_number,
            floor
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      // If both queries fail, throw the new table error
      if (newError && oldError) {
        console.error('❌ Failed to fetch from both tables:', { newError, oldError });
        throw newError;
      }

      // Normalize old orders to match new schema
      const normalizedOldOrders = (oldOrders || []).map((order: any) => ({
        ...order,
        request_type: order.service_type || order.request_type,
        request_data: order.request_details || order.request_data,
        priority: typeof order.priority === 'number' 
          ? (order.priority === 0 ? 'low' : order.priority === 1 ? 'medium' : 'high')
          : String(order.priority || 'medium'),
        _source: 'legacy' as const
      }));

      // Mark new requests
      const markedNewRequests = (newRequests || []).map((req: any) => ({
        ...req,
        priority: String(req.priority || 'medium'),
        _source: 'unified' as const
      }));

      // Merge both sources
      const combined = [...markedNewRequests, ...normalizedOldOrders];
      
      console.log(`📊 [QR Data] Fetched ${newRequests?.length || 0} from qr_requests (new), ${oldOrders?.length || 0} from qr_orders (legacy)`);
      
      return combined as QROrder[];
    },
    enabled: !!tenant?.tenant_id,
  });

  // Fetch pending orders only - HOTFIX: Query both tables
  const usePendingOrders = () => {
    return useQuery({
      queryKey: ['qr-orders', 'pending', tenant?.tenant_id],
      queryFn: async () => {
        if (!tenant?.tenant_id) throw new Error('No tenant');

        // Query NEW table (qr_requests)
        const { data: newRequests, error: newError } = await supabase
          .from('qr_requests')
          .select(`
            *,
            room:rooms (
              room_number,
              floor
            )
          `)
          .eq('tenant_id', tenant.tenant_id)
          .in('status', ['pending', 'acknowledged', 'in_progress'])
          .order('created_at', { ascending: true });

        // Query OLD table (qr_orders)
        const { data: oldOrders, error: oldError } = await supabase
          .from('qr_orders')
          .select(`
            *,
            room:rooms (
              room_number,
              floor
            )
          `)
          .eq('tenant_id', tenant.tenant_id)
          .in('status', ['pending', 'acknowledged', 'in_progress'])
          .order('created_at', { ascending: true });

        if (newError && oldError) {
          console.error('❌ Failed to fetch pending orders:', { newError, oldError });
          throw newError;
        }

        // Normalize and merge
        const normalizedOldOrders = (oldOrders || []).map((order: any) => ({
          ...order,
          request_type: order.service_type || order.request_type,
          request_data: order.request_details || order.request_data,
          priority: typeof order.priority === 'number'
            ? (order.priority === 0 ? 'low' : order.priority === 1 ? 'medium' : 'high')
            : String(order.priority || 'medium'),
          _source: 'legacy' as const
        }));

        const markedNewRequests = (newRequests || []).map((req: any) => ({
          ...req,
          priority: String(req.priority || 'medium'),
          _source: 'unified' as const
        }));

        const combined = [...markedNewRequests, ...normalizedOldOrders];
        
        // Sort by priority then creation time
        return combined.sort((a: any, b: any) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          
          if (aPriority !== bPriority) return bPriority - aPriority;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }) as QROrder[];
      },
      enabled: !!tenant?.tenant_id,
    });
  };

  // HOTFIX: Update status in BOTH tables during migration
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

      // Try NEW table first (qr_requests)
      const { data: newData, error: newError } = await supabase
        .from('qr_requests')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (!newError) {
        console.log('✅ [QR Update] Updated in qr_requests (new table)');
        return newData;
      }

      // Fallback to OLD table (qr_orders)
      const { data: oldData, error: oldError } = await supabase
        .from('qr_orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (oldError) {
        console.error('❌ [QR Update] Failed in both tables:', { newError, oldError });
        throw oldError;
      }

      console.log('✅ [QR Update] Updated in qr_orders (legacy table)');
      return oldData;
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

  // HOTFIX: Assign in BOTH tables during migration
  const assignOrder = useMutation({
    mutationFn: async ({ orderId, staffId }: { orderId: string; staffId: string }) => {
      const updates = {
        assigned_to: staffId,
        status: 'acknowledged' as const,
        updated_at: new Date().toISOString(),
      };

      // Try NEW table first (qr_requests)
      const { data: newData, error: newError } = await supabase
        .from('qr_requests')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (!newError) {
        console.log('✅ [QR Assign] Assigned in qr_requests (new table)');
        return newData;
      }

      // Fallback to OLD table (qr_orders)
      const { data: oldData, error: oldError } = await supabase
        .from('qr_orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (oldError) {
        console.error('❌ [QR Assign] Failed in both tables:', { newError, oldError });
        throw oldError;
      }

      console.log('✅ [QR Assign] Assigned in qr_orders (legacy table)');
      return oldData;
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
