# Staging Verification Report - Phase 3
## Production Deployment Readiness Assessment

**Date:** 2025-10-01  
**Phase:** 3 - Staging Verification  
**Status:** 🔄 IN PROGRESS

---

## 📋 Canary Tenant Configuration

### Selected Canary Tenants (3)
```
1. Tenant: Grand Palace Lagos 2
   ID: 3d1ce4a9-c30e-403d-9ad6-1ae2fd263c04
   Created: 2025-09-20

2. Tenant: azza lingo
   ID: 5498d8e5-fe6c-4975-83bb-cdd2b1d39638
   Created: 2025-09-22

3. Tenant: Grand Palace Mx
   ID: a6c4eb38-97b7-455a-b0cc-146e8e43563b
   Created: 2025-09-22
```

---

## ✅ Pre-Flight Infrastructure Checks

### Database Functions
| Function | Status | Verification |
|----------|--------|--------------|
| `atomic_checkout_v2` | ✅ EXISTS | SECURITY DEFINER, verified in DB |
| `is_background_jobs_enabled` | ✅ EXISTS | SECURITY DEFINER, verified in DB |
| `get_user_role` | ✅ EXISTS | Hardened with search_path |
| `is_super_admin` | ✅ EXISTS | Hardened with search_path |

### Feature Flags Configuration
| Flag | Current State | Target State | Status |
|------|---------------|--------------|--------|
| `ff/background_jobs_enabled` | DISABLED | Ready for rollout | ✅ |
| `ff/paginated_reservations` | DISABLED | Ready for rollout | ✅ |
| `ff/sentry_enabled` | DISABLED | Ready for rollout | ✅ |
| `ff/atomic_checkin_v2` | DISABLED | Ready for rollout | ✅ |

### Frontend Hooks Verification
| Hook/Component | Status | Location | Notes |
|----------------|--------|----------|-------|
| `useAtomicCheckoutV2` | ✅ EXISTS | src/hooks/useAtomicCheckoutV2.ts | Calls atomic_checkout_v2 RPC |
| `usePaginatedReservations` | ✅ EXISTS | src/hooks/useReservations.ts | Supports pagination with limit/offset |
| Sentry Integration | ✅ EXISTS | src/lib/sentry.ts | Ready for DSN configuration |

### System Health Baseline
```
Total Reservations: 36
  - Confirmed: 3
  - Checked In: 8
  - Checked Out: 19

Total Payments: 22
  - Payment Methods: cash, pos
  
Background Jobs (Last 24h):
  - auto_checkout: Running every 30 minutes
  - Status: SKIPPED (feature flag disabled)
  - Execution Time: 7-10ms
```

---

## 🧪 Test Suite 1: Core Operations (Pre-Feature Toggle)

### Test 1.1: Create Reservation (UI + API)
**Objective:** Verify reservation creation flow works end-to-end  
**Pre-conditions:** User authenticated, room available  
**Steps:**
1. Navigate to reservations page
2. Click "Create Reservation"
3. Fill in guest details (name, email, phone)
4. Select available room and dates
5. Submit reservation
6. Verify reservation appears in list
7. Verify DB record created with correct tenant_id

**Expected Results:**
- ✅ Reservation created successfully
- ✅ Guest record created/updated
- ✅ Room marked as occupied for date range
- ✅ Folio automatically created
- ✅ Notification sent (if configured)

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

### Test 1.2: Concurrent Check-In (Race Condition Test)
**Objective:** Verify atomic check-in prevents duplicate room assignments  
**Pre-conditions:** Single reservation with confirmed status  
**Steps:**
1. Open two browser sessions for same tenant
2. Navigate both to reservation details page
3. Click "Check In" on BOTH sessions simultaneously (within 1 second)
4. Verify only ONE check-in succeeds
5. Verify second attempt shows appropriate error message
6. Verify room assigned exactly once
7. Verify single folio charge created

**Expected Results:**
- ✅ Exactly one check-in succeeds
- ✅ Second attempt blocked with clear error
- ✅ No duplicate room assignments
- ✅ Single toast notification shown
- ✅ Audit log shows both attempts

**Test Status:** ⏳ PENDING MANUAL EXECUTION  
**Critical:** This validates atomic operations work correctly

