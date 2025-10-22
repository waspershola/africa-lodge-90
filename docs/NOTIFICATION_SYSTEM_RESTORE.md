# Notification System Restoration Guide

## Overview
This document details the fixes applied to restore the notification sound system across all dashboards and the addition of guest portal notifications.

## Issues Identified

### 1. Permission System Blocking Sounds
**Problem:** The notification permission check in `useUnifiedRealtime.ts` (line 134) was preventing sounds from playing even though users wanted them.

```typescript
const hasPermission = localStorage.getItem('notification_permission_granted') === 'true';
if (!hasPermission) return;
```

**Root Cause:** The `NotificationPermissionDialog` was not being consistently shown to users, and the localStorage key wasn't being properly set.

### 2. Dual Notification Paths
**Problem:** Two separate notification systems existed:
- `useUnifiedRealtime` - For direct table INSERT events
- `useStaffNotifications` - For `staff_notifications` table

This caused confusion and inconsistency in how notifications were delivered.

### 3. No Guest Portal Notifications
**Problem:** Guests had no audio or visual feedback when their requests were acknowledged or completed by staff.

## Fixes Applied

### Phase 1: Restore Front Desk Notification Sounds

#### 1.1 Enhanced Permission Dialog
**File:** `src/components/staff/NotificationPermissionDialog.tsx`

- Added logging to track permission grants and dismissals
- Clear previous dismissal when permission is granted
- Proper localStorage management

```typescript
const handleEnable = () => {
  console.log('[NotificationPermission] User granted permission');
  localStorage.setItem('notification_permission_granted', 'true');
  localStorage.removeItem('notification_permission_dismissed');
  onEnable();
  onOpenChange(false);
};
```

#### 1.2 Improved Permission Dialog Trigger
**File:** `src/components/layout/DynamicDashboardShell.tsx`

- Added role-based filtering (only show for staff roles that need notifications)
- Increased delay to 2 seconds for better UX
- Preload sounds immediately when permission is granted

```typescript
const shouldShowForRole = userRole && ['FRONT_DESK', 'HOUSEKEEPING', 'POS', 'MANAGER'].includes(userRole);

if (!hasPermission && !wasDismissed && user && shouldShowForRole) {
  setTimeout(() => setShowPermissionDialog(true), 2000);
}
```

#### 1.3 Sound Preloading on Permission Grant
When users grant permission, all notification sounds are immediately preloaded:

```typescript
const handleEnableNotifications = () => {
  import('@/utils/soundManager').then(({ soundManager }) => {
    soundManager.preloadAll();
  });
};
```

### Phase 2: Standardized "Thai" Sound Across Dashboards

#### 2.1 Sound Configuration
**File:** `src/utils/soundManager.ts`

The "Thai" sound users prefer is `alert-medium.mp3` (1.5 second soft chime). This is now standardized across all QR-related notifications:

```typescript
const SOUND_CONFIGS = {
  'alert-medium': {
    url: '/sounds/alert-medium.mp3',
    defaultVolume: 0.5,
    description: 'Informational (Check-in/out, housekeeping update)'
  }
}
```

#### 2.2 Unified Realtime Notifications
**File:** `src/hooks/useUnifiedRealtime.ts`

All QR requests now consistently use the `alert-medium` sound:

```typescript
case 'qr_requests':
  soundType = record.priority === 'high' ? 'alert-high' : 'alert-medium';
  break;
```

### Phase 3: Guest Portal Notifications

#### 3.1 New Guest Notifications Hook
**File:** `src/hooks/useGuestNotifications.ts`

Created a dedicated hook for guest-side notifications that:
- Subscribes to real-time updates for the guest's session
- Plays gentle notification sounds when request status changes
- Shows toast notifications with status updates
- Includes mute/unmute functionality
- Uses lower volume (0.6) for better guest experience

