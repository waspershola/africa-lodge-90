# QA Testing Checklist - Critical Fixes

## 🎯 Priority 0 - Critical Issues

### ✅ Test 1: Payment Method Mapping
**Objective**: Verify payments work with all configured methods

**Steps**:
1. Go to Front Desk → Select a checked-in room
2. Click "Post Payment"
3. Try payment with each method:
   - [ ] Cash
   - [ ] Moniepoint POS (or any POS system)
   - [ ] Bank Transfer
   - [ ] Credit/Pay Later
   - [ ] Digital Wallet (if configured)

**Expected Result**: All payments succeed without database constraint errors

**Actual Result**: _______________

---

### ✅ Test 2: Cancel Reservation Releases Room
**Objective**: Room becomes available immediately after cancellation

**Steps**:
1. Create a new reservation for room 111
2. Go to Front Desk → Click on room 111
3. Click "Cancel Reservation"
4. Select a reason and click "Release Reservation"
5. Observe room status WITHOUT refreshing page

**Expected Result**: 
- Room 111 status changes to "Available" within 2 seconds
- Room card updates without manual refresh

**Actual Result**: _______________

---

### ✅ Test 3: Checkout Flow Complete
**Objective**: Verify atomic checkout with proper status updates

**Steps**:
1. Create reservation → Check-in guest → Add room charges
2. Make payment to cover full balance
3. Click "Checkout" on room
4. Complete checkout
5. Observe room status WITHOUT refreshing

**Expected Result**:
- Checkout completes successfully
- Room status changes to "Dirty" immediately
- Folio shows as "Closed"
- Balance shows ₦0

**Actual Result**: _______________

---

## 🎯 Priority 1 - Important Issues

### ✅ Test 4: Mark as Cleaned Updates UI
**Objective**: Room status updates in real-time after cleaning

**Steps**:
1. Checkout a guest (room should be "Dirty")
2. Find "Mark as Cleaned" button on room card
3. Click "Mark as Cleaned"
4. Observe room status WITHOUT refreshing

**Expected Result**:
- Button disappears immediately
- Room status changes to "Available" within 2 seconds
- No page refresh needed

**Actual Result**: _______________

---

### ✅ Test 5: Side Panel Scrolling
**Objective**: Panels fit viewport and scroll properly

**Steps**:
1. On desktop: Click on any room to open side drawer
2. Scroll through content
3. On mobile/tablet: Repeat same test
4. Open checkout dialog and scroll

**Expected Result**:
- Panel header stays fixed at top
- Content area scrolls smoothly
- No content cut off
- Works on mobile (test with browser dev tools)

**Actual Result**: _______________

---

### ✅ Test 6: Payment Visibility & Aggregation
**Objective**: Multiple payments show correctly

**Steps**:
1. Create reservation and check-in
2. Add charges totaling ₦50,000
3. Make payment of ₦20,000 (Partial)
4. Verify folio shows "Partial Payment" badge
5. Make second payment of ₦30,000 (Full)
6. Verify folio shows "Fully Paid" badge

**Expected Result**:
- After first payment: Shows "Partial Payment" + ₦30,000 balance
- After second payment: Shows "Fully Paid" + ₦0 balance
- Both payments visible in payment history

**Actual Result**: _______________

---

## 🔄 Real-time Updates Test

### ✅ Test 7: Multi-Browser Real-time Sync
**Objective**: Changes appear across all connected browsers

**Steps**:
1. Open Front Desk in two browser windows (Chrome + Firefox)
2. In Chrome: Cancel a reservation
3. In Firefox: Observe room status WITHOUT refresh

**Expected Result**:
- Room status updates in Firefox within 2-3 seconds
- No manual refresh needed

**Actual Result**: _______________

---

## 📊 Results Summary

**Date**: _______________  
**Tester**: _______________  
**Environment**: [ ] Staging [ ] Production

**Tests Passed**: ___ / 7  
**Tests Failed**: ___ / 7  

### Issues Found:
1. _______________
2. _______________
3. _______________

### Overall Status: [ ] PASS [ ] FAIL [ ] NEEDS REVIEW

---

## 🚨 Troubleshooting

### If Payment Fails:
- Check browser console for "[Payment Mapper]" logs
- Verify payment method is enabled in Financial Settings
- Check Supabase logs for constraint errors

### If Room Status Not Updating:
- Check browser console for "[Realtime Event]" logs
- Verify network connection (realtime requires WebSocket)
- Check Supabase realtime is enabled for rooms table

### If Side Panel Not Scrolling:
- Test on different browser/device
- Check browser zoom level (should be 100%)
- Verify browser supports CSS flexbox

---

## 📸 Screenshots Required

Please attach screenshots for:
1. [ ] Successful payment with POS method
2. [ ] Room status change after cancellation
3. [ ] Checkout complete screen
4. [ ] Side panel on mobile device
5. [ ] Payment history showing multiple payments

---

## ✅ Sign-off

**QA Tester**: _______________ **Date**: _______________  
**Developer**: _______________ **Date**: _______________  
**Product Owner**: _______________ **Date**: _______________
