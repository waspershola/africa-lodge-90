# Notification System Integration Guide

## 🎯 Quick Start Integration

This guide shows you exactly where to add notification calls in your existing workflows.

## 📍 Integration Points

### 1. **QR Guest Requests** (High Priority)

**File**: `supabase/functions/qr-guest-portal/index.ts` (or wherever QR orders are created)

**When**: Guest submits a service request via QR code

**Add after order creation**:
```typescript
import { notifyGuestRequest } from '@/utils/notificationHelpers';

// After creating qr_order in database
await notifyGuestRequest(
  tenantId,
  qrOrderId,
  roomNumber,
  requestType, // 'food', 'housekeeping', 'maintenance', etc.
  itemsDescription // e.g., "2x Breakfast, 1x Coffee"
);
```

**Priority**: HIGH - Guests are waiting
**Sound**: alert-high (urgent bell)
**Department**: RESTAURANT or HOUSEKEEPING (based on request type)

---

### 2. **New Reservations** (Medium Priority)

**File**: Where reservations are created (Front Desk or Online Booking)

**When**: New reservation is confirmed

**Add after reservation creation**:
```typescript
import { notifyNewReservation } from '@/utils/notificationHelpers';

await notifyNewReservation(
  tenantId,
  reservationId,
  guestName,
  roomNumber,
  checkInDate
);
```

**Priority**: MEDIUM
**Sound**: alert-medium (soft chime)
**Department**: FRONT_DESK

---

### 3. **Payment Received** (High Priority)

**File**: Where payments are recorded (POS or Front Desk)

**When**: Payment is verified and recorded

**Add after payment creation**:
```typescript
import { notifyPaymentReceived } from '@/utils/notificationHelpers';

await notifyPaymentReceived(
  tenantId,
  paymentId,
  guestName,
  amount,
  paymentMethod // 'Card', 'Cash', 'Transfer', etc.
);
```

**Priority**: HIGH
**Sound**: alert-high (urgent bell)
**Department**: ACCOUNTS + MANAGER

---

### 4. **Maintenance Requests** (Variable Priority)

**File**: Where maintenance tasks are created

**When**: Maintenance issue is reported

**Add after task creation**:
```typescript
import { notifyMaintenanceRequest } from '@/utils/notificationHelpers';

await notifyMaintenanceRequest(
  tenantId,
  taskId,
  roomNumber,
  issueDescription,
  priority // 'low', 'medium', 'high', 'urgent'
);
```

**Priority**: Variable (based on issue severity)
**Sound**: alert-critical (if urgent) or alert-high
**Department**: MAINTENANCE

---

### 5. **Guest Checkout** (Medium Priority)

**File**: Checkout process handler

**When**: Guest checks out

**Add after checkout**:
```typescript
import { notifyCheckout } from '@/utils/notificationHelpers';

await notifyCheckout(
  tenantId,
  reservationId,
  roomNumber,
  guestName
);
```

**Priority**: MEDIUM
**Sound**: alert-medium
**Department**: HOUSEKEEPING + FRONT_DESK

---

### 6. **Guest Check-in** (Low Priority)

**File**: Check-in process handler

**When**: Guest completes check-in

**Add after check-in**:
```typescript
import { notifyCheckIn } from '@/utils/notificationHelpers';

await notifyCheckIn(
  tenantId,
  reservationId,
  roomNumber,
  guestName
);
```

**Priority**: LOW
**Sound**: alert-medium
**Department**: FRONT_DESK

---

### 7. **Critical Alerts** (Urgent Priority)

**File**: Emergency or system alerts

**When**: Critical situation detected

**Add when critical event occurs**:
```typescript
import { notifyCriticalAlert } from '@/utils/notificationHelpers';

await notifyCriticalAlert(
  tenantId,
  'Fire Alarm Activated',
  'Fire alarm activated in Building A, Floor 3',
  'MAINTENANCE' // optional department
);
```

**Priority**: URGENT
**Sound**: alert-critical (long buzzer + vibration)
**Department**: MANAGER + OWNER (all management)

---

## 🔧 Implementation Checklist

### For Each Integration Point:

1. ✅ Import the appropriate notification helper function
2. ✅ Call it **after** the database operation succeeds (inside try/catch)
3. ✅ Use `.catch()` or `try/catch` to prevent notification failures from breaking main flow
4. ✅ Log any notification errors for debugging

