import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface QRRequest {
  id: string;
  tenant_id: string;
  qr_code_id: string;
  session_id: string;
  request_type: string;
  request_data: any;
  status: string;
  priority: string;
  notes: string | null;
  assigned_to: string | null;
  room_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  rooms?: {
    room_number: string;
  };
}

interface BulkActionParams {
  requestIds: string[];
  action: 'assign' | 'complete' | 'cancel';
  assigneeId?: string;
  notes?: string;
}

export function useQRStaffManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // Fetch all staff members for assignment
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members', user?.tenant_id],
    queryFn: async () => {
      if (!user?.tenant_id) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, department')
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true)
        .in('role', ['HOUSEKEEPING', 'MAINTENANCE', 'FRONT_DESK', 'POS', 'MANAGER']);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.tenant_id,
  });

  // Fetch QR requests with realtime updates
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['qr-requests-staff', user?.tenant_id],
    queryFn: async () => {
      if (!user?.tenant_id) return [];

      const { data, error } = await supabase
        .from('qr_requests')
        .select(`
          *,
          rooms:room_id (
            room_number
          ),
          guest_sessions!inner (
            guest_phone,
            guest_email,
            qr_codes (
              label
            )
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as QRRequest[];
    },
    enabled: !!user?.tenant_id,
  });

  // Assign request to staff
  const assignRequest = useMutation({
    mutationFn: async ({ requestId, staffId, notes }: { requestId: string; staffId: string; notes?: string }) => {
      const { error } = await supabase
        .from('qr_requests')
        .update({
          assigned_to: staffId,
          status: 'assigned',
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-requests-staff'] });
      toast.success('Request assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign request: ${error.message}`);
    },
  });

  // Bulk actions
  const bulkAction = useMutation({
    mutationFn: async ({ requestIds, action, assigneeId, notes }: BulkActionParams) => {
      let updateData: any = {
        updated_at: new Date().toISOString(),
      };

      switch (action) {
        case 'assign':
          if (!assigneeId) throw new Error('Assignee ID required');
          updateData.assigned_to = assigneeId;
          updateData.status = 'assigned';
          break;
        case 'complete':
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
          break;
        case 'cancel':
          updateData.status = 'cancelled';
          break;
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('qr_requests')
        .update(updateData)
        .in('id', requestIds);

      if (error) throw error;

      return { action, count: requestIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-requests-staff'] });
      toast.success(`${data.count} request(s) ${data.action}ed successfully`);
      setSelectedRequests(new Set());
    },
    onError: (error: Error) => {
      toast.error(`Bulk action failed: ${error.message}`);
    },
  });

  // Update request status
  const updateStatus = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string; status: string; notes?: string }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('qr_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-requests-staff'] });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Toggle request selection
  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  // Select all requests
  const selectAll = (requestIds: string[]) => {
    setSelectedRequests(new Set(requestIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  // Get statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    assigned: requests.filter((r) => r.status === 'assigned').length,
    inProgress: requests.filter((r) => ['accepted', 'preparing', 'on_route'].includes(r.status)).length,
    completed: requests.filter((r) => r.status === 'completed').length,
    cancelled: requests.filter((r) => r.status === 'cancelled').length,
  };

  return {
    requests,
    staffMembers,
    selectedRequests,
    isLoading,
    stats,
    assignRequest,
    bulkAction,
    updateStatus,
    toggleRequestSelection,
    selectAll,
    clearSelection,
  };
}