---

### Test 1.3: Complete Checkout Flow
**Objective:** Verify checkout process updates all related entities  
**Pre-conditions:** Reservation in checked_in status  
**Steps:**
1. Navigate to checked-in reservation
2. Verify folio shows charges
3. Add payment to cover balance
4. Click "Checkout"
5. Verify folio status = closed
6. Verify room status = dirty/cleaning
7. Verify reservation status = checked_out
8. Verify UI updates immediately (real-time)

**Expected Results:**
- ✅ Folio balance = 0
- ✅ Folio status = closed
- ✅ Room status updated
- ✅ Reservation status = checked_out
- ✅ Query cache invalidated
- ✅ UI reflects changes < 2 seconds

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

### Test 1.4: Payment Recording (All Methods)
**Objective:** Verify all payment methods work correctly  
**Pre-conditions:** Open folio with outstanding balance  
**Test Cases:**

#### Test 1.4a: Cash Payment
- Amount: ₦5,000
- Expected: Payment recorded, folio balance decreased

#### Test 1.4b: POS Payment
- Amount: ₦10,000
- Expected: Payment recorded with POS reference

#### Test 1.4c: Transfer Payment
- Amount: ₦15,000
- Expected: Payment recorded, requires transfer reference

#### Test 1.4d: Credit Payment
- Amount: ₦8,000
- Expected: Payment recorded, guest credit balance increased

**Expected Results:**
- ✅ All payment methods create valid payment records
- ✅ Payment_method field matches DB constraints
- ✅ Folio balance updates correctly
- ✅ Payment history visible in UI
- ✅ Audit trail captured

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

### Test 1.5: Staff Invitation & Login
**Objective:** Verify user invitation and authentication flow  
**Pre-conditions:** Owner/Manager role authenticated  
**Steps:**
1. Navigate to Staff Management
2. Click "Invite Staff"
3. Enter email: staging-test@example.com
4. Select role: FRONT_DESK
5. Submit invitation
6. Verify unique email per tenant enforced
7. Attempt duplicate email invitation (should fail)
8. Check for invitation email/temp password
9. Login with temporary credentials
10. Verify redirect to password change

**Expected Results:**
- ✅ Invitation created successfully
- ✅ Duplicate email rejected with clear error
- ✅ Temp password generated securely
- ✅ Email sent (if configured)
- ✅ Login successful with temp credentials
- ✅ Forced password change on first login

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

### Test 1.6: QR Request → Folio Charge Flow
**Objective:** Verify QR ordering system end-to-end  
**Pre-conditions:** QR code configured for room, staff online  
**Steps:**
1. Scan QR code (or use test token)
2. Submit service request (e.g., Room Service)
3. Verify request appears in staff queue
4. Staff accepts request
5. Verify folio charge created
6. Verify real-time notification to staff
7. Check audit trail

**Expected Results:**
- ✅ QR validation successful
- ✅ Request created with session context
- ✅ Staff notification received < 2 seconds
- ✅ Folio charge auto-created if applicable
- ✅ Request status trackable
- ✅ Guest message thread maintained

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

### Test 1.7: Shift Terminal Operations
**Objective:** Verify shift management for staff routing  
**Pre-conditions:** Staff member with proper role  
**Steps:**
1. Navigate to /shift-terminal
2. Click "Start Shift"
3. Verify shift record created in DB
4. Verify staff appears in active routing pool
5. Verify QR requests route to active staff
6. Click "End Shift"
7. Verify shift end time recorded
8. Verify staff removed from routing pool

**Expected Results:**
- ✅ Shift start/end recorded accurately
- ✅ Timestamps captured
- ✅ Active staff routing works
- ✅ Ended shifts excluded from routing
- ✅ Shift duration calculated correctly

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

### Test 1.8: Real-Time Updates (Concurrent Sessions)
**Objective:** Verify real-time data synchronization  
**Pre-conditions:** Two active sessions for same tenant  
**Steps:**
1. Open Session A: Desktop browser
2. Open Session B: Mobile/incognito browser
3. In Session A: Create new reservation
4. Verify Session B shows new reservation < 2 seconds
5. In Session B: Update reservation status
6. Verify Session A reflects change < 2 seconds
7. Test with payment creation
8. Test with room status update

