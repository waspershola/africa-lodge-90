# 🔔 Notification System Setup - START HERE

## ⚡ Quick Setup (5 Minutes)

Your real-time notification system is **95% complete**! Just 3 simple steps to finish:

---

## Step 1: Get Sound Files (2 minutes)

### Option A: Download from Mixkit (Easiest - No account needed)
1. Go to [Mixkit Notification Sounds](https://mixkit.co/free-sound-effects/notification/)
2. Find and download these sounds:
   - **"Clear notification"** → Rename to `alert-high.mp3`
   - **"Soft notification"** → Rename to `alert-medium.mp3`
   - **"Alert tone"** → Rename to `alert-critical.mp3`
3. Place all 3 files in `public/sounds/` folder

### Option B: Download from Pixabay
1. Visit [Pixabay Notification Sounds](https://pixabay.com/sound-effects/search/notification/)
2. Download 3 suitable sounds
3. Rename and place in `public/sounds/`

### Option C: Use These Free Resources
- [Freesound.org](https://freesound.org/search/?q=notification) - Filter by "CC0" license
- [Zapsplat](https://www.zapsplat.com/sound-effect-category/notifications/) - Free with account
- [SoundBible](https://soundbible.com/) - Public domain sounds

**📋 Sound Requirements:**
- Format: MP3
- alert-high: 2-3 seconds (clear bell/chime)
- alert-medium: 1-1.5 seconds (soft notification)
- alert-critical: 3-4 seconds (urgent alarm)

**📚 Detailed Guide:** See [SOUND_FILES_GUIDE.md](./docs/SOUND_FILES_GUIDE.md)

---

## Step 2: Add Notifications to Your Workflows (2 minutes)

### Quick Example - Guest QR Request:

**Before:**
```typescript
// After creating QR order
const { data: order } = await supabase.from('qr_orders').insert({...}).single();
return { success: true, order };
```

**After:**
```typescript
import { notifyGuestRequest } from '@/utils/notificationHelpers';

// After creating QR order
const { data: order } = await supabase.from('qr_orders').insert({...}).single();

// Add this notification (non-blocking)
notifyGuestRequest(tenantId, order.id, roomNumber, 'food', '2x Breakfast')
  .catch(err => console.error('[Notification]', err));

return { success: true, order };
```

**✅ That's it!** Staff will now get real-time alerts with sound.

### Key Integration Points:
1. ✅ **QR Guest Requests** - Already integrated in `qr-unified-api` edge function
2. ⏳ **New Reservations** - Add when reservation is created
3. ⏳ **Payments** - Add when payment is recorded
4. ⏳ **Maintenance** - Add when task is created
5. ⏳ **Checkout** - Add when guest checks out

**📋 Copy-Paste Code Examples:** See [NOTIFICATION_QUICK_REFERENCE.md](./docs/NOTIFICATION_QUICK_REFERENCE.md)

**📚 Detailed Guide:** See [NOTIFICATION_INTEGRATION_GUIDE.md](./docs/NOTIFICATION_INTEGRATION_GUIDE.md)

---

## Step 3: Test It (1 minute)

1. **Test sounds:**
   ```typescript
   import { soundManager } from '@/utils/soundManager';
   soundManager.play('alert-high');
   ```

2. **Create a test notification:**
   ```typescript
   import { notifyCriticalAlert } from '@/utils/notificationHelpers';
   await notifyCriticalAlert(tenantId, 'Test Alert', 'Testing notification system');
   ```

3. **Open two tabs:**
   - Tab 1: Staff dashboard
   - Tab 2: Create a QR request (already working!)
   - **Expected:** Tab 1 gets notification with sound instantly

---

## ✅ What's Already Done

- ✅ Database tables created (`staff_notifications`, `notification_delivery_log`)
- ✅ Real-time updates enabled (Supabase Realtime)
- ✅ Sound manager system built
- ✅ Notification center UI (bell icon with badge)
- ✅ Network status indicator
- ✅ Auto-escalation cron job (runs every minute)
- ✅ Notification helper functions
- ✅ Example integration in QR API
- ✅ Volume/mute controls
- ✅ Role-based routing
- ✅ Priority-based alerts

---

## 🎯 What You Need to Do

- [ ] Add 3 MP3 files to `public/sounds/`
- [ ] Integrate notifications into remaining workflows (5-10 lines each)
- [ ] Test with real scenarios

---

## 📚 All Documentation

| Document | Purpose |
|----------|---------|
| [PHASE_4_NOTIFICATION_SYSTEM.md](./docs/PHASE_4_NOTIFICATION_SYSTEM.md) | Complete system overview |
| [NOTIFICATION_INTEGRATION_GUIDE.md](./docs/NOTIFICATION_INTEGRATION_GUIDE.md) | Step-by-step integration |
| [SOUND_FILES_GUIDE.md](./docs/SOUND_FILES_GUIDE.md) | How to get/configure sounds |
| [NOTIFICATION_QUICK_REFERENCE.md](./docs/NOTIFICATION_QUICK_REFERENCE.md) | Quick copy-paste examples |
| [NOTIFICATION_INTEGRATION_EXAMPLES.md](./docs/NOTIFICATION_INTEGRATION_EXAMPLES.md) | Real code examples |

---

## 🎵 Sound File Checklist

Place these files in `public/sounds/` (exact names):

```
public/
  sounds/
    ├── alert-high.mp3      (2-3 sec, clear bell, ~80% volume)
    ├── alert-medium.mp3    (1.5 sec, soft chime, ~50% volume)
    └── alert-critical.mp3  (3-4 sec, urgent alarm, 100% volume)
```

---

## 🚀 Integration Priority

### High Priority (Do First)
1. ✅ **QR Guest Requests** - Already done!
2. ⏳ **Payments Received** - High importance
3. ⏳ **Maintenance Urgent** - Critical for operations

### Medium Priority (Do Next)
4. ⏳ **New Reservations** - Good to have
5. ⏳ **Guest Checkout** - Housekeeping coordination

### Low Priority (Optional)
6. ⏳ **Guest Check-in** - Informational only
7. ⏳ **Custom Alerts** - As needed

---

## 🎮 Testing Checklist

- [ ] Sounds play correctly in browser
- [ ] Notification appears in bell icon dropdown
- [ ] Unread count badge shows correctly
- [ ] Toast notification appears
- [ ] Network status indicator works
- [ ] Acknowledge button works
- [ ] Real-time updates across multiple tabs
- [ ] Volume controls work
- [ ] Mute functionality works
- [ ] Escalation happens after timeout

---

## 🆘 Troubleshooting

**Sounds not playing?**
- Ensure MP3 files exist in `public/sounds/`
- Check browser console for 404 errors
- User must interact with page first (click anywhere)
- Check volume/mute settings

**Notifications not appearing?**
- Check browser console for errors
- Verify tenant_id matches
- Check RLS policies in Supabase
- Ensure Realtime is enabled

**Need help?** Check the [Troubleshooting section](./docs/NOTIFICATION_INTEGRATION_GUIDE.md#-troubleshooting) in the Integration Guide.

---

## 🎓 How It Works

1. **Event occurs** (e.g., guest submits QR order)
2. **Notification created** in `staff_notifications` table
3. **Supabase Realtime** broadcasts to all connected staff
4. **React hook** receives notification
5. **Sound plays** (based on priority)
6. **Toast appears** with details
7. **Bell icon updates** with new unread count
8. **Auto-escalation** if not acknowledged in time

---

## 📊 Success Metrics

After setup, you should see:
- ⚡ Instant notifications (<1 second)
- 🔊 Appropriate sounds per priority
- 📱 Works on desktop and mobile
- 🔄 Real-time sync across devices
- 🚨 Auto-escalation for urgent items
- 📈 Staff response time improvements

---

## 🎉 You're Almost There!

Just add those 3 sound files and a few notification calls, and you'll have a **world-class real-time notification system** running in your hotel!

**Questions?** All the details are in the docs linked above.

---

**Next:** Go to [Step 1](#step-1-get-sound-files-2-minutes) and get those sound files! 🎵
