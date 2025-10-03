# Phase 1: Real-Time Consolidation - Migration Guide

## Overview

Phase 1 consolidates three overlapping real-time hooks into a single, production-grade unified system that eliminates race conditions, reduces network overhead, and provides role-based filtering.

## What Changed

### Before (Issues)
- **3 separate hooks**: `useRealtimeUpdates`, `useTenantRealtime`, `useFrontDeskRealtimeUpdates`
- **Multiple channels per tenant**: Each hook created separate channels causing:
  - Race conditions (duplicate subscriptions)
  - Excessive re-renders (no debouncing)
  - Higher network usage (redundant connections)
  - Memory leaks (improper cleanup)

### After (Improvements)
- **1 unified hook**: `useUnifiedRealtime()`
- **Single channel per tenant-role**: Eliminates race conditions
- **Built-in debouncing**: Prevents excessive re-renders (300ms default, 500ms for payments)
- **Role-based filtering**: Each role only subscribes to relevant tables
- **Error recovery**: Exponential backoff reconnection (up to 5 attempts)
- **Proper cleanup**: All timeouts and channels cleaned up on unmount

## Migration Status

All components have been migrated to use `useUnifiedRealtime()`:

✅ **Migrated Components:**
- `FrontDeskDashboard.tsx` (was using `useTenantRealtime`)
- `owner/Dashboard.tsx` (was using `useRealtimeUpdates`)
- `housekeeping/ProductionDashboard.tsx` (was using `useRealtimeUpdates`)
- `maintenance/MaintenanceDashboard.tsx` (was using `useRealtimeUpdates`)
- `pos/PosLiveFeed.tsx` (was using `useRealtimeUpdates`)
- `notifications/NotificationCenter.tsx` (was using `useRealtimeUpdates`)
- `qr-portal/QRPortal.tsx` (was using `useRealtimeUpdates`)

⚠️ **Deprecated (will be removed in Phase 2):**
- `useRealtimeUpdates.ts`
- `useTenantRealtime.ts`
- `useFrontDeskRealtimeUpdates.ts`

## How to Use

### Basic Usage
```typescript
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';

function MyComponent() {
  // Enable with defaults (recommended)
  useUnifiedRealtime();
  
  // ... rest of your component
}
```

### Advanced Configuration
```typescript
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';

function MyComponent() {
  // Enable verbose logging for debugging
  const { isConnected, reconnectAttempts } = useUnifiedRealtime({ 
    verbose: true,           // Log all events (default: false)
    debounceDelay: 500,      // Custom debounce delay in ms (default: 300)
    roleBasedFiltering: true, // Enable role-based subscriptions (default: true)
    errorRecovery: true      // Enable auto-reconnection (default: true)
  });
  
  // Use connection state if needed
  if (!isConnected) {
    return <div>Connecting to real-time updates...</div>;
  }
  
  // ... rest of your component
}
```

## Role-Based Table Access

Each role automatically subscribes to only the tables they need:

| Role | Subscribed Tables |
|------|------------------|
| **FRONT_DESK** | rooms, reservations, folios, folio_charges, payments, guests, housekeeping_tasks, qr_requests |
| **OWNER** | All front desk tables + shift_sessions |
| **MANAGER** | Same as OWNER |
| **HOUSEKEEPING** | rooms, housekeeping_tasks, reservations |
| **POS** | menu_items, menu_categories, qr_requests, payments |
| **MAINTENANCE** | rooms, housekeeping_tasks |
| **SUPER_ADMIN** | All tables + audit_log |

## Debounce Groups

Related queries are invalidated together to maintain consistency:

- **payments**: payments, folios, folio-balances, billing, rooms, owner-overview (500ms delay)
- **folios**: folios, folio-balances, billing
- **rooms**: rooms, room-availability, room-types
- **reservations**: reservations, rooms, guests, group-reservations
- **guests**: guests, guest-search, recent-guests
- **housekeeping**: housekeeping-tasks, rooms
- **qr**: qr-requests, qr-orders

## Troubleshooting

### Issue: Real-time updates not working
**Solution**: Check browser console for connection status:
```typescript
const { isConnected, reconnectAttempts } = useUnifiedRealtime({ verbose: true });
console.log('Connected:', isConnected, 'Reconnect attempts:', reconnectAttempts);
```

### Issue: Too many re-renders
**Solution**: The hook already has debouncing built-in. If still seeing issues, increase the delay:
```typescript
useUnifiedRealtime({ debounceDelay: 1000 });
```

### Issue: Not receiving updates for certain tables
**Solution**: Check if your user role has access to those tables (see Role-Based Table Access above).

### Issue: Connection keeps dropping
**Solution**: The hook has automatic reconnection with exponential backoff. Check network connectivity.

## Performance Improvements

### Before Phase 1
- **Network**: 3+ channels per tenant = 3+ WebSocket connections
- **Re-renders**: No debouncing = 10+ re-renders per second during busy periods
- **Memory**: Channel cleanup issues causing leaks
- **Latency**: Race conditions causing stale data

### After Phase 1
- **Network**: 1 channel per tenant-role = single WebSocket connection
- **Re-renders**: Debounced to max 3-4 per second (300ms delay)
- **Memory**: Proper cleanup of all timeouts and channels
- **Latency**: Consistent state across all components

## Testing Checklist

✅ **Real-time sync works:**
- [ ] Open front desk in two browser tabs
- [ ] Check in a guest in tab 1
- [ ] Verify room status updates in tab 2 within 1 second

✅ **Debouncing prevents loops:**
- [ ] Make a payment
- [ ] Verify console shows only 1-2 invalidations (not 10+)

✅ **Role-based filtering works:**
- [ ] Log in as HOUSEKEEPING
- [ ] Verify they don't receive payment or folio events
- [ ] Verify they do receive room and task events

✅ **Error recovery works:**
- [ ] Disconnect network
- [ ] Wait 5 seconds
- [ ] Reconnect network
- [ ] Verify automatic reconnection within 2-4 seconds

✅ **Cleanup works:**
- [ ] Navigate to front desk
- [ ] Navigate away to another page
- [ ] Check browser console - no memory leaks or orphaned timeouts

## Next Steps: Phase 2

- Remove deprecated hooks (`useRealtimeUpdates`, `useTenantRealtime`, `useFrontDeskRealtimeUpdates`)
- Add network status indicator component
- Implement session heartbeat tracking
- Add conflict detection (optimistic locking)

## Questions?

If you encounter any issues with the unified real-time system, enable verbose logging and check the browser console for detailed connection and event information:

```typescript
useUnifiedRealtime({ verbose: true });
```
