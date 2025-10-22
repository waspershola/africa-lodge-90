import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { soundManager } from '@/utils/soundManager';
import { toast } from '@/hooks/use-toast';

/**
 * Guest Portal Notification Hook
 * 
 * Subscribes to real-time updates for guest requests and plays
 * notification sounds when request status changes.
 * 
 * This provides guests with audio feedback when staff acknowledges,
 * processes, or completes their requests.
 */

interface UseGuestNotificationsOptions {
  sessionToken: string | null;
  enableSound?: boolean;
  enableToast?: boolean;
}

export function useGuestNotifications({
  sessionToken,
  enableSound = true,
  enableToast = true
}: UseGuestNotificationsOptions) {
  const lastNotificationRef = useRef<string>('');
  const isMutedRef = useRef(false);

  // Handle status change notifications
  const handleStatusUpdate = useCallback(async (oldStatus: string, newStatus: string, requestType: string) => {
    // Prevent duplicate notifications
    const notificationKey = `${newStatus}-${Date.now()}`;
    if (lastNotificationRef.current === notificationKey) return;
    lastNotificationRef.current = notificationKey;

    // Don't notify on initial pending status
    if (oldStatus === null && newStatus === 'pending') return;

    // Check if muted
    if (isMutedRef.current) return;

    let title = '';
    let description = '';
    let shouldPlaySound = false;

    switch (newStatus) {
      case 'acknowledged':
        title = '✓ Request Acknowledged';
        description = 'Staff has received your request';
        shouldPlaySound = true;
        break;
      case 'in_progress':
        title = '🔄 Request In Progress';
        description = 'Staff is working on your request';
        shouldPlaySound = true;
        break;
      case 'completed':
        title = '✅ Request Completed';
        description = 'Your request has been completed';
        shouldPlaySound = true;
        break;
      case 'cancelled':
        title = '❌ Request Cancelled';
        description = 'Your request has been cancelled';
        shouldPlaySound = false;
        break;
    }

    if (shouldPlaySound && title) {
      // Play gentle notification sound for guests
      if (enableSound) {
        // Use medium alert for guest notifications (gentle chime)
        await soundManager.play('alert-medium', 0.6); // Lower volume for guests
      }

      // Show toast notification
      if (enableToast) {
        toast({
          title,
          description,
          duration: 5000,
        });
      }

      console.log('[GuestNotifications] Status change notification:', { oldStatus, newStatus, requestType });
    }
  }, [enableSound, enableToast]);

  // Setup realtime subscription
  useEffect(() => {
    if (!sessionToken) return;

    console.log('[GuestNotifications] Setting up subscription for session:', sessionToken);

    // Subscribe to request updates for this session
    const channel = supabase
      .channel(`guest_notifications_${sessionToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_requests',
          filter: `session_token=eq.${sessionToken}`,
        },
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          if (oldRecord.status !== newRecord.status) {
            console.log('[GuestNotifications] Status change detected:', {
              old: oldRecord.status,
              new: newRecord.status,
              requestType: newRecord.request_type
            });
            
            handleStatusUpdate(
              oldRecord.status,
              newRecord.status,
              newRecord.request_type
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[GuestNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[GuestNotifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionToken, handleStatusUpdate]);

  // Toggle mute function
  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    soundManager.setMuted(isMutedRef.current);
    console.log('[GuestNotifications] Muted:', isMutedRef.current);
    return isMutedRef.current;
  }, []);

  return {
    toggleMute,
    isMuted: isMutedRef.current
  };
}