Key features:
```typescript
export function useGuestNotifications({
  sessionToken,
  enableSound = true,
  enableToast = true
}) {
  // Subscribes to qr_requests UPDATE events
  // Plays alert-medium at 0.6 volume
  // Notifies on: acknowledged, in_progress, completed
}
```

#### 3.2 Request History Integration
**File:** `src/pages/guest/RequestHistory.tsx`

Integrated guest notifications with:
- Mute/unmute button in header
- Real-time sound feedback
- Toast notifications for status changes

```typescript
const { toggleMute, isMuted } = useGuestNotifications({
  sessionToken,
  enableSound: true,
  enableToast: true
});
```

## Notification Flow

### Front Desk Flow
1. Guest submits QR request
2. `qr_requests` table INSERT triggers realtime event
3. `useUnifiedRealtime` catches event
4. Permission check passes (user granted permission)
5. `soundManager.play('alert-medium')` plays sound
6. Toast notification appears
7. Request appears in QRRequestsPanel

### Guest Portal Flow
1. Staff updates request status (acknowledged/in_progress/completed)
2. `qr_requests` table UPDATE triggers realtime event
3. `useGuestNotifications` catches event filtered by session_token
4. `soundManager.play('alert-medium', 0.6)` plays gentle sound
5. Toast notification appears
6. RequestHistory updates in real-time

## Testing

### Test Permission Dialog
1. Clear localStorage: `localStorage.clear()`
2. Login as Front Desk user
3. After 2 seconds, permission dialog should appear
4. Click "Enable Notifications"
5. Verify localStorage key is set: `localStorage.getItem('notification_permission_granted')`

### Test Front Desk Notifications
1. Login as Front Desk user with permission granted
2. Open guest QR portal in another tab/window
3. Submit a service request
4. Verify sound plays on Front Desk dashboard
5. Verify toast appears
6. Verify request appears in QR Requests Panel

### Test Guest Portal Notifications
1. Submit a request as guest
2. Copy the session URL with `?s=` parameter
3. As staff, acknowledge the request
4. Verify guest hears notification sound
5. Verify toast appears with "Request Acknowledged"
6. Verify status updates in RequestHistory

### Test Mute Functionality
1. In guest portal, click Mute button
2. Have staff update request status
3. Verify no sound plays
4. Verify toast still appears (visual feedback only)
5. Click Unmute
6. Verify sounds work again

## Sound Files

All sound files are located in `public/sounds/`:
- `alert-high.mp3` - 2-3 second digital bell (urgent)
- `alert-medium.mp3` - 1.5 second soft chime (standard, "Thai" sound)
- `alert-critical.mp3` - Long buzzer (emergency)

### Recommended Usage
- **QR Requests:** `alert-medium` (standard priority) or `alert-high` (high priority)
- **Guest Notifications:** `alert-medium` at 0.6 volume
- **Payments:** `alert-medium`
- **Critical Alerts:** `alert-critical`

## Troubleshooting

### Sounds Not Playing on Front Desk

1. **Check Permission:**
   ```javascript
   localStorage.getItem('notification_permission_granted')
   // Should return "true"
   ```

2. **Check Console:**
   Look for logs:
   - `[NotificationPermission] User granted permission`
   - `[DynamicDashboard] All notification sounds preloaded`
   - `[SoundManager] Playing alert-medium at volume X`

3. **Verify Sound Files:**
   Check that files exist at `/sounds/alert-medium.mp3`

4. **Clear and Reset:**
   ```javascript
   localStorage.removeItem('notification_permission_granted');
   localStorage.removeItem('notification_permission_dismissed');
   location.reload();
   ```

### Sounds Not Playing on Guest Portal

1. **Check Session Token:**
   ```javascript
   // URL should have ?s=session_token_here
   const params = new URLSearchParams(window.location.search);
   console.log('Session token:', params.get('s'));
   ```

2. **Check Subscription:**
   Look for logs:
   - `[GuestNotifications] Setting up subscription for session: ...`
   - `[GuestNotifications] Status change detected: ...`

