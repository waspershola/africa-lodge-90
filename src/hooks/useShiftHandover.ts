/**
 * Shift Handover Hook
 * 
 * Manages staff shift transitions, handover notes, and shift continuity.
 * Provides real-time shift status tracking and seamless staff transitions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

interface ShiftData {
  id: string;
  tenant_id: string;
  user_id: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'full_day';
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  handover_notes?: string;
  handover_completed: boolean;
  handover_by?: string;
  handover_to?: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface HandoverData {
  general_notes: string;
  pending_tasks: Array<{
    id: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    room_id?: string;
    status: 'pending' | 'in_progress';
  }>;
  guest_requests: Array<{
    id: string;
    room_number: string;
    service_type: string;
    status: string;
    priority: number;
  }>;
  maintenance_alerts: Array<{
    id: string;
    room_id: string;
    issue: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
  cash_count?: {
    opening_balance: number;
    closing_balance: number;
    transactions_summary: string;
  };
}

export function useShiftHandover() {
  const { user, tenant } = useAuth();
  const queryClient = useQueryClient();
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);
  const [handoverData, setHandoverData] = useState<HandoverData>({
    general_notes: '',
    pending_tasks: [],
    guest_requests: [],
    maintenance_alerts: []
  });

  // Get current user's active shift
  const { data: activeShift, isLoading: shiftLoading } = useQuery({
    queryKey: ['active-shift', user?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.tenant_id) return null;

      const { data, error } = await supabase
        .from('staff_shifts')
        .select(`
          *,
          user:users(name, email, role)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id && !!tenant?.tenant_id
  });

  // Get upcoming shifts for handover planning
  const { data: upcomingShifts } = useQuery({
    queryKey: ['upcoming-shifts', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('staff_shifts')
        .select(`
          *,
          user:users(name, email, role)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.tenant_id
  });

  // Start shift mutation
  const startShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { data, error } = await supabase
        .from('staff_shifts')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as ShiftData;
    },
    onSuccess: (data) => {
      setCurrentShift(data);
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      toast.success('Shift started successfully');
    },
    onError: (error) => {
      console.error('Error starting shift:', error);
      toast.error('Failed to start shift');
    }
  });

  // Complete handover mutation
  const completeHandoverMutation = useMutation({
    mutationFn: async ({ 
      shiftId, 
      handoverTo, 
      notes 
    }: { 
      shiftId: string; 
      handoverTo: string; 
      notes: string;
    }) => {
      // Update current shift with handover info
      const { error: shiftError } = await supabase
        .from('staff_shifts')
        .update({
          status: 'completed',
          handover_completed: true,
          handover_to: handoverTo,
          handover_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId);

      if (shiftError) throw shiftError;

      // Mark next shift as ready to start
      const { error: nextShiftError } = await supabase
        .from('staff_shifts')
        .update({
          handover_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', handoverTo)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString());

      if (nextShiftError) throw nextShiftError;

      return { success: true };
    },
    onSuccess: () => {
      setCurrentShift(null);
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-shifts'] });
      toast.success('Shift handover completed successfully');
    },
    onError: (error) => {
      console.error('Error completing handover:', error);
      toast.error('Failed to complete shift handover');
    }
  });

  // Collect handover data from various sources
  const collectHandoverData = useCallback(async () => {
    if (!tenant?.tenant_id) return;

    try {
      // Get pending QR requests
      const { data: qrRequests } = await supabase
        .from('qr_orders')
        .select('id, service_type, status, priority, room_id')
        .eq('tenant_id', tenant.tenant_id)
        .in('status', ['pending', 'assigned', 'accepted', 'preparing']);

      // Get pending housekeeping tasks
      const { data: housekeepingTasks } = await supabase
        .from('housekeeping_tasks')
        .select('id, title, priority, status, room_id')
        .eq('tenant_id', tenant.tenant_id)
        .in('status', ['pending', 'assigned']);

      // Combine data
      const pendingTasks = housekeepingTasks?.map(task => ({
        id: task.id,
        description: task.title,
        priority: task.priority as 'low' | 'medium' | 'high',
        room_id: task.room_id,
        status: task.status as 'pending' | 'in_progress'
      })) || [];

      const guestRequests = qrRequests?.map(request => ({
        id: request.id,
        room_number: request.room_id || 'Unknown',
        service_type: request.service_type,
        status: request.status,
        priority: request.priority
      })) || [];

      setHandoverData(prev => ({
        ...prev,
        pending_tasks: pendingTasks,
        guest_requests: guestRequests
      }));

    } catch (error) {
      console.error('Error collecting handover data:', error);
    }
  }, [tenant?.tenant_id]);

  // Update handover notes
  const updateHandoverNotes = useCallback((notes: string) => {
    setHandoverData(prev => ({ ...prev, general_notes: notes }));
  }, []);

  // Set up real-time subscriptions for shift updates
  useEffect(() => {
    if (!tenant?.tenant_id) return;

    const channel = supabase
      .channel('shift_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_shifts',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-shift'] });
          queryClient.invalidateQueries({ queryKey: ['upcoming-shifts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.tenant_id, queryClient]);

  // Auto-collect handover data when shift is active
  useEffect(() => {
    if (activeShift) {
      collectHandoverData();
    }
  }, [activeShift, collectHandoverData]);

  return {
    // Shift state
    currentShift: activeShift,
    upcomingShifts,
    handoverData,
    isLoading: shiftLoading,

    // Actions
    startShift: startShiftMutation.mutate,
    completeHandover: completeHandoverMutation.mutate,
    updateHandoverNotes,
    collectHandoverData,

    // Status
    isStartingShift: startShiftMutation.isPending,
    isCompletingHandover: completeHandoverMutation.isPending
  };
}
