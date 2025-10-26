import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMultiTenantAuth } from './useMultiTenantAuth';
import { soundManager } from '@/utils/soundManager';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface StaffNotification {
  id: string;
  tenant_id: string;
  title: string;
  message: string;
  notification_type: 'reservation' | 'guest_request' | 'payment' | 'maintenance' | 'checkout' | 'checkin' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sound_type: 'alert-high' | 'alert-medium' | 'alert-critical' | 'none';
  department?: string;
  recipients: string[];
  status: 'pending' | 'acknowledged' | 'completed' | 'escalated';
  acknowledged_at?: string;
  acknowledged_by?: string;
  completed_at?: string;
  completed_by?: string;
  escalate_after_minutes?: number;
  escalated_at?: string;
  escalated_to?: string;
  reference_type?: string;
  reference_id?: string;
  actions: string[];
  metadata: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

interface UseStaffNotificationsOptions {
  autoAcknowledge?: boolean;
  playSound?: boolean;
  showToast?: boolean;
}

export function useStaffNotifications(options: UseStaffNotificationsOptions = {}) {
  const {
    autoAcknowledge = false,
    playSound = true,
    showToast = true
  } = options;

  const { user, tenant } = useMultiTenantAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user || !tenant) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .in('status', ['pending', 'escalated'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications((data as any[]) || []);
      setUnreadCount((data || []).filter((n: any) => n.status === 'pending').length);
    } catch (error) {
      console.error('[useStaffNotifications] Error fetching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, tenant]);

  // Handle new notification
  const handleNewNotification = useCallback(async (notification: StaffNotification) => {
    console.log('[useStaffNotifications] New notification:', notification);

    // Check if notification permissions have been granted
    const hasPermission = localStorage.getItem('notification_permission_granted') === 'true';
    
    // Add to list
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Play sound if permissions granted
    if (playSound && hasPermission) {
      // Use alert-high (Thai bell) for all staff notifications unless specified otherwise
      const soundType = notification.sound_type !== 'none' ? notification.sound_type : 'alert-high';
      await soundManager.play(soundType);
    }

    // Show toast
    if (showToast) {
      const priorityColors: Record<string, string> = {
        urgent: 'destructive',
        high: 'default',
        medium: 'default',
        low: 'default'
      };

      toast({
        title: notification.title,
        description: notification.message,
        variant: priorityColors[notification.priority] as any,
        duration: notification.priority === 'urgent' ? 10000 : 5000
      });
    }

    // Auto acknowledge if enabled
    if (autoAcknowledge && notification.status === 'pending') {
      await acknowledgeNotification(notification.id);
    }

    // Invalidate related queries
    if (notification.reference_type) {
      const queryKey = getQueryKeyForReference(notification.reference_type);
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    }

    // CRITICAL: Always invalidate QR requests for staff dashboard real-time updates
    queryClient.invalidateQueries({ queryKey: ['qr-requests-staff'] });
  }, [playSound, showToast, autoAcknowledge, queryClient]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user || !tenant) return;

    fetchNotifications();

    const channel = supabase
      .channel(`staff_notifications_${tenant.tenant_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[useStaffNotifications] Realtime INSERT:', payload);
          handleNewNotification(payload.new as StaffNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staff_notifications',
          filter: `tenant_id=eq.${tenant.tenant_id}`
        },
        (payload) => {
          console.log('[useStaffNotifications] Realtime UPDATE:', payload);
          setNotifications(prev =>
            prev.map(n => n.id === (payload.new as any).id ? payload.new as StaffNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, tenant, handleNewNotification, fetchNotifications]);

  // Acknowledge notification
  const acknowledgeNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('staff_notifications')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString(), acknowledged_by: user.id }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      console.log('[useStaffNotifications] Acknowledged:', notificationId);
    } catch (error) {
      console.error('[useStaffNotifications] Error acknowledging:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive'
      });
    }
  }, [user]);

  // Complete notification
  const completeNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('staff_notifications')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      console.log('[useStaffNotifications] Completed:', notificationId);
    } catch (error) {
      console.error('[useStaffNotifications] Error completing:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete notification',
        variant: 'destructive'
      });
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !tenant) return;

    try {
      const { error } = await supabase
        .from('staff_notifications')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'pending');

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          status: 'acknowledged' as const,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        }))
      );
      setUnreadCount(0);

      console.log('[useStaffNotifications] Marked all as read');
    } catch (error) {
      console.error('[useStaffNotifications] Error marking all as read:', error);
    }
  }, [user, tenant]);

  return {
    notifications,
    unreadCount,
    isLoading,
    acknowledgeNotification,
    completeNotification,
    markAllAsRead,
    refetch: fetchNotifications
  };
}

// Helper to get query key for reference type
function getQueryKeyForReference(referenceType: string): string[] | null {
  const mapping: Record<string, string[]> = {
    'reservation': ['reservations'],
    'qr_request': ['qr-requests-staff'], // ✅ FIXED: Match edge function reference_type and correct query key
    'payment': ['payments'],
    'maintenance_task': ['maintenance'],
    'housekeeping_task': ['housekeeping-tasks']
  };
  return mapping[referenceType] || null;
}
