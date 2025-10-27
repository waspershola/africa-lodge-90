import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useShiftNotifications } from './useShiftNotifications';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

export interface ShiftSession {
  id: string;
  tenant_id: string;
  staff_id: string;
  device_id?: string;
  authorized_by?: string;
  role: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'disputed';
  cash_total: number;
  pos_total: number;
  handover_notes?: string;
  unresolved_items: string[];
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  tenant_id: string;
  slug: string;
  location?: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useShiftSessions() {
  return useQuery({
    queryKey: ['shift-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as ShiftSession[];
    },
  });
}

export function useActiveShiftSessions() {
  return useQuery({
    queryKey: ['active-shift-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_sessions')
        .select('*')
        .eq('status', 'active')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as ShiftSession[];
    },
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('is_active', true)
        .order('slug');

      if (error) throw error;
      return data as Device[];
    },
  });
}

export function useStartShift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyShiftStart } = useShiftNotifications();

  return useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      deviceSlug?: string;
      authorizedBy?: string;
    }) => {
      // Phase 6.1: Validate token before shift start (critical financial operation)
      await validateAndRefreshToken();
      
      const { data, error } = await supabase.functions.invoke('shift-terminal-start', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['shift-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift-sessions'] });
      
      // Send shift start notification
      if (data.shift_session) {
        await notifyShiftStart.mutateAsync({
          shiftId: data.shift_session.id,
          staffName: data.shift_session.staff_name || 'Unknown',
          role: data.shift_session.role,
          deviceSlug: data.shift_session.device_slug
        });
      }
      
      toast({
        title: "Shift Started",
        description: "Successfully started shift session",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start shift",
        variant: "destructive",
      });
    },
  });
}

export function useEndShift() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      shiftSessionId: string;
      cashTotal: number;
      posTotal: number;
      handoverNotes?: string;
      unresolvedItems?: string[];
    }) => {
      // Phase 6.1: Validate token before shift end (critical financial operation)
      await validateAndRefreshToken();
      
      const { data, error } = await supabase.functions.invoke('shift-terminal-end', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-shift-sessions'] });
      toast({
        title: "Shift Ended",
        description: "Successfully ended shift session",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end shift",
        variant: "destructive",
      });
    },
  });
}