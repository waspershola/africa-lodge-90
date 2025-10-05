# Notification System Integration Examples

This guide shows how to integrate the Phase 4 Notification System into existing hotel operations.

## Quick Start

```typescript
import {
  notifyGuestRequest,
  notifyPaymentReceived,
  notifyCheckout,
  notifyMaintenanceRequest
} from '@/utils/notificationHelpers';
```

## Integration Examples

### 1. QR Order Processing

Add notifications when QR orders are created:

```typescript
// In your QR order creation function
async function handleQROrderSubmission(orderData) {
  // Create the order
  const { data: order } = await supabase
    .from('qr_orders')
    .insert(orderData)
    .select()
    .single();

  // Send notification to staff
  await notifyGuestRequest(
    order.tenant_id,
    order.id,
    order.room_number,
    order.request_type,
    order.items.map(i => i.name).join(', ')
  );

  return order;
}
```

### 2. Payment Processing

Add notifications when payments are received:

```typescript
// In your payment processing function
async function processPayment(paymentData) {
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      ...paymentData,
      status: 'completed'
    })
    .select()
    .single();

  // Notify accounts department
  await notifyPaymentReceived(
    payment.tenant_id,
    payment.id,
    payment.guest_name,
    payment.amount,
    payment.payment_method
  );

  return payment;
}
```

### 3. Check-out Process

Add notifications when guests check out:

```typescript
// In your checkout function
async function handleCheckout(reservationId) {
  const { data: reservation } = await supabase
    .from('reservations')
    .update({
      status: 'checked_out',
      checked_out_at: new Date().toISOString()
    })
    .eq('id', reservationId)
    .select('*, rooms(room_number), guests(first_name, last_name)')
    .single();

  // Update room status
  await supabase
    .from('rooms')
    .update({ status: 'cleaning' })
    .eq('id', reservation.room_id);

  // Notify housekeeping
  await notifyCheckout(
    reservation.tenant_id,
    reservation.id,
    reservation.rooms.room_number,
    `${reservation.guests.first_name} ${reservation.guests.last_name}`
  );

  return reservation;
}
```

### 4. Maintenance Requests

Add notifications when maintenance is requested:

```typescript
// In your maintenance request creation
async function createMaintenanceTask(taskData) {
  const { data: task } = await supabase
    .from('housekeeping_tasks')
    .insert({
      ...taskData,
      task_type: 'maintenance',
      status: 'pending'
    })
    .select('*, rooms(room_number)')
    .single();

  // Notify maintenance department
  await notifyMaintenanceRequest(
    task.tenant_id,
    task.id,
    task.rooms.room_number,
    task.description,
    task.priority // 'low', 'medium', 'high', 'urgent'
  );

  return task;
}
```

### 5. Using the Hook in Components

```typescript
import { useStaffNotifications } from '@/hooks/useStaffNotifications';
import { NetworkStatusIndicator } from '@/components/notifications/NetworkStatusIndicator';
import NotificationCenter from '@/components/notifications/NotificationCenter';

function DashboardHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      
      <div className="flex items-center gap-4">
        {/* Network status indicator */}
        <NetworkStatusIndicator />
        
        {/* Notification bell */}
        <NotificationCenter />
      </div>
    </header>
  );
}
```

### 6. Custom Notification with Actions

For more complex scenarios:

```typescript
import { createStaffNotification } from '@/utils/notificationHelpers';

// Create a custom notification with specific actions
async function notifySpecialRequest(tenantId, orderId, details) {
  await createStaffNotification({
    tenantId,
    title: 'Special Guest Request',
    message: `VIP guest requires ${details}`,
    type: 'guest_request',
    priority: 'urgent',
    soundType: 'alert-critical',
    department: 'MANAGER',
    recipients: ['MANAGER', 'FRONT_DESK'],
    referenceType: 'qr_order',
    referenceId: orderId,
    actions: ['acknowledge', 'assign', 'escalate', 'view_details'],
    escalateAfterMinutes: 2,
    metadata: {
      vip_guest: true,
      special_requirements: details
    }
  });
}
```

### 7. Batch Notifications

Create multiple notifications efficiently:

```typescript
async function notifyEndOfShift(tenantId, shiftSummary) {
  const notifications = [
    // Notify manager about shift summary
    createStaffNotification({
      tenantId,
      title: 'Shift Summary',
      message: `${shiftSummary.orders} orders, ₦${shiftSummary.revenue} revenue`,
      type: 'alert',
      priority: 'low',
      soundType: 'none',
      recipients: ['MANAGER'],
      actions: ['acknowledge']
    }),
    
    // Notify next shift about pending tasks
    createStaffNotification({
      tenantId,
      title: 'Pending Tasks Handover',
      message: `${shiftSummary.pendingTasks} tasks need attention`,
      type: 'alert',
      priority: 'medium',
      soundType: 'alert-medium',
      department: 'FRONT_DESK',
      actions: ['acknowledge', 'view_details']
    })
  ];

  await Promise.all(notifications);
}
```

### 8. Sound Control

Manage sound preferences:

```typescript
import { soundManager } from '@/utils/soundManager';

function NotificationSettings() {
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundManager.setVolume(newVolume);
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div>
      <Slider
        value={[volume]}
        onValueChange={([v]) => handleVolumeChange(v)}
        max={1}
        step={0.1}
      />
      <Button onClick={handleToggleMute}>
        {isMuted ? 'Unmute' : 'Mute' }
      </Button>
    </div>
  );
}
```

### 9. Testing Notifications

Create test notifications:

```typescript
// For testing during development
async function createTestNotification(tenantId: string) {
  await createStaffNotification({
    tenantId,
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'alert',
    priority: 'high',
    soundType: 'alert-high',
    actions: ['acknowledge'],
    escalateAfterMinutes: 1
  });
}
```

### 10. Listening for Specific Notification Types

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

function usePaymentNotifications(tenantId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`payment_notifications_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const notification = payload.new;
          
          // Only handle payment notifications
          if (notification.notification_type === 'payment') {
            // Custom handling for payment notifications
            console.log('New payment notification:', notification);
            
            // Could trigger specific UI updates
            // refresh payment dashboard, etc.
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);
}
```

## Best Practices

### 1. Priority Assignment
- **Urgent**: Emergency situations, critical system alerts
- **High**: Guest requests, time-sensitive tasks
- **Medium**: Standard operations, check-ins/outs
- **Low**: Informational updates, summaries

### 2. Sound Selection
- **alert-critical**: Emergencies only (fire, security breach)
- **alert-high**: Important guest requests, urgent maintenance
- **alert-medium**: Standard operations, routine updates
- **none**: Background updates, logs

### 3. Escalation Times
- **1 minute**: Critical emergencies
- **2-3 minutes**: Urgent guest requests
- **5 minutes**: Standard tasks (default)
- **10+ minutes**: Low priority items

### 4. Department Routing
Always specify the correct department for proper routing:
- `FRONT_DESK`: Reservations, check-ins, check-outs
- `RESTAURANT`: Food and beverage orders
- `HOUSEKEEPING`: Cleaning, room service
- `MAINTENANCE`: Repairs, technical issues
- `MANAGER`: Escalations, reports
- `ACCOUNTS`: Payments, financial

### 5. Actions Array
Include appropriate actions based on notification type:
- `acknowledge`: Mark as seen
- `complete`: Mark as done and remove
- `assign`: Assign to specific staff
- `view_details`: Navigate to related page
- `escalate`: Manually escalate

## Troubleshooting

### Notifications Not Appearing
1. Check if user is authenticated
2. Verify tenant ID is correct
3. Check RLS policies
4. Verify real-time is enabled for the table
5. Check browser console for errors

### Sound Not Playing
1. Ensure sound files exist in `public/sounds/`
2. Check if browser has autoplay enabled
3. Verify user has interacted with page (required for audio)
4. Check if muted or quiet hours enabled
5. Test with `soundManager.play('alert-high')`

### Escalation Not Working
1. Verify cron job is set up correctly
2. Check edge function logs
3. Verify `escalate_after_minutes` is set
4. Check if notification status is 'pending'

## Additional Resources

- [Phase 4 Documentation](./PHASE_4_NOTIFICATION_SYSTEM.md)
- [Sound Manager API](../src/utils/soundManager.ts)
- [Notification Helpers API](../src/utils/notificationHelpers.ts)
- [Hook API Reference](../src/hooks/useStaffNotifications.ts)

---

**Need Help?** Check the console logs for detailed debugging information. All notification operations are logged with the `[NotificationHelper]` prefix.
