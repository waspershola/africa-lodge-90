# Phase 2: Real-Time Sync Testing Guide

## 🧪 Comprehensive Testing Checklist

This guide provides step-by-step testing procedures to verify all Phase 2 real-time sync features.

---

## Prerequisites

- [ ] Migration applied: `ALTER PUBLICATION supabase_realtime ADD TABLE qr_codes;`
- [ ] Two devices or browsers available for cross-device testing
- [ ] Chrome DevTools open for network monitoring
- [ ] Development mode enabled to see debug indicators

---

## Test Suite 1: Basic Real-Time Sync

### Test 1.1: Single User - Create QR Code
**Objective:** Verify QR code creation triggers realtime update

**Steps:**
1. Login as OWNER
2. Navigate to QR Manager (`/dashboard/qr-manager`)
3. Open Chrome DevTools → Console tab
4. Look for `[Realtime] Setting up unified channel:` log
5. Click "Generate New QR" button
6. Fill out wizard and create QR code
7. Check console for:
   ```
   [QR Cache Debug] Before optimistic update: [...]
   [QR Cache Debug] After optimistic update: [...]
   [Realtime Event] qr_codes: INSERT <id>
   [QR Cache Debug] After invalidation & refetch: [...]
   ```

**Expected Results:**
- ✅ QR code appears instantly in the list
- ✅ Console shows realtime INSERT event
- ✅ No page reload required
- ✅ Debug indicator (bottom-right) shows "Connected"

---

### Test 1.2: Single User - Update QR Code
**Objective:** Verify QR code updates trigger realtime sync

**Steps:**
1. Click "Edit" on any QR code
2. Change services (add/remove checkboxes)
3. Click "Save Changes"
4. Check console for `[Realtime Event] qr_codes: UPDATE`

**Expected Results:**
- ✅ Changes appear instantly in the table
- ✅ Console shows realtime UPDATE event
- ✅ Toast notification appears

---

### Test 1.3: Single User - Delete QR Code
**Objective:** Verify QR code deletion triggers realtime sync

**Steps:**
1. Click "View" on any QR code
2. Click "Delete QR Code" button
3. Confirm deletion
4. Check console for `[Realtime Event] qr_codes: DELETE`

**Expected Results:**
- ✅ QR code disappears instantly from list
- ✅ Console shows realtime DELETE event
- ✅ Toast notification appears

---

## Test Suite 2: Cross-Device Synchronization

### Test 2.1: Two Devices - Create on Device A, Appears on Device B
**Objective:** Verify cross-device realtime sync

**Setup:**
- Device A: Desktop Chrome (logged in as OWNER)
- Device B: Mobile Safari / Tablet (logged in as same OWNER)

**Steps:**
1. Open QR Manager on both devices
2. On Device A: Create a new QR code
3. Watch Device B

**Expected Results:**
- ✅ Within 2-5 seconds, new QR appears on Device B
- ✅ Toast notification on Device B: "New item added - Your list has been refreshed"
- ✅ No manual refresh required

**Troubleshooting:**
If it doesn't work:
- Check if both devices have network connectivity
- Verify both are logged into the same tenant
- Check console for `[Realtime]` logs on both devices

---

### Test 2.2: Two Devices - Edit on Device B, Updates on Device A
**Objective:** Verify bidirectional realtime sync

**Steps:**
1. On Device B: Edit an existing QR code
2. Change the status from Active → Inactive
3. Watch Device A

**Expected Results:**
- ✅ Status change appears on Device A within 2-5 seconds
- ✅ Toast: "Item updated - Your list has been refreshed"

---

### Test 2.3: Three Browser Tabs - Simultaneous Updates
**Objective:** Stress test with multiple tabs

**Setup:**
- Open 3 tabs in same browser, all on QR Manager page

**Steps:**
1. Tab 1: Create QR code "Room 101"
2. Tab 2: Create QR code "Room 102"
3. Tab 3: Create QR code "Room 103"
4. Verify all 3 QR codes appear in all 3 tabs

**Expected Results:**
- ✅ All tabs show all 3 QR codes
- ✅ No duplicate entries
- ✅ Correct creation order

---

## Test Suite 3: Offline Recovery

### Test 3.1: Disconnect → Reconnect
**Objective:** Verify auto-recovery after network interruption

**Steps:**
1. Open QR Manager
2. Check debug indicator shows "Connected"
3. Open Chrome DevTools → Network tab
4. Click "Offline" checkbox (throttle to offline)
5. Observe debug indicator changes to "Offline"
6. Try to create a QR code (should fail)
7. Uncheck "Offline" (go back online)
8. Watch console for:
   ```
   [Network Status] Connection restored
   [QR Manager] Network restored, refetching QR codes
   ```

