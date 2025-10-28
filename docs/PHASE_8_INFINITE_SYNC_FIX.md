# Phase 8: Infinite Syncing Loop Fix

## Problem
Multiple visibility change handlers (`TabRehydrationManager`, `useNetworkStatus`, `useSessionHeartbeat`) were competing and creating infinite retry loops when:
- Tab became visible after being inactive
- Token refresh was slow or failed
- Network connection tests failed

This caused the "Refreshing session..." indicator to loop infinitely.

## Root Cause
Three separate `visibilitychange` event listeners were all trying to:
1. Check session health
2. Test connection
3. Refresh tokens
4. Update network status

When one failed, it triggered retries that conflicted with the others, creating an infinite loop.

## Solution: Option A - Remove Conflicting Handlers

Centralized all rehydration logic in `TabRehydrationManager` and removed duplicate handlers.

### Changes Made

#### 1. `src/hooks/useNetworkStatus.ts`
**Removed**: 
- Visibility change handler (lines 67-112)
- Connection test with retry logic
- Infinite loop trigger

**Added**:
- Custom event listener for status updates from `TabRehydrationManager`
- Simple browser online/offline detection only

```typescript
// Phase 8: Listen for status updates from TabRehydrationManager
useEffect(() => {
  const handleStatusUpdate = (event: CustomEvent) => {
    const { status, message } = event.detail;
    setState(prev => ({
      ...prev,
      status,
      errorMessage: message || null,
      lastSyncAt: status === 'online' ? new Date() : prev.lastSyncAt
    }));
  };

  window.addEventListener('network-status-update', handleStatusUpdate as EventListener);
  return () => {
    window.removeEventListener('network-status-update', handleStatusUpdate as EventListener);
  };
}, []);
```

#### 2. `src/hooks/useSessionHeartbeat.ts`
**Removed**:
- Visibility change handler (lines 108-117)
- Immediate session check on tab visibility

**Kept**:
- Periodic interval-based checks (every 15 minutes)
- Session refresh logic

```typescript
// Phase 8: Removed visibility handler - TabRehydrationManager handles this
// Only periodic checks now to avoid conflict
```

#### 3. `src/App.tsx` - Enhanced `TabRehydrationManager`
**Added**:
- 500ms debouncing for rapid tab switches
- Network status update events (syncing → online/error)
- Single source of truth for rehydration

```typescript
// Phase 8: Enhanced Tab Rehydration with Network Status Updates
const TabRehydrationManager = () => {
  useEffect(() => {
    let isRehydrating = false;
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const handleVisibilityChange = async () => {
      // Debounce rapid visibility changes
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      debounceTimeout = setTimeout(async () => {
        if (document.visibilityState === 'visible' && !isRehydrating) {
          isRehydrating = true;
          
          // Show syncing indicator
          const syncEvent = new CustomEvent('network-status-update', { 
            detail: { status: 'syncing' } 
          });
          window.dispatchEvent(syncEvent);
          
          try {
            // Token refresh logic...
            
            // Update network status to online
            const onlineEvent = new CustomEvent('network-status-update', { 
              detail: { status: 'online' } 
            });
            window.dispatchEvent(onlineEvent);
            
          } catch (error) {
            // Update network status to error
            const errorEvent = new CustomEvent('network-status-update', { 
              detail: { status: 'error', message: 'Connection failed' } 
            });
            window.dispatchEvent(errorEvent);
          } finally {
            isRehydrating = false;
          }
        }
      }, 500); // 500ms debounce
    };
    
    // ... rest of handler
  }, []);
};
```

## Architecture

### Before (3 Competing Handlers)
```
Tab Visible Event
    ├─→ TabRehydrationManager → Token refresh
    ├─→ useNetworkStatus → Connection test → RETRY LOOP
    └─→ useSessionHeartbeat → Session check
         ↓
    CONFLICT & INFINITE LOOP
```

### After (Single Coordinator)
```
Tab Visible Event (debounced 500ms)
    ↓
TabRehydrationManager (single handler)
    ├─→ Token refresh
    ├─→ Client reinit
    ├─→ Query invalidation
    └─→ Dispatch custom events
         ↓
    useNetworkStatus (listens passively)
    ↓
NetworkStatusIndicator updates UI
```

## Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Tab visible after 10 min | ❌ Infinite "syncing" loop | ✅ Shows "syncing" 2-3s → "online" |
| Tab visible with stale token | ❌ Retry loop, queries fail | ✅ Token refreshes → queries succeed |
| Network reconnect | ❌ Competing handlers | ✅ Single coordinated refresh |
| Rapid tab switching | ❌ Multiple concurrent refreshes | ✅ Debounced, single refresh |
| Tab inactive 65+ min (expired) | ❌ Infinite spinner | ✅ "Session expired" toast → login |

## Testing Checklist

- [ ] Background tab 10 min → return → shows "syncing" briefly then works
- [ ] Background tab 65 min (token expired) → return → shows clear "session expired" message
- [ ] Disconnect network → reconnect → no infinite loop
- [ ] Rapidly switch between tabs → debounced, single refresh only
- [ ] Console: No repeated "Tab visible" logs every 2 seconds
- [ ] Guest search immediately after tab visible → succeeds
- [ ] Room actions after tab wake → all work correctly
- [ ] Multiple rapid actions after tab visible → all succeed

## Console Log Verification

### Good Signs (Fixed):
```
[TabRehydration] Tab became visible - full rehydration
[TabRehydration] Token refreshed successfully
[TabRehydration] Supabase client reinitialized
[TabRehydration] Rehydration complete - app ready
[NetworkStatus] Received update from TabRehydration: online
```

### Bad Signs (Still Broken):
```
[NetworkStatus] Connection test failed: ...
[NetworkStatus] Tab visible - validating connection (repeating)
[SessionHeartbeat] Tab visible - checking session immediately (repeating)
```

## Key Benefits

1. **No More Infinite Loops**: Single rehydration handler eliminates conflicts
2. **Faster**: One coordinated process instead of three competing ones
3. **Debounced**: 500ms delay prevents rapid-fire events
4. **Clear Status**: Network indicator accurately reflects rehydration state
5. **Maintainable**: Single source of truth for tab reactivation logic

## Related Files

- `src/App.tsx` - TabRehydrationManager (centralized coordinator)
- `src/hooks/useNetworkStatus.ts` - Simplified to event listener only
- `src/hooks/useSessionHeartbeat.ts` - Periodic checks only (no visibility handler)
- `src/components/ui/NetworkStatusIndicator.tsx` - Visual feedback component
- `docs/PHASE_7_IMPLEMENTATION.md` - Previous token validation work
