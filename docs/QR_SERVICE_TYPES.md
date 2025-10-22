# QR Service Type Mapping

## Overview
This document defines the mapping between frontend display names and backend database values for QR code service types.

## Frontend Display Names → Backend Request Types

| Frontend Display | Backend DB Value | Request Type | Description |
|-----------------|------------------|--------------|-------------|
| Wi-Fi | WIFI | WIFI | Wi-Fi access requests |
| Room Service | ROOM_SERVICE | ROOM_SERVICE | Food/beverage orders |
| Housekeeping | HOUSEKEEPING | HOUSEKEEPING | Cleaning, supplies |
| Maintenance | MAINTENANCE | MAINTENANCE | Repairs, technical issues |
| Digital Menu | DIGITAL_MENU | DIGITAL_MENU | Restaurant menu access |
| Events & Packages | EVENTS | EVENTS | Event bookings |
| Feedback | FEEDBACK | FEEDBACK | Guest feedback/surveys |
| Concierge | CONCIERGE | CONCIERGE | Concierge services |
| Spa | SPA | SPA | Spa bookings |
| Laundry | LAUNDRY | LAUNDRY | Laundry services |

## Database Constraints

### Case-Insensitive Validation
- **Flexible Input:** Frontend can send any case (e.g., "housekeeping", "HOUSEKEEPING", "Housekeeping")
- **Auto-Normalized:** Database trigger `trigger_normalize_request_type` automatically converts to UPPERCASE
- **Validation:** Check constraint on `qr_requests.request_type` validates against uppercase values

### Migration Files
- `20250122_fix_request_type_case.sql` - Implements case-insensitive constraint and normalization trigger

## QR Code Types

### Room QR Codes
- **Location:** Placed in guest rooms
- **Properties:** Has `room_id` (references rooms table)
- **Validation:** Includes room number in guest portal
- **Use Case:** Room-specific service requests

### Location QR Codes
- **Location:** Common areas (lobby, pool, restaurant, gym)
- **Properties:** `room_id` is NULL
- **Validation:** No room number displayed
- **Use Case:** General facility service requests

## Database Functions

### validate_qr_and_create_session
- **Purpose:** Validates QR token and creates guest session
- **Handles:** Both room and location QR codes (NULL room_id)
- **Returns:** Session data including available services

### normalize_request_type
- **Purpose:** Converts request_type to uppercase
- **Trigger:** Runs before INSERT or UPDATE on qr_requests
- **Ensures:** Consistent storage format

## Edge Function Integration

### qr-unified-api
- **POST /validate:** Validates QR code, creates session
- **POST /request:** Creates service request with normalized type
- **Logging:** Detailed logs for validation success/failure

## Example Usage

### Frontend Service Request
```typescript
const createRequest = async (serviceName: string, data: any) => {
  // Frontend can send any case
  const response = await supabase.functions.invoke('qr-unified-api', {
    body: {
      action: 'request',
      sessionId: currentSession.id,
      requestType: serviceName, // e.g., "housekeeping" or "Housekeeping"
      requestData: data
    }
  });
};
```

### Backend Processing
```sql
-- Trigger automatically normalizes to uppercase
INSERT INTO qr_requests (request_type, ...)
VALUES ('housekeeping', ...);
-- Stored as: 'HOUSEKEEPING'
```

## Monitoring Queries

### Check Request Type Distribution
```sql
SELECT 
  request_type,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM qr_requests
WHERE created_at > now() - interval '24 hours'
GROUP BY request_type
ORDER BY total_requests DESC;
```

### Check QR Code Validation Success Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_valid = true) as successful_validations,
  COUNT(*) FILTER (WHERE is_valid = false) as failed_validations,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_valid = true) / COUNT(*), 2) as success_rate
FROM qr_scan_logs 
WHERE scanned_at > now() - interval '24 hours';
```

## Troubleshooting

### Issue: "Failed to validate QR code"
- **Cause:** QR code inactive, expired, or location QR with NULL room_id bug
- **Fix:** Migration `20250122_fix_location_qr_validation.sql` handles NULL room_id

### Issue: "Failed to submit request"
- **Cause:** Case mismatch between frontend service name and database constraint
- **Fix:** Migration `20250122_fix_request_type_case.sql` adds case-insensitive validation

### Issue: "Foreign key constraint violation on delete"
- **Cause:** Cannot delete QR code with active sessions/requests
- **Fix:** Migration `20250122_fix_qr_codes_cascade_delete.sql` adds CASCADE delete

## Best Practices

1. **Always use display names in frontend** - Let backend handle normalization
2. **Test with both room and location QR codes** - Ensure NULL room_id handling works
3. **Monitor validation success rates** - Use provided SQL queries
4. **Log edge function requests** - Enable detailed logging for debugging
5. **Cascade deletes carefully** - Understand data relationships before deleting QR codes
