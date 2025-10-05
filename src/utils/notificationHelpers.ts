import { supabase } from '@/integrations/supabase/client';

/**
 * Notification Helper Functions
 * 
 * Centralized functions for creating notifications across the hotel system
 */

export type NotificationType = 'reservation' | 'guest_request' | 'payment' | 'maintenance' | 'checkout' | 'checkin' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SoundType = 'alert-high' | 'alert-medium' | 'alert-critical' | 'none';

interface CreateNotificationParams {
  tenantId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  soundType?: SoundType;
  department?: string;
  recipients?: string[];
  referenceType?: string;
  referenceId?: string;
  actions?: string[];
  escalateAfterMinutes?: number;
  metadata?: Record<string, any>;
}

/**
 * Create a staff notification
 */
export async function createStaffNotification(params: CreateNotificationParams) {
  const {
    tenantId,
    title,
    message,
    type,
    priority = 'medium',
    soundType = 'alert-medium',
    department,
    recipients = [],
    referenceType,
    referenceId,
    actions = ['acknowledge'],
    escalateAfterMinutes = 5,
    metadata = {}
  } = params;

  try {
    const { data, error } = await supabase
      .from('staff_notifications')
      .insert({
        tenant_id: tenantId,
        title,
        message,
        notification_type: type,
        priority,
        sound_type: soundType,
        department,
        recipients,
        reference_type: referenceType,
        reference_id: referenceId,
        actions,
        escalate_after_minutes: escalateAfterMinutes,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[NotificationHelper] Created notification:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[NotificationHelper] Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Create reservation notification
 */
export async function notifyNewReservation(
  tenantId: string,
  reservationId: string,
  guestName: string,
  roomNumber: string,
  checkInDate: string
) {
  return createStaffNotification({
    tenantId,
    title: 'New Reservation',
    message: `${guestName} - Room ${roomNumber}, Check-in: ${checkInDate}`,
    type: 'reservation',
    priority: 'medium',
    soundType: 'alert-medium',
    department: 'FRONT_DESK',
    referenceType: 'reservation',
    referenceId: reservationId,
    actions: ['acknowledge', 'view_details']
  });
}

/**
 * Create guest request notification (QR order)
 */
export async function notifyGuestRequest(
  tenantId: string,
  qrOrderId: string,
  roomNumber: string,
  requestType: string,
  items: string
) {
  const department = requestType === 'food' || requestType === 'beverage' ? 'RESTAURANT' : 'HOUSEKEEPING';
  
  return createStaffNotification({
    tenantId,
    title: `Guest Request - Room ${roomNumber}`,
    message: `${requestType}: ${items}`,
    type: 'guest_request',
    priority: 'high',
    soundType: 'alert-high',
    department,
    referenceType: 'qr_order',
    referenceId: qrOrderId,
    actions: ['acknowledge', 'view_details', 'assign'],
    escalateAfterMinutes: 3
  });
}

/**
 * Create payment notification
 */
export async function notifyPaymentReceived(
  tenantId: string,
  paymentId: string,
  guestName: string,
  amount: number,
  method: string
) {
  return createStaffNotification({
    tenantId,
    title: 'Payment Received',
    message: `${guestName} - ₦${amount.toLocaleString()} via ${method}`,
    type: 'payment',
    priority: 'medium',
    soundType: 'alert-high',
    department: 'ACCOUNTS',
    recipients: ['MANAGER', 'ACCOUNTS'],
    referenceType: 'payment',
    referenceId: paymentId,
    actions: ['acknowledge', 'view_details']
  });
}

/**
 * Create maintenance request notification
 */
export async function notifyMaintenanceRequest(
  tenantId: string,
  taskId: string,
  roomNumber: string,
  issue: string,
  priority: NotificationPriority
) {
  return createStaffNotification({
    tenantId,
    title: `Maintenance - Room ${roomNumber}`,
    message: issue,
    type: 'maintenance',
    priority,
    soundType: priority === 'urgent' ? 'alert-critical' : 'alert-high',
    department: 'MAINTENANCE',
    referenceType: 'maintenance_task',
    referenceId: taskId,
    actions: ['acknowledge', 'assign', 'view_details'],
    escalateAfterMinutes: priority === 'urgent' ? 2 : 5
  });
}

/**
 * Create checkout notification
 */
export async function notifyCheckout(
  tenantId: string,
  reservationId: string,
  roomNumber: string,
  guestName: string
) {
  return createStaffNotification({
    tenantId,
    title: `Checkout - Room ${roomNumber}`,
    message: `${guestName} checked out. Room needs cleaning.`,
    type: 'checkout',
    priority: 'medium',
    soundType: 'alert-medium',
    department: 'HOUSEKEEPING',
    recipients: ['HOUSEKEEPING', 'FRONT_DESK'],
    referenceType: 'reservation',
    referenceId: reservationId,
    actions: ['acknowledge', 'assign']
  });
}

/**
 * Create check-in notification
 */
export async function notifyCheckIn(
  tenantId: string,
  reservationId: string,
  roomNumber: string,
  guestName: string
) {
  return createStaffNotification({
    tenantId,
    title: `Check-in - Room ${roomNumber}`,
    message: `${guestName} has checked in.`,
    type: 'checkin',
    priority: 'low',
    soundType: 'alert-medium',
    department: 'FRONT_DESK',
    referenceType: 'reservation',
    referenceId: reservationId,
    actions: ['acknowledge']
  });
}

/**
 * Create critical alert
 */
export async function notifyCriticalAlert(
  tenantId: string,
  title: string,
  message: string,
  department?: string
) {
  return createStaffNotification({
    tenantId,
    title,
    message,
    type: 'alert',
    priority: 'urgent',
    soundType: 'alert-critical',
    department,
    recipients: ['MANAGER', 'OWNER'],
    actions: ['acknowledge', 'view_details'],
    escalateAfterMinutes: 1
  });
}