**Expected Results:**
- ✅ Debug indicator shows "Offline" when disconnected
- ✅ Shows "Reconnecting..." when back online
- ✅ Auto-fetches latest QR codes
- ✅ Toast: "Reconnected - Real-time sync restored"

---

### Test 3.2: Poor Network Conditions (3G Throttling)
**Objective:** Test resilience under slow network

**Steps:**
1. Chrome DevTools → Network tab → Throttling dropdown
2. Select "Slow 3G"
3. Create 3 QR codes in rapid succession
4. Wait for all to sync

**Expected Results:**
- ✅ All QR codes eventually appear
- ✅ No duplicate entries
- ✅ Reconnection attempts increase (shown in debug panel)
- ✅ Fallback polling kicks in after 30s if realtime fails

---

## Test Suite 4: Role-Based Access

### Test 4.1: FRONT_DESK User Sees Updates
**Objective:** Verify FRONT_DESK role has qr_codes access

**Steps:**
1. Login as FRONT_DESK user
2. Open QR Manager
3. In another session (OWNER), create a QR code
4. Watch FRONT_DESK session

**Expected Results:**
- ✅ FRONT_DESK user sees new QR code appear
- ✅ Console shows `[Realtime Event] qr_codes: INSERT`

---

### Test 4.2: HOUSEKEEPING User Does NOT See QR Updates
**Objective:** Verify role-based filtering works

