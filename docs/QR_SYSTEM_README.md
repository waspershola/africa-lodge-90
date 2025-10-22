# QR Enhanced Request System - Complete Documentation

## Overview

The QR Enhanced Request System is a comprehensive guest service platform that enables contactless service requests with SMS notifications, persistent sessions, and real-time staff alerts.

### Key Features

- ✅ **Persistent Sessions**: Guests can resume their session using short URLs
- ✅ **SMS Notifications**: Optional SMS updates for request status
- ✅ **Real-time Alerts**: Staff receive instant notifications with sound
- ✅ **Request History**: Complete tracking of all guest requests
- ✅ **High-Quality QR Codes**: SVG format with 'H' error correction
- ✅ **Multi-Provider SMS**: Support for Termii, Twilio, and AfricasTalking

## System Architecture

### Guest Flow
```
┌─────────────────┐
│  Guest Scans QR │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Session Created        │
│  - JWT Token            │
│  - Tracking Number      │
│  - Short URL Generated  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Guest Submits Request  │
│  - Choose Service       │
│  - Optional SMS Opt-in  │
└────────┬────────────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  Staff Notified │    │  SMS Sent (opt)  │
│  - Toast        │    │  - Confirmation  │
│  - Sound Alert  │    │  - Short URL     │
└─────────────────┘    └──────────────────┘
```

### Staff Flow
```
┌──────────────────┐
│  Request Created │
└────────┬─────────┘
         │
         ▼
┌─────────────────────┐
│  Notification Sent  │
│  - Browser Toast    │
│  - Sound Alert      │
│  - Email (optional) │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Staff Actions      │
│  - View Details     │
│  - Assign Staff     │
│  - Update Status    │
│  - Mark Complete    │
└─────────────────────┘
```

## Implementation Guide

### Phase 1: Initial Setup

#### 1.1 Database Setup
All migrations are already applied. Verify with:
```sql
-- Check qr_requests table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'qr_requests' 
AND column_name IN ('session_token', 'resume_short_url', 'is_persistent', 'guest_phone', 'sms_enabled', 'sms_sent');
```

#### 1.2 SMS Provider Configuration
Navigate to: **Super Admin → SMS Management → Providers**

Configure at least one provider:
- **Termii** (Recommended for Nigeria)
  - Get API key from https://termii.com
  - Set sender ID (11 chars max)
  - Enable provider and set priority

- **Twilio** (Global)
  - Get Account SID and Auth Token
  - Configure phone number
  
- **AfricasTalking** (Africa)
  - Get API key and username
  - Configure sender ID

#### 1.3 SMS Credits
Add SMS credits in: **Super Admin → SMS Management → Credit Pool**
- Each hotel gets allocated credits
- Monitor usage in real-time
- Set low-balance alerts

#### 1.4 SMS Templates
Create templates in: **Owner → SMS Templates** or **Hotel → SMS Center → Templates**

Example template for `request_received`:
```
Hello {guest_name}, your {request_type} request at {hotel} has been received. Track your request: {tracking_number}
```

Available placeholders:
- `{hotel}` - Hotel name (max 25 chars)
- `{guest_name}` - Guest name (max 20 chars)
- `{request_type}` - Type of request
- `{tracking_number}` - Unique tracking ID

### Phase 2: QR Code Generation

#### 2.1 Generate QR Codes
Navigate to: **Owner → QR Management**

1. Click "Create QR Code"
2. Choose type: Room Service, Maintenance, etc.
3. Select room (optional)
4. Generate high-quality QR code
5. Download as SVG or PNG

**Best Practices:**
- Use SVG format for printing
- Error correction level: H (30% recovery)
- Minimum size: 2cm x 2cm
- Print on durable material
- Place at eye level

#### 2.2 Short URL Configuration
Short URLs are automatically generated using the format:
```
https://yourhotel.app/r/{code}
```

Configuration in `supabase/functions/url-shortener/index.ts`:
- 6-character codes using safe alphabet
- No ambiguous characters (0, O, I, l)
- Collision detection
- Session linking

### Phase 3: Staff Training

#### 3.1 Enable Notifications
**Critical:** Staff must enable browser notifications.

1. First login: Browser prompts for permission
2. Click "Allow" when prompted
3. Verify in browser settings (usually in address bar)
4. Test: Submit a test request

#### 3.2 Notification Settings
Navigate to: **Profile → Settings → Notifications**

Configure:
- Enable/disable sound alerts
- Enable/disable toast notifications
- Adjust volume
- Set do-not-disturb hours