**Expected Results:**
- ✅ Changes propagate to all sessions
- ✅ Latency < 2 seconds
- ✅ No stale data displayed
- ✅ Optimistic UI updates work
- ✅ Conflict resolution handles edge cases

**Test Status:** ⏳ PENDING MANUAL EXECUTION  
**Note:** This validates Supabase real-time subscriptions

---

## 🎯 Test Suite 2: Feature-Specific Tests

### Feature A: ff/background_jobs_enabled

#### Test A.1: Auto-Checkout Job Execution
**Objective:** Verify automatic checkout processes overdue reservations  
**Setup:**
1. Create reservation with check_out_date = today - 1 day
2. Set status = checked_in (simulating overdue guest)
3. Enable feature flag for canary tenant
4. Wait for next job execution (30-minute cycle)

**Expected Results:**
- ✅ Job executes within 30-minute window
- ✅ Overdue reservation auto-checked-out
- ✅ Folio closed automatically
- ✅ Room status set to cleaning
- ✅ Audit log entry created
- ✅ No duplicate checkout attempts

**Verification Query:**
```sql
SELECT * FROM background_job_logs 
WHERE job_name = 'auto_checkout' 
  AND status = 'success'
  AND completed_at > now() - interval '1 hour'
ORDER BY started_at DESC;
```

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test A.2: SMS Credit Monitoring
**Objective:** Verify credit monitoring alerts trigger  
**Setup:**
1. Set tenant SMS balance to 50 credits
2. Enable background jobs
3. Wait for monitoring job

**Expected Results:**
- ✅ Job checks credit balance
- ✅ Alert triggered if below threshold (100)
- ✅ Notification sent to admin
- ✅ Job log shows execution details

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test A.3: Revenue View Refresh
**Objective:** Verify materialized view updates  
**Setup:**
1. Create several payments
2. Enable background jobs
3. Trigger or wait for refresh job

**Expected Results:**
- ✅ Materialized view refreshed
- ✅ New payment data reflected
- ✅ Query performance maintained
- ✅ No locking conflicts

**Verification Query:**
```sql
SELECT * FROM mv_daily_revenue_by_tenant 
WHERE period = CURRENT_DATE;
```

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test A.4: No Duplicate Job Executions
**Objective:** Verify idempotency and race condition prevention  
**Test:**
1. Review job logs for last 24 hours
2. Check for duplicate executions in same time window
3. Verify each job has unique started_at

**Expected Results:**
- ✅ No jobs run more than once per cycle
- ✅ Execution times distributed correctly
- ✅ No overlapping executions
- ✅ Error handling graceful

**Verification Query:**
```sql
SELECT 
  job_name,
  DATE_TRUNC('minute', started_at) as time_window,
  COUNT(*) as execution_count,
  STRING_AGG(status, ', ') as statuses
FROM background_job_logs
WHERE started_at > now() - interval '24 hours'
GROUP BY job_name, DATE_TRUNC('minute', started_at)
HAVING COUNT(*) > 1;
```

**Test Status:** ⏳ PENDING EXECUTION

---

### Feature B: ff/paginated_reservations

#### Test B.1: Reservations List Pagination
**Objective:** Verify UI pagination controls work  
**Pre-conditions:** System has 36 total reservations  
**Steps:**
1. Navigate to reservations page
2. Verify pagination controls visible
3. Set page size to 10
4. Verify 10 items displayed
5. Click "Next Page"
6. Verify next 10 items loaded
7. Verify "Previous Page" works
8. Test page size changes (10, 25, 50, 100)

**Expected Results:**
- ✅ Pagination controls visible
- ✅ Correct number of items per page
- ✅ Navigation works bidirectionally
- ✅ Total count displayed correctly
- ✅ No duplicate items across pages
- ✅ Query uses LIMIT/OFFSET correctly

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

#### Test B.2: Rooms List Pagination
**Objective:** Verify rooms pagination implementation  
**Steps:** Similar to B.1 but for rooms list

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

#### Test B.3: Payments List Pagination
**Objective:** Verify payments pagination implementation  
**Steps:** Similar to B.1 but for payments list