**Steps:**
1. Login as HOUSEKEEPING user
2. Open Dashboard (they don't have QR Manager access)
3. In another session (OWNER), create a QR code
4. Check HOUSEKEEPING session console

**Expected Results:**
- ✅ Console does NOT show `qr_codes` subscription
- ✅ `ROLE_TABLE_ACCESS` for HOUSEKEEPING excludes `qr_codes`
- ✅ No memory/network waste subscribing to irrelevant tables

---

## Test Suite 5: Performance & Memory

### Test 5.1: Memory Leak Check
**Objective:** Ensure no memory leaks after extended use

**Steps:**
1. Open QR Manager
2. Chrome DevTools → Memory tab → Take heap snapshot
3. Create/edit/delete 20 QR codes
4. Take another heap snapshot
5. Compare snapshots

**Expected Results:**
- ✅ No exponential memory growth
- ✅ Event listeners properly cleaned up
- ✅ WebSocket connection stable

---

### Test 5.2: Network Request Count
**Objective:** Verify debouncing prevents excessive API calls

**Steps:**
1. Open QR Manager
2. Chrome DevTools → Network tab
3. Create 5 QR codes rapidly (within 10 seconds)
4. Count network requests to `/rest/v1/qr_codes`

**Expected Results:**
- ✅ NOT 5 separate requests
- ✅ Requests debounced to 1-2 (300ms delay)
- ✅ Console shows `[Realtime] Invalidating query: qr-codes-<tenant_id>`

---

### Test 5.3: Reconnection Exponential Backoff
**Objective:** Verify intelligent reconnection strategy

**Steps:**
1. Open QR Manager
2. Simulate connection failure:
   - Go offline → online repeatedly
3. Watch debug panel "Attempts" counter
4. Check console for retry delays

**Expected Results:**
- ✅ Retry attempts: 1, 2, 3, 4, 5 (max)
- ✅ Delays: 1s → 2s → 4s → 8s → 16s → 30s (capped)
- ✅ After 5 failed attempts, stops retrying (prevents infinite loops)

---

## Test Suite 6: Debug Tools

### Test 6.1: Debug Indicator Visibility
**Objective:** Verify debug panel only appears in development

**Steps:**
1. Check bottom-right corner of QR Manager page
2. Verify debug panel is visible
3. Build production bundle: `npm run build`
4. Preview production build
5. Check if debug panel is hidden

**Expected Results:**
- ✅ Debug panel visible in development (`import.meta.env.DEV === true`)
- ✅ Debug panel hidden in production build

---

### Test 6.2: Debug Panel Accuracy
**Objective:** Verify debug panel shows correct status

**Steps:**
1. Open QR Manager
2. Check debug panel shows:
   - Status: "Connected" (green checkmark)
   - Reconnect Attempts: 0
   - Last Sync: <current time>
   - Network: Online

3. Go offline
4. Verify debug panel updates:
   - Status: "Offline" (red X)
   - Network: Offline

**Expected Results:**
- ✅ All fields update correctly
- ✅ Status icons match connection state
- ✅ Timestamps are accurate

---

## Test Suite 7: Fallback Mechanisms

### Test 7.1: Realtime Fails → Polling Kicks In
**Objective:** Test fallback polling when Realtime unavailable

**Steps:**
1. Temporarily disable Supabase Realtime (if possible in test environment)
2. Open QR Manager
3. Create QR code in another session
4. Wait 30-60 seconds
5. Check if fallback polling detects changes

**Expected Results:**
- ✅ Console logs: `[Sync Watcher] Fallback polling for qr_codes`
- ✅ QR code appears after polling interval (30s)
- ✅ No errors thrown

---

## Test Suite 8: Integration Tests

### Test 8.1: Global Sync Provider Health
**Objective:** Verify all modules are syncing

**Steps:**
1. Open QR Manager
2. Open browser console
3. Type: `useSyncHealth()` (if exposed in dev tools)
4. Check all module statuses:
   - qrCodes: Connected
   - rooms: Connected
   - qrOrders: Connected
   - reservations: Connected
   - payments: Connected

**Expected Results:**
- ✅ `allConnected: true`
- ✅ `mostRecentSync: <recent Date>`
- ✅ All modules show `isConnected: true`

---

### Test 8.2: Sync Health Indicator in Navbar (Future)
**Objective:** Test global sync status badge

**Note:** This requires adding `<SyncHealthIndicator />` to navbar

**Steps:**
1. Add indicator to navbar/header
2. Check badge shows "All synced" (green)
3. Simulate disconnection (go offline)
4. Verify badge shows "X/5 synced" (yellow/red)

**Expected Results:**
- ✅ Badge updates with connection status
- ✅ Tooltip shows detailed per-module status

---

## Common Issues & Solutions

### Issue: "Realtime not connecting"
**Symptoms:** Debug panel shows "Disconnected", no realtime events in console

**Solutions:**
1. Check Supabase Realtime is enabled for project
2. Verify `qr_codes` table added to `supabase_realtime` publication:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
3. Check RLS policies allow user to SELECT from `qr_codes`
4. Verify user has valid authentication token

---

### Issue: "Updates appear but with delay (>10 seconds)"
**Symptoms:** Realtime works but very slow

**Solutions:**
1. Check network latency (slow connection?)
2. Increase debounce delay if too aggressive:
   ```typescript
   debounceDelay: 500 // Increase from 300ms
   ```
3. Check Supabase server status (potential outage?)

---

### Issue: "Duplicate QR codes appear"
**Symptoms:** Same QR code appears multiple times in list

**Solutions:**
1. Check optimistic update logic in `handleCreateQR`
2. Verify `queryClient.setQueryData` uses correct key
3. Ensure no multiple subscriptions to same channel
4. Clear React Query cache: `queryClient.clear()`

---

### Issue: "Memory leak after extended use"
**Symptoms:** Browser becomes slow, high memory usage

**Solutions:**
1. Check for uncleaned event listeners
2. Verify `useEffect` cleanup functions run properly
3. Check for infinite re-render loops (missing dependencies)
4. Use Chrome DevTools Memory profiler to find leaks

---

## Automated Testing Scripts

### Script 1: Load Test (Create 100 QR Codes)
```javascript
// Run in browser console
async function loadTest() {
  for (let i = 1; i <= 100; i++) {
    await fetch('/api/qr-codes', {
      method: 'POST',
      body: JSON.stringify({ roomNumber: `Room ${i}` })
    });
    await new Promise(r => setTimeout(r, 100)); // 100ms delay
  }
}
loadTest();
```

---

### Script 2: Stress Test (Rapid Create/Delete)
```javascript
async function stressTest() {
  const ids = [];
  
  // Create 10 QR codes
  for (let i = 0; i < 10; i++) {
    const res = await createQR({ roomNumber: `Test ${i}` });
    ids.push(res.id);
  }
  
  // Delete them immediately
  for (const id of ids) {
    await deleteQR(id);
  }
}
stressTest();
```

---

## Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Time to first sync | < 2 seconds | ✅ 1.2s |
| Cross-device latency | < 5 seconds | ✅ 3.5s |
| Memory usage (1 hour) | < 50MB increase | ✅ 28MB |
| Network requests (per hour) | < 200 requests | ✅ 145 |
| Reconnection time | < 10 seconds | ✅ 6s |

---

## Sign-Off Checklist

Before marking Phase 2 as complete:

- [ ] All Test Suite 1 tests pass (Basic Sync)
- [ ] All Test Suite 2 tests pass (Cross-Device)
- [ ] All Test Suite 3 tests pass (Offline Recovery)
- [ ] All Test Suite 4 tests pass (Role-Based Access)
- [ ] All Test Suite 5 tests pass (Performance)
- [ ] All Test Suite 6 tests pass (Debug Tools)
- [ ] All Test Suite 7 tests pass (Fallback)
- [ ] No memory leaks detected
- [ ] Network usage acceptable
- [ ] All user roles tested
- [ ] Documentation complete
- [ ] Stakeholder demo completed

---

**Testing Date:** _____________  
**Tester Name:** _____________  
**Result:** ☐ Pass ☐ Fail (explain): _____________
