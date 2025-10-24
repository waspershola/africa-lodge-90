# Session Management Testing Guide

## Overview
This guide helps verify the smart session management system is working correctly.

## Test Scenarios

### Scenario 1: First Scan (Baseline)
**Expected**: New session created with device fingerprint

1. Open browser DevTools Console
2. Scan QR code from desktop
3. Look for log: `🔐 [Device Fingerprint] Generated: [fingerprint]`
4. Check session created log: `✅ [Session Management] New session created: [session_id]`

**Verification Query**:
```sql
SELECT 
  session_id,
  device_fingerprint,
  is_active,
  created_at
FROM guest_sessions
ORDER BY created_at DESC
LIMIT 5;
```

Expected: Latest session has a `device_fingerprint` value (not NULL)

---

### Scenario 2: Same Device Rescan (Session Resume)
**Expected**: Session resumed, no new session created

1. Stay in same browser
2. Rescan same QR code
3. Look for log: `✅ [Session Management] SAME device detected - RESUMING session`
4. Verify same `session_id` is used

**Verification Query**:
```sql
SELECT 
  event_type,
  device_fingerprint,
  reason,
  created_at
FROM qr_session_audit
ORDER BY created_at DESC
LIMIT 5;
```

Expected: See `session_resumed` event

---

### Scenario 3: Different Device Scan (Session Invalidation)
**Expected**: Old session invalidated, new session created

1. Open same QR code on mobile device
2. Look for log on mobile: `⚠️ [Session Management] DIFFERENT device detected - INVALIDATING old session`
3. Desktop session should be invalidated

**Verification Query**:
```sql
-- Check for invalidated sessions
SELECT 
  session_id,
  device_fingerprint,
  is_active,
  created_at
FROM guest_sessions
WHERE qr_code_id = 'YOUR_QR_CODE_ID'
ORDER BY created_at DESC;
```

Expected: 
- Desktop session: `is_active = false`
- Mobile session: `is_active = true`

**Audit Log**:
```sql
SELECT 
  event_type,
  LEFT(device_fingerprint, 10) as device,
  reason,
  created_at
FROM qr_session_audit
WHERE qr_code_id = 'YOUR_QR_CODE_ID'
ORDER BY created_at DESC
LIMIT 10;
```

Expected: See both `session_invalidated` and `session_created` events

---

### Scenario 4: Different QR Code (New Session, Keep Old)
**Expected**: New session for new QR, old session remains active

1. On same device, scan a different QR code
2. New session should be created
3. Original QR's session should still be active

**Verification Query**:
```sql
-- Check active sessions for this device
SELECT 
  session_id,
  qr_code_id,
  device_fingerprint,
  is_active,
  created_at
FROM guest_sessions
WHERE device_fingerprint = 'YOUR_FINGERPRINT'
ORDER BY created_at DESC;
```

Expected: Multiple active sessions with same fingerprint but different `qr_code_id`

---

### Scenario 5: Request Visibility (Cross-Session)
**Expected**: See all requests for QR code in last 24h regardless of session

1. Create request on desktop (Session A)
2. Scan from mobile (creates Session B, invalidates Session A)
3. Check "My Requests" panel on mobile
4. Should see request created from desktop

**Verification Query**:
```sql
-- Get all requests for a QR code
SELECT 
  qr.id,
  qr.request_type,
  qr.status,
  qr.created_at,
  gs.session_id,
  gs.is_active as session_active
FROM qr_requests qr
JOIN guest_sessions gs ON qr.session_id = gs.session_id
WHERE gs.qr_code_id = 'YOUR_QR_CODE_ID'
  AND qr.created_at > now() - interval '24 hours'
ORDER BY qr.created_at DESC;
```

Expected: All requests visible, even from inactive sessions

---

## Quick Health Check Query

```sql
-- Overall session health
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN device_fingerprint IS NOT NULL THEN 1 END) as with_fingerprint,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
  COUNT(DISTINCT device_fingerprint) as unique_devices,
  COUNT(DISTINCT qr_code_id) as unique_qr_codes
FROM guest_sessions
WHERE created_at > now() - interval '24 hours';
```

---

## Session Audit History

```sql
-- View session lifecycle for a specific QR code
SELECT * FROM get_qr_session_history('YOUR_QR_CODE_ID', 24);
```

---

## Troubleshooting

### Issue: device_fingerprint is NULL
**Cause**: Edge function not passing fingerprint or validation stripping it out
**Fix**: Check `sanitizeDeviceInfo` in `validation.ts` - ensure 'fingerprint' is in allowedFields

### Issue: Sessions not being invalidated
**Cause**: Fingerprints don't match (browser generated different fingerprint)
**Fix**: Check console logs for fingerprint values, ensure consistency

### Issue: Requests not showing on different device
**Cause**: RLS policy issue or query not fetching by qr_token
**Fix**: Check RLS policies on qr_requests table, verify query uses qr_token not session_id

---

## Expected Console Logs

### On First Scan:
```
🔐 [Device Fingerprint] Generated: [32-char-hash]
📡 [QRPortal] Calling edge function with fingerprint: [32-char-hash]
✅ [Session Management] New session created: [uuid]
💾 Session stored with device fingerprint: {...}
```

### On Rescan (Same Device):
```
🔐 [Device Fingerprint] Generated: [same-32-char-hash]
✅ [Session Management] SAME device detected - RESUMING session
```

### On Different Device Scan:
```
🔐 [Device Fingerprint] Generated: [different-32-char-hash]
⚠️ [Session Management] DIFFERENT device detected - INVALIDATING old session
✅ [Session Management] New session created: [new-uuid]
```

---

## Success Criteria

✅ All new sessions have non-NULL device_fingerprint
✅ Same device rescanning resumes session (audit log shows "session_resumed")
✅ Different device scanning invalidates old session (audit log shows "session_invalidated")
✅ Different QR codes create separate active sessions
✅ Requests visible across sessions for same QR code (24h window)
✅ Real-time updates work on both devices