**Test Status:** ⏳ PENDING MANUAL EXECUTION

---

#### Test B.4: Load Test (1,000+ Reservations)
**Objective:** Verify performance under realistic load  
**Setup:**
1. Generate 1,000 test reservations (staging only)
2. Enable pagination feature flag
3. Measure page load times
4. Compare to non-paginated baseline

**Expected Results:**
- ✅ Initial page load < 500ms
- ✅ Subsequent pages load < 300ms
- ✅ Total query time < 200ms
- ✅ No memory leaks in browser
- ✅ Smooth scrolling/interaction

**Performance Metrics:**
```
Baseline (36 records, no pagination): X ms
Target (1000+ records, paginated):     < 500ms
```

**Test Status:** ⏳ PENDING LOAD GENERATION

---

### Feature C: ff/sentry_enabled

#### Test C.1: Frontend Error Capture
**Objective:** Verify client-side errors sent to Sentry  
**Steps:**
1. Enable Sentry feature flag
2. Add SENTRY_DSN to environment
3. Trigger test error in UI:
   ```javascript
   throw new Error('[STAGING TEST] Frontend error capture');
   ```
4. Check Sentry dashboard for event
5. Verify user context attached
6. Verify breadcrumbs captured

**Expected Results:**
- ✅ Error appears in Sentry dashboard
- ✅ User context (id, email, role) attached
- ✅ Tenant ID tagged
- ✅ Breadcrumbs show user actions
- ✅ Stack trace readable
- ✅ Environment tagged as staging

**Sentry Event Link:** ⏳ PENDING

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test C.2: Server-Side Error Capture
**Objective:** Verify edge function errors captured  
**Steps:**
1. Create test edge function with error
2. Invoke function
3. Check Sentry for server-side event
4. Verify function name tagged

**Expected Results:**
- ✅ Server error captured
- ✅ Function name in tags
- ✅ Request context included
- ✅ Tenant context preserved

**Test Status:** ⏳ PENDING EDGE FUNCTION TEST

---

#### Test C.3: Alert Notification Test
**Objective:** Verify Sentry alerts configured  
**Steps:**
1. Trigger multiple errors quickly
2. Verify alert triggered
3. Check notification channels (email, Slack, etc.)

**Expected Results:**
- ✅ Alert fires after threshold
- ✅ Notifications delivered
- ✅ Alert includes error details
- ✅ Severity levels correct

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test C.4: Performance Transaction Tracking
**Objective:** Verify performance monitoring works  
**Steps:**
1. Navigate through application
2. Perform key transactions (create reservation, checkout)
3. Check Sentry performance dashboard
4. Verify transaction traces captured

**Expected Results:**
- ✅ Transactions appear in dashboard
- ✅ Duration tracked accurately
- ✅ Spans show operation breakdown
- ✅ Slow queries highlighted

**Test Status:** ⏳ PENDING EXECUTION

---

### Feature D: ff/atomic_checkin_v2

#### Test D.1: Single Check-In Success
**Objective:** Verify basic check-in flow works  
**Steps:**
1. Create confirmed reservation
2. Enable atomic check-in v2 flag
3. Navigate to reservation
4. Click "Check In"
5. Verify success message
6. Verify room assigned
7. Verify status updated

**Expected Results:**
- ✅ Check-in succeeds
- ✅ Single toast notification
- ✅ Room assignment atomic
- ✅ Status updated correctly
- ✅ Folio opened
- ✅ Audit log entry created

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test D.2: Concurrent Check-In (Race Condition)
**Objective:** Verify advisory locks prevent race conditions  
**Steps:**
1. Create single reservation
2. Enable atomic check-in v2
3. Open two browser tabs
4. Click "Check In" in both tabs SIMULTANEOUSLY
5. Verify only one succeeds
6. Verify second tab shows error
7. Verify no duplicate room assignments
8. Check advisory lock log

**Expected Results:**
- ✅ Exactly ONE check-in succeeds
- ✅ Second attempt blocked immediately
- ✅ Clear error message: "Room already assigned" or similar
- ✅ Single folio created
- ✅ Single room assignment
- ✅ Advisory lock acquired and released
- ✅ Both attempts logged in audit_log

