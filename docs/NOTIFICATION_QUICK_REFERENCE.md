# 🔔 Notification System Quick Reference

## One-Line Import & Use

```typescript
import { notifyGuestRequest, notifyPaymentReceived, notifyMaintenanceRequest, notifyCriticalAlert } from '@/utils/notificationHelpers';
```

---

## 🚀 Quick Integration Examples

### 1. Guest QR Request
```typescript
// After creating QR order
await notifyGuestRequest(tenantId, qrOrderId, 'Room 305', 'food', '2x Breakfast');
```

### 2. Payment Received
```typescript
// After recording payment
await notifyPaymentReceived(tenantId, paymentId, 'John Doe', 15000, 'Card');
```

### 3. Maintenance Issue
```typescript
// After creating maintenance task
await notifyMaintenanceRequest(tenantId, taskId, 'Room 201', 'AC not working', 'urgent');
```

### 4. Critical Alert
```typescript
// For emergencies
await notifyCriticalAlert(tenantId, 'Fire Alarm', 'Building A evacuation required');
```

---

## 🎵 Sound Types

| Sound Type | Use Case | Duration | Volume |
|------------|----------|----------|--------|
| `alert-high` | Guest requests, payments | 2-3 sec | 80% |
| `alert-medium` | Check-in/out, updates | 1.5 sec | 50% |
| `alert-critical` | Emergencies, escalations | 3-4 sec | 100% |

---

## 📋 Priority Levels

| Priority | Description | Escalation Time | Sound |
|----------|-------------|-----------------|-------|
| `low` | Info only | 10 min | medium |
| `medium` | Standard | 5 min | medium |
| `high` | Important | 3 min | high |
| `urgent` | Critical | 1-2 min | critical |

---

## 🏢 Department Codes

- `FRONT_DESK` - Reception, check-in/out
- `RESTAURANT` - Food & beverage orders
- `HOUSEKEEPING` - Room cleaning, amenities
- `MAINTENANCE` - Repairs, technical issues
- `MANAGER` - Management oversight
- `ACCOUNTS` - Payments, billing
- `OWNER` - Hotel ownership

---

## 🎯 Notification Types

| Type | Used For | Default Priority |
|------|----------|-----------------|
| `reservation` | New bookings | medium |
| `guest_request` | QR orders, service | high |
| `payment` | Payments received | high |
| `maintenance` | Repair requests | variable |
| `checkout` | Guest checkout | medium |
| `checkin` | Guest check-in | low |
| `alert` | Critical alerts | urgent |

---

## 🔧 Custom Notification

```typescript
import { createStaffNotification } from '@/utils/notificationHelpers';

await createStaffNotification({
  tenantId: 'xxx',
  title: 'Custom Alert',
  message: 'Something happened',
  type: 'alert',
  priority: 'high',
  soundType: 'alert-high',
  department: 'FRONT_DESK',
  recipients: ['MANAGER', 'FRONT_DESK'],
  referenceType: 'custom_entity',
  referenceId: 'entity-uuid',
  actions: ['acknowledge', 'view_details'],
  escalateAfterMinutes: 5,
  metadata: { customField: 'value' }
});
```

---

## 🎮 Testing Sounds

```typescript
import { soundManager } from '@/utils/soundManager';

// Test sounds
soundManager.play('alert-high');
soundManager.play('alert-medium');
soundManager.play('alert-critical');

// Adjust volume (0-1)
soundManager.setVolume(0.7);

// Mute/unmute
soundManager.toggleMute();
```

---

## 📱 Using in Components

```typescript
import { useStaffNotifications } from '@/hooks/useStaffNotifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    acknowledgeNotification,
    completeNotification,
    markAllAsRead
  } = useStaffNotifications({
    playSound: true,
    showToast: true
  });

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notif => (
        <div key={notif.id}>
          {notif.title}
          <button onClick={() => acknowledgeNotification(notif.id)}>
            Acknowledge
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚨 Error Handling

```typescript
// Recommended: Don't let notifications block main flow
try {
  // Main operation
  const order = await createOrder(data);
  
  // Non-blocking notification
  notifyGuestRequest(tenantId, order.id, room, type, items)
    .catch(err => console.error('[Notification]', err));
  
  return order;
} catch (error) {
  // Handle main error only
  return { error };
}
```

---

## 📊 Checking Delivery

```sql
-- See recent notifications
SELECT * FROM staff_notifications 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- Check delivery log
SELECT * FROM notification_delivery_log 
WHERE delivered_at > now() - interval '1 hour';
```

---

## 🔗 Quick Links

- [Full Integration Guide](./NOTIFICATION_INTEGRATION_GUIDE.md)
- [Sound Setup Guide](./SOUND_FILES_GUIDE.md)
- [Phase 4 Documentation](./PHASE_4_NOTIFICATION_SYSTEM.md)
- [Example Code](./NOTIFICATION_INTEGRATION_EXAMPLES.md)
