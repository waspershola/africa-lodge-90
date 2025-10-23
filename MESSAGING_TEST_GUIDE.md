# 🧪 Messaging System Testing Guide

## ✅ Issues Fixed

### 1. **Foreign Key Constraint Error** ✓
**Problem:** `guest_messages_qr_order_id_fkey` was pointing to wrong table
**Solution:** Fixed foreign key to properly reference `qr_requests(id)` instead of old `qr_orders`
**Status:** ✅ RESOLVED

### 2. **QuickReplyBar Performance** ✓
**Problem:** Client-side filtering of templates (fetched all, filtered in browser)
**Solution:** Server-side filtering using Supabase `.contains()` operator
**Status:** ✅ OPTIMIZED

### 3. **Guest Portal UI** ✓
**Problem:** User reported no UI option for guests to reply or see orders
**Solution:** **MyRequestsPanel** component exists and is properly integrated
**Location:** Guest Portal at `/guest/qr/:qrToken` → "My Requests" button
**Status:** ✅ VERIFIED (Component exists and integrated)

---

## 📋 Manual Testing Checklist

### **Test 1: Staff → Guest Messaging Flow**

#### Prerequisites:
- Login to `/front-desk` as staff member
- Guest should have an active request (via QR code scan)

#### Steps:
1. Navigate to Front Desk dashboard
2. Find a request from a room (e.g., Room 110)
3. Click **"Chat"** button with unread badge
4. Type a message in the chat (e.g., "We're on our way!")
5. Click **Send** button

#### Expected Results:
- ✅ Message sends successfully (no foreign key error)
- ✅ Message appears in chat immediately
- ✅ No console errors
- ✅ Timestamp shows correctly
- ✅ QuickReply templates load quickly (server-side filtering)

---

### **Test 2: Guest → Staff Messaging Flow**

#### Prerequisites:
- Guest has scanned a QR code and created a request
- Guest has the QR token URL

#### Steps:
1. Navigate to `/guest/qr/:qrToken` (use actual QR token)
2. Click **"My Requests"** button (should see badge if unread staff messages)
3. Select a request from the list
4. Click on the request to open chat view
5. Type a message (e.g., "Thank you!")
6. Click **Send**

#### Expected Results:
- ✅ "My Requests" button is visible in guest portal
- ✅ Request list loads correctly
- ✅ Chat opens when request is clicked
- ✅ Guest can send messages
- ✅ Messages appear in real-time
- ✅ No foreign key errors

---

### **Test 3: Real-Time Bidirectional Messaging**

#### Prerequisites:
- Two browser windows/tabs open:
  - Tab 1: Staff chat (Front Desk dashboard)
  - Tab 2: Guest portal chat (same request)

#### Steps:
1. In **Staff tab**: Send a message → "How can I help you?"
2. Check **Guest tab**: Should see message appear instantly
3. In **Guest tab**: Reply → "I need extra towels"
4. Check **Staff tab**: Should see reply appear instantly
5. Repeat 2-3 times

#### Expected Results:
- ✅ Messages flow bidirectionally in real-time
- ✅ No page refresh needed
- ✅ Timestamps update correctly
- ✅ No duplicate messages
- ✅ Real-time subscriptions working properly

---

### **Test 4: Mark as Read / Unread Badges**

#### Prerequisites:
- Guest has sent multiple unread messages to staff

#### Steps:
1. **Before opening chat**: Check unread badge count on "Chat" button
2. Open the staff chat view for that request
3. **After opening**: Badge count should decrease to 0
4. Send a new message from guest
5. Check if badge increments without refresh (5-second poll)

#### Expected Results:
- ✅ Unread count shows correctly
- ✅ Badge updates when chat is opened
- ✅ Messages marked as read automatically
- ✅ Badge updates with new messages (within 5 seconds)
- ✅ Polling works correctly

---

### **Test 5: Quick Reply Templates**

#### Prerequisites:
- Message templates seeded in database (17 templates)
- Staff chat open for a specific request type

#### Steps:
1. Open staff chat for a **HOUSEKEEPING** request
2. Check if QuickReply bar appears
3. Verify templates like "Our housekeeping team has been dispatched"
4. Click a template button
5. Verify it populates the message input
6. Send the message

#### Expected Results:
- ✅ Templates load quickly (server-side filtered)
- ✅ Only relevant templates for request type shown
- ✅ Template text populates input field
- ✅ Can edit template before sending
- ✅ Templates work for all request types

---

## 🐛 Known Issues & Edge Cases

### Edge Cases to Test:
- [ ] Multiple guests in same room (do messages mix?)
- [ ] Very long messages (500+ characters)
- [ ] Special characters in messages (emojis, etc.)
- [ ] Sending messages rapidly (race conditions?)
- [ ] Network interruptions (offline/online transitions)
- [ ] Session expiration (does chat break?)

### Common Errors to Watch For:
```
❌ "violates foreign key constraint" → Fixed!
❌ "qr_request_id not found" → Check request exists
❌ "tenant_id mismatch" → RLS policy issue
❌ "Permission denied" → Check user roles
```

---

## 🔧 Debugging Tips

### Check Console Logs:
```javascript
// Look for these messages
"Setting up staff real-time subscription for request:"
"New message received (staff view):"
"Setting up guest real-time subscription for request:"
```

### Check Network Tab:
- Look for `POST /rest/v1/guest_messages` (send message)
- Look for `GET /rest/v1/guest_messages` (fetch messages)
- Look for WebSocket connections (real-time)

### Check Database:
```sql
-- Verify message was inserted
SELECT * FROM guest_messages 
WHERE qr_request_id = 'your-request-id' 
ORDER BY created_at DESC LIMIT 5;

-- Check unread count
SELECT COUNT(*) FROM guest_messages 
WHERE sender_type = 'guest' 
AND is_read = false;

-- Check foreign key constraint
SELECT constraint_name, table_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'guest_messages';
```

---

## 📊 Testing Results Template

```markdown
## Test Session: [Date]

### Environment:
- Browser: [Chrome/Firefox/Safari]
- User Role: [FRONT_DESK/GUEST]
- Request Type: [HOUSEKEEPING/ROOM_SERVICE/etc]

### Results:

**Test 1: Staff → Guest** 
- [ ] Pass / [ ] Fail
- Notes: ___________

**Test 2: Guest → Staff**
- [ ] Pass / [ ] Fail
- Notes: ___________

**Test 3: Real-Time Bidirectional**
- [ ] Pass / [ ] Fail
- Notes: ___________

**Test 4: Mark as Read**
- [ ] Pass / [ ] Fail
- Notes: ___________

**Test 5: Quick Reply**
- [ ] Pass / [ ] Fail
- Notes: ___________

### Issues Found:
1. ___________
2. ___________

### Screenshots:
[Attach relevant screenshots]
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Mark messaging system as **PRODUCTION READY**
2. Monitor for real-world usage issues
3. Consider adding:
   - Typing indicators
   - Message attachments (images)
   - Push notifications
   - Message search/filter

If tests fail:
1. Document exact error messages
2. Check console logs and network requests
3. Verify database schema and RLS policies
4. Test with different user roles/tenants
5. Report findings for further debugging

---

## 📞 Support

If you encounter issues during testing:
1. Check this guide first
2. Review console logs and network tab
3. Verify database records
4. Contact dev team with:
   - Exact steps to reproduce
   - Error messages
   - Screenshots
   - Browser/environment info
