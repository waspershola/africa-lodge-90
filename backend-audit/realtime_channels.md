# Realtime Channels Configuration

## Overview
Supabase Realtime channels for live updates across hotel operations. All channels are tenant-scoped for security.

## Channel Definitions

### 1. QR Orders Channel
```
Channel: hotel_{tenant_id}_qr_orders
Table: qr_orders
Events: INSERT, UPDATE
```

**Payload Schema:**
```json
{
  "id": "uuid",
  "qr_code_id": "uuid", 
  "room_id": "uuid",
  "guest_session_id": "string",
  "service_type": "housekeeping|maintenance|room_service|wifi",
  "status": "pending|assigned|in_progress|completed|cancelled",
  "request_details": "jsonb",
  "assigned_to": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Frontend Subscriptions:**
- `FrontDeskDashboard` - Show new QR requests
- `HousekeepingDashboard` - Show assigned housekeeping tasks
- `MaintenanceDashboard` - Show assigned maintenance requests
- `QRRequestsPanel` - Real-time status updates

### 2. POS Orders Channel  
```
Channel: hotel_{tenant_id}_pos_orders
Table: pos_orders
Events: INSERT, UPDATE
```

**Payload Schema:**
```json
{
  "id": "uuid",
  "order_number": "string",
  "room_id": "uuid", 
  "order_type": "room_service|restaurant|takeaway",
  "status": "pending|preparing|ready|served|cancelled",
  "items": "jsonb[]",
  "total_amount": "decimal",
  "payment_status": "pending|paid|refunded",
  "assigned_chef": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Frontend Subscriptions:**
- `KDSBoard` - Kitchen display updates
- `PosLiveFeed` - Live order tracking
- `FrontDeskDashboard` - Room service status

### 3. Room Status Channel
```
Channel: hotel_{tenant_id}_rooms
Table: rooms  
Events: UPDATE
```

**Payload Schema:**
```json
{
  "id": "uuid",
  "room_number": "string",
  "status": "available|occupied|dirty|maintenance|out_of_order",
  "guest_id": "uuid",
  "housekeeping_status": "clean|dirty|in_progress|inspected",
  "maintenance_notes": "text",
  "updated_at": "timestamp"
}
```

**Frontend Subscriptions:**
- `RoomGrid` - Live room status updates
- `HousekeepingDashboard` - Room cleaning status
- `MaintenanceDashboard` - Maintenance alerts

### 4. Folio Updates Channel
```
Channel: hotel_{tenant_id}_folios
Table: folios, folio_charges
Events: INSERT, UPDATE
```

**Payload Schema:**
```json
{
  "folio_id": "uuid",
  "room_id": "uuid",
  "guest_name": "string",
  "total_charges": "decimal",
  "total_payments": "decimal", 
  "balance": "decimal",
  "status": "open|closed|pending_payment",
  "last_charge": {
    "description": "string",
    "amount": "decimal",
    "created_at": "timestamp"
  }
}
```

**Frontend Subscriptions:**
- `BillingOverview` - Live folio updates
- `CheckoutDialog` - Real-time balance calculation

### 5. Staff Notifications Channel
```
Channel: hotel_{tenant_id}_notifications
Table: staff_notifications
Events: INSERT
```

**Payload Schema:**
```json
{
  "id": "uuid",
  "recipient_id": "uuid",
  "title": "string",
  "message": "string", 
  "type": "qr_request|maintenance_urgent|checkout_ready|audit_alert",
  "priority": "low|medium|high|urgent",
  "read": "boolean",
  "created_at": "timestamp"
}
```

**Frontend Subscriptions:**
- All staff dashboards for role-based notifications

## Supabase Setup Instructions

### 1. Enable Realtime Replication
```sql
-- Enable realtime for required tables
ALTER PUBLICATION supabase_realtime ADD TABLE qr_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE pos_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE folios;
ALTER PUBLICATION supabase_realtime ADD TABLE folio_charges;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_notifications;
```

### 2. Row Level Security for Realtime
```sql
-- Ensure RLS policies apply to realtime subscriptions
-- Users can only subscribe to their tenant's channels
CREATE POLICY "Realtime tenant isolation" ON qr_orders
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR
    (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
  );

-- Repeat for all realtime tables
```

### 3. Frontend Channel Subscription Pattern
```typescript
// useRealtimeSubscription hook
export const useRealtimeSubscription = (
  table: string,
  tenant_id: string,
  callback: (payload: any) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel(`hotel_${tenant_id}_${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `tenant_id=eq.${tenant_id}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, tenant_id, callback]);
};
```

## Security Considerations

1. **Tenant Isolation**: All channels include tenant_id filter
2. **Role-based Access**: Staff only receive notifications for their role
3. **Data Minimization**: Only essential fields in payloads
4. **Connection Limits**: Monitor concurrent connections per tenant
5. **Rate Limiting**: Prevent abuse via excessive subscriptions

## Monitoring & Analytics

- Track channel subscription counts per tenant
- Monitor message frequency and payload sizes
- Alert on connection failures or high latency
- Audit realtime access patterns for security

## Testing

Test realtime functionality with:
1. Multiple browser tabs simulating different staff roles
2. Network disconnection/reconnection scenarios  
3. High-frequency updates (stress testing)
4. Cross-tenant isolation verification