**Critical Success Criteria:**
```sql
-- This query should return exactly 1 row
SELECT COUNT(*) as checkout_count 
FROM reservations 
WHERE id = '<test_reservation_id>' 
  AND status = 'checked_in';
```

**Test Status:** ⏳ PENDING EXECUTION  
**Priority:** 🔴 CRITICAL - Core feature validation

---

#### Test D.3: Single Toast Notification
**Objective:** Verify UI shows exactly one notification  
**Steps:**
1. Perform check-in
2. Count toast notifications displayed
3. Verify toast auto-dismisses after 5 seconds

**Expected Results:**
- ✅ Exactly 1 toast shown
- ✅ Toast contains success/error message
- ✅ Toast auto-dismisses
- ✅ No duplicate notifications

**Test Status:** ⏳ PENDING EXECUTION

---

#### Test D.4: Advisory Lock Acquisition
**Objective:** Verify locking mechanism works  
**Verification:**
1. Check Postgres logs during concurrent test
2. Verify lock acquired: `pg_advisory_lock`
3. Verify lock released: `pg_advisory_unlock`
4. Verify lock timeout handling

**Expected Log Entries:**
```
[Atomic Check-in V2] Acquiring advisory lock for reservation...
[Atomic Check-in V2] Lock acquired successfully
[Atomic Check-in V2] Check-in completed, releasing lock
```

**Test Status:** ⏳ PENDING LOG REVIEW

---

#### Test D.5: Room Assignment Atomicity
**Objective:** Verify room assignment is truly atomic  
**Test:**
1. Run D.2 (concurrent check-in) 10 times
2. Verify ZERO instances of duplicate assignments
3. Verify room availability updated correctly
4. Verify no orphaned folios

**Expected Results:**
- ✅ 0 duplicate room assignments in 10 attempts
- ✅ 100% success rate for atomic operations
- ✅ Room status always consistent
- ✅ No data integrity issues

**Test Status:** ⏳ PENDING EXECUTION

---

## 📊 Performance Baseline Metrics

### Current System Performance (36 Reservations)
| Metric | Current | Target (1000+ records) |
|--------|---------|------------------------|
| Reservations page load | TBD | < 500ms |
| Create reservation | TBD | < 300ms |
| Check-in operation | TBD | < 400ms |
| Checkout operation | TBD | < 500ms |
| Payment recording | TBD | < 200ms |
| Real-time update latency | TBD | < 2000ms |

**Measurement Method:**
- Use browser DevTools Performance tab
- Measure Time to Interactive (TTI)
- Measure Largest Contentful Paint (LCP)
- Record Network waterfall timings

---

## 🚨 Critical Issues to Watch

### High-Risk Areas
1. **Concurrent Operations**
   - Race conditions in check-in/checkout
   - Duplicate job executions
   - Real-time subscription conflicts

2. **Data Integrity**
   - Orphaned folios
   - Incorrect room assignments
   - Payment mismatches
   - Audit trail gaps

3. **Performance Degradation**
   - Query timeouts with large datasets
   - Memory leaks in long-running sessions
   - Real-time subscription overhead

### Rollback Triggers
**Immediate rollback if:**
- ❌ Duplicate room assignments occur
- ❌ Payment recording fails
- ❌ Data corruption detected
- ❌ Critical errors > 5 per hour
- ❌ Performance degradation > 50%

---

## ✅ Sign-Off Criteria

### Phase 3 Complete When:
- [ ] All Test Suite 1 tests PASS (8/8)
- [ ] All Feature-Specific tests PASS (16/16)
- [ ] No critical issues detected
- [ ] Performance metrics meet targets
- [ ] Rollback plan validated
- [ ] Canary tenant stakeholders notified

---

## 📝 Next Steps After Verification

1. **If ALL PASS:** Proceed to Phase 4 (Canary Deployment)
2. **If ANY FAIL:** Document failures, implement fixes, re-test
3. **Critical Failures:** Full rollback and remediation plan

---

**Report Status:** 🔄 IN PROGRESS  
**Last Updated:** 2025-10-01  
**Next Review:** After manual test execution  
**Owner:** Production Deployment Team