#### 3.3 Managing Requests
Access requests in: **Front Desk → QR Requests**

Workflow:
1. Notification received with sound
2. Click notification or navigate to panel
3. View request details
4. Assign to staff member
5. Update status as work progresses
6. Mark complete when finished

### Phase 4: Guest Experience

#### 4.1 Guest Instructions
**For Room Cards:**
```
┌───────────────────────────────┐
│  Need Something?              │
│                               │
│   [QR CODE]                   │
│                               │
│  1. Scan this code            │
│  2. Choose your service       │
│  3. We'll be right there!     │
│                               │
│  Or call: +234 XXX XXX XXXX   │
└───────────────────────────────┘
```

#### 4.2 SMS Opt-in Flow
When guests submit a request, they see:
```
┌─────────────────────────────────┐
│ SMS Notifications (Optional)    │
├─────────────────────────────────┤
│ ☐ Receive SMS updates           │
│                                 │
│ Phone Number:                   │
│ [+234_____________]             │
│                                 │
│ Include country code            │
└─────────────────────────────────┘
```

#### 4.3 Request Tracking
Guests receive a short URL:
```
Your request tracking link:
https://yourhotel.app/r/abc123

Bookmark this link to track all your requests
and submit new ones during your stay.
```

## Testing

### Manual Testing

#### Test 1: End-to-End Flow
1. Generate a test QR code
2. Scan with mobile device
3. Submit a test request (with SMS enabled)
4. Verify staff notification received
5. Check SMS sent (if enabled)
6. Access request history via short URL

#### Test 2: SMS System
Navigate to: **Owner → QR System Test**
1. Enter QR token
2. Click "Run Complete Test"
3. Review all test results
4. Fix any failures

#### Test 3: Notification System
1. Have staff member log in
2. Ensure notifications enabled
3. Submit test request
4. Verify:
   - Browser notification appears
   - Sound alert plays
   - Toast notification shows

### Automated Testing
Use the testing utility at `/qr-system-test`:
```typescript
import { runCompleteTest } from '@/utils/qrSystemTest';

const results = await runCompleteTest('QR_ROOM_101_SERVICE');
console.log(results);
```

Tests performed:
- ✅ QR code validation
- ✅ Session creation
- ✅ Request submission
- ✅ SMS template processing
- ✅ Provider health check
- ✅ Credit availability

## Monitoring & Analytics

### SMS Usage Dashboard
**Navigate to:** Hotel → SMS Center → Usage

Metrics:
- Total SMS sent
- Credits used/remaining
- Average cost per SMS
- 7-day activity chart
- Usage by event type

### Activity Logs
**Navigate to:** Hotel → SMS Center → Activity

View:
- Real-time SMS log (last 50)
- Delivery status
- Error messages
- Cost per message
- Export to CSV

### Request Analytics
**Navigate to:** Front Desk → QR Requests

Filter by:
- Date range
- Request type
- Status
- Priority
- Room number

## Troubleshooting

### Common Issues

#### Staff Not Receiving Notifications

**Symptoms:** No browser notifications appear

**Solutions:**
1. Check browser permission granted
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Safari: Preferences → Websites → Notifications
2. Verify notification settings enabled in profile
3. Check browser not in "Do Not Disturb" mode
4. Ensure active session (not timed out)
5. Test with different browser

**Verify:**
```javascript
// In browser console
console.log(Notification.permission); // Should be "granted"
```

#### SMS Not Sending

**Symptoms:** Guests not receiving SMS

**Solutions:**
1. Check SMS provider enabled: SMS Management → Providers
2. Verify credits available: SMS Management → Credit Pool
3. Confirm template exists: SMS Templates
4. Check phone number format: Must include country code (+234)
5. Review SMS logs for errors: SMS Center → Activity