### Example Pattern:
```typescript
try {
  // Main operation (e.g., create order)
  const { data: order, error } = await supabase
    .from('qr_orders')
    .insert({ ... })
    .select()
    .single();
  
  if (error) throw error;
  
  // Send notification (don't let it block the main flow)
  notifyGuestRequest(tenantId, order.id, roomNumber, requestType, items)
    .catch(err => console.error('[Notification] Failed to send:', err));
  
  return { success: true, order };
} catch (error) {
  console.error('[Main] Operation failed:', error);
  return { success: false, error };
}
```

---

## 🎵 Sound File Requirements

### Replace the placeholder files in `public/sounds/`:

1. **`alert-high.mp3`**
   - Duration: 2-3 seconds
   - Type: Clear digital bell or chime
   - Volume: ~80% of max
   - Use case: Urgent tasks (guest requests, payments)
   - **Recommendation**: Download from [Mixkit - Bell Sounds](https://mixkit.co/free-sound-effects/bell/) or [Pixabay - Notification Sounds](https://pixabay.com/sound-effects/search/notification/)

2. **`alert-medium.mp3`**
   - Duration: 1-1.5 seconds
   - Type: Soft notification chime
   - Volume: ~50% of max
   - Use case: Informational updates (check-in, check-out)
   - **Recommendation**: Search for "gentle notification" on Pixabay

3. **`alert-critical.mp3`**
   - Duration: 3-4 seconds
   - Type: Urgent alarm/buzzer tone
   - Volume: 100% (full volume)
   - Use case: Emergencies, escalated notifications
   - **Recommendation**: Search for "alarm" or "emergency alert" on Freesound.org

### Free Sound Resources:
- [Mixkit](https://mixkit.co/free-sound-effects/) - No attribution required
- [Pixabay](https://pixabay.com/sound-effects/) - Free for commercial use
- [Freesound.org](https://freesound.org/) - Check individual licenses

---

## 🔄 Cron Job Status

✅ **Auto-escalation cron job is already set up!**

The system will automatically escalate unacknowledged notifications every minute. No additional action needed.

---

## 🧪 Testing Your Integrations

### 1. Test Sound System
```typescript
import { soundManager } from '@/utils/soundManager';

// Test each sound
soundManager.play('alert-high');
soundManager.play('alert-medium');
soundManager.play('alert-critical');
```

### 2. Test Notification Creation
Create a test notification manually:
```typescript
import { createStaffNotification } from '@/utils/notificationHelpers';

await createStaffNotification({
  tenantId: 'your-tenant-id',
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'alert',
  priority: 'high',
  soundType: 'alert-high',
  department: 'FRONT_DESK'
});
```

### 3. Verify Real-time Updates
- Open two browser tabs with different staff users
- Create a notification from one tab
- Verify it appears instantly in the other tab with sound

---

## 🎨 UI Components Already Available

The following are already built and ready:
- ✅ Bell icon with unread badge in navbar
- ✅ Dropdown notification list
- ✅ Network status indicator (online/offline/syncing)
- ✅ Volume/mute controls in notification settings
- ✅ Mark all as read functionality
- ✅ Acknowledge/Complete actions
- ✅ Priority-based color coding

---

## 📊 Monitoring & Analytics

Track notification effectiveness:
1. Check `staff_notifications` table for acknowledgment times
2. Review `notification_delivery_log` for delivery status
3. Monitor `escalated_at` timestamps to identify response time issues
4. Use audit logs to track staff response patterns

---

## 🚨 Troubleshooting

### Notifications not appearing?
1. Check browser console for errors
2. Verify Supabase Realtime is enabled for `staff_notifications` table
3. Ensure user's `tenant_id` matches the notification's `tenant_id`
4. Check RLS policies on `staff_notifications` table

### Sounds not playing?
1. Verify sound files exist in `public/sounds/`
2. Check browser audio permissions
3. Ensure user has interacted with the page (Chrome requires user gesture)
4. Check volume/mute settings in notification preferences

### Escalation not working?
1. Verify cron job is running in Supabase
2. Check edge function logs for errors
3. Ensure `pg_cron` and `pg_net` extensions are enabled

---

## 📝 Next Steps

1. ✅ Replace placeholder sound files (see recommendations above)
2. ✅ Add notification calls to your most critical workflows first:
   - QR guest requests (highest priority)
   - Payments received
   - Maintenance requests
3. ✅ Test with real user scenarios
4. ✅ Monitor and adjust escalation times based on staff response patterns
5. ✅ Consider adding email/SMS notifications for escalated alerts

---

**Need Help?** Check `docs/PHASE_4_NOTIFICATION_SYSTEM.md` for complete documentation.