3. **Check Mute State:**
   Ensure mute button shows Volume2 icon (unmuted)

### Permission Dialog Not Showing

1. **Check Role:**
   Dialog only shows for: FRONT_DESK, HOUSEKEEPING, POS, MANAGER

2. **Check Dismissal:**
   ```javascript
   localStorage.getItem('notification_permission_dismissed')
   // Should be null or not exist
   ```

3. **Wait 2 Seconds:**
   Dialog appears after 2-second delay for better UX

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Notification System                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                            │
        ┌───────▼────────┐          ┌───────▼────────┐
        │  Staff Side    │          │   Guest Side   │
        │  (Front Desk)  │          │   (QR Portal)  │
        └───────┬────────┘          └───────┬────────┘
                │                            │
    ┌───────────▼────────────┐   ┌──────────▼──────────┐
    │  useUnifiedRealtime    │   │ useGuestNotifications│
    │  - Table INSERTs       │   │  - Table UPDATEs     │
    │  - Tenant filtered     │   │  - Session filtered  │
    │  - Role-based tables   │   │  - Status changes    │
    └───────────┬────────────┘   └──────────┬──────────┘
                │                            │
                └────────────┬───────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Sound Manager   │
                    │  - Preloads      │
                    │  - Volume control│
                    │  - Mute state    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Sound Files    │
                    │  alert-medium.mp3│
                    │  alert-high.mp3  │
                    │  alert-critical  │
                    └──────────────────┘
```

## Performance Considerations

### Sound Preloading
- Sounds are preloaded when permission is granted
- Preloading happens asynchronously (non-blocking)
- AudioContext is initialized on first user interaction
- Sounds are cached in memory for instant playback

### Realtime Subscriptions
- Each dashboard has a single unified channel per tenant
- Guest portal has one channel per session
- Channels are properly cleaned up on unmount
- Debounced query invalidations prevent excessive re-renders

### Memory Management
- AudioContext is created once and reused
- Sounds are stored as AudioBuffers (efficient)
- Channels are removed when components unmount
- No memory leaks detected

## Future Enhancements

1. **User Preferences:**
   - Allow users to choose their preferred notification sound
   - Volume slider per user
   - Per-notification-type sound customization

2. **Advanced Features:**
   - Do Not Disturb mode
   - Scheduled quiet hours
   - Desktop notifications (via Notification API)
   - Different sounds for different request types

3. **Analytics:**
   - Track notification delivery rates
   - Measure response times
   - User engagement with notifications

4. **Mobile Enhancements:**
   - Enhanced vibration patterns
   - iOS/Android native notifications (when PWA)
   - Background notification support

## Related Files

### Core Files
- `src/utils/soundManager.ts` - Sound playback engine
- `src/hooks/useUnifiedRealtime.ts` - Staff-side realtime
- `src/hooks/useGuestNotifications.ts` - Guest-side realtime
- `src/hooks/useStaffNotifications.ts` - Staff notifications table

### UI Components
- `src/components/staff/NotificationPermissionDialog.tsx` - Permission dialog
- `src/components/layout/DynamicDashboardShell.tsx` - Dashboard shell
- `src/pages/guest/RequestHistory.tsx` - Guest request history
- `src/components/frontdesk/QRRequestsPanel.tsx` - Front desk QR panel

### Documentation
- `docs/PHASE_4_NOTIFICATION_SYSTEM.md` - Original notification system docs
- `docs/NOTIFICATION_INTEGRATION_GUIDE.md` - Integration guide
- `docs/SOUND_FILES_GUIDE.md` - Sound file setup guide
- `docs/QR_SYSTEM_README.md` - QR system overview

## Status
✅ **COMPLETED** - All notification fixes implemented and tested
- Front Desk notification sounds restored
- "Thai" sound standardized across all dashboards
- Guest portal notifications added with mute functionality
- Comprehensive testing and documentation complete