**Check logs:**
```sql
SELECT * FROM sms_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### QR Code Not Scanning

**Symptoms:** Camera doesn't recognize QR code

**Solutions:**
1. Verify QR code is active in system
2. Regenerate QR with higher error correction
3. Ensure good lighting conditions
4. Check QR code printed at adequate size (min 2cm)
5. Try different camera app
6. Verify QR code not damaged/dirty

**Minimum specs:**
- Size: 2cm x 2cm
- Error correction: H (30%)
- Format: SVG (for printing)
- Contrast ratio: High

#### Short URL Not Working

**Symptoms:** Link shows 404 or expired session

**Solutions:**
1. Check URL format: `/r/{code}` (6 characters)
2. Verify short_urls table entry exists
3. Check session_token not expired (default 24h)
4. Guest can rescan QR for new session
5. Verify URL shortener function deployed

**Verify deployment:**
```bash
# Check edge function deployed
supabase functions list
```

### Performance Issues

#### Slow Notification Delivery

**Symptoms:** Delays between request and notification

**Check:**
1. Database triggers firing correctly
2. Real-time subscriptions active
3. Network connectivity
4. Edge function cold starts

**Monitor:**
```sql
-- Check notification latency
SELECT 
  n.created_at as notification_time,
  r.created_at as request_time,
  EXTRACT(EPOCH FROM (n.created_at - r.created_at)) as latency_seconds
FROM staff_notifications n
JOIN qr_requests r ON r.id = n.reference_id
WHERE n.notification_type = 'guest_request'
ORDER BY n.created_at DESC
LIMIT 20;
```

#### High SMS Costs

**Symptoms:** Unexpected high SMS usage

**Solutions:**
1. Review SMS logs for anomalies
2. Check for duplicate sends
3. Optimize template length (160 chars = 1 SMS)
4. Disable auto-SMS for low-priority events
5. Set daily sending limits

**Audit usage:**
```sql
-- Daily SMS cost analysis
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_sent,
  SUM(credits_used) as credits_used,
  SUM(credits_used * cost_per_credit) as total_cost
FROM sms_logs
WHERE status = 'sent'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

## API Reference

### Edge Functions

#### qr-unified-api
**Endpoint:** `/functions/v1/qr-unified-api`

**Routes:**
- `POST /validate` - Create guest session
- `POST /request` - Submit service request
- `GET /request/:id` - Get request status
- `GET /session/:id/requests` - Get session requests

#### url-shortener
**Endpoint:** `/functions/v1/url-shortener`

**Request:**
```json
{
  "originalUrl": "string",
  "sessionToken": "string",
  "linkType": "qr_redirect"
}
```

**Response:**
```json
{
  "shortUrl": "string",
  "code": "string"
}
```

#### send-request-sms
**Endpoint:** `/functions/v1/send-request-sms`

**Request:**
```json
{
  "request_id": "uuid",
  "tenant_id": "uuid"
}
```

### Database Schema

#### qr_requests
```sql
CREATE TABLE qr_requests (
  id UUID PRIMARY KEY,
  session_token TEXT,           -- NEW: JWT session token
  resume_short_url TEXT,        -- NEW: Short URL for resuming
  is_persistent BOOLEAN,        -- NEW: Session persistence flag
  guest_phone TEXT,             -- NEW: Guest phone number
  sms_enabled BOOLEAN,          -- NEW: SMS opt-in flag
  sms_sent BOOLEAN,             -- NEW: SMS delivery status
  sms_sent_at TIMESTAMPTZ,      -- NEW: SMS send timestamp
  -- ... existing columns
);
```

#### short_urls
```sql
CREATE TABLE short_urls (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,
  original_url TEXT,
  session_token TEXT,
  link_type TEXT,
  clicks INTEGER,
  created_at TIMESTAMPTZ
);
```

## Security Considerations

### JWT Tokens
- Tokens expire after 24 hours
- Signed with HS256 algorithm
- Include tenant and session context
- Validated on every request

### Rate Limiting
- QR validation: 20/minute per IP
- Request creation: 10/minute per session
- SMS sending: 5/minute per tenant

### Data Privacy
- Guest phone numbers encrypted at rest
- SMS logs retain only last 4 digits
- Session data purged after 7 days
- GDPR compliant data handling

## Support Resources

### Documentation Links
- QR System Guide: `/qr-system-guide`
- SMS Templates: `/sms-templates`
- System Test: `/qr-system-test`
- Analytics: Hotel → SMS Center

### Contact
For technical support, contact your system administrator or refer to the in-app help resources.

## Changelog

### v2.0.0 - QR Enhancement Release
- ✨ Added persistent sessions with JWT tokens
- ✨ Implemented short URL generation
- ✨ Added SMS notification opt-in
- ✨ Created request history tracking
- ✨ Enhanced staff notifications with sound
- ✨ Improved QR code quality (SVG, error correction H)
- ✨ Added comprehensive testing utilities
- 📝 Complete documentation and guides
- 🎨 New SMS analytics dashboard
- 🔒 Enhanced security with rate limiting

---

**Last Updated:** 2025-10-22
**Version:** 2.0.0
**Status:** Production Ready
