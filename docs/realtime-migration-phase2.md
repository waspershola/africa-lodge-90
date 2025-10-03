# Phase 2: Network Status & UI Feedback - Migration Guide

## Overview

Phase 2 implements professional network status monitoring with visual feedback, replacing the mock "Simulate Offline" button with real browser-based online/offline detection.

## What Changed

### Before (Issues)
- **Mock offline mode**: "Simulate Offline" button that didn't reflect actual network status
- **No visual feedback**: Users couldn't tell if they were truly online or offline
- **Manual state management**: Each component managed its own offline state
- **No sync indicators**: Users didn't know when data was syncing

### After (Improvements)
- **Real network detection**: Automatic browser `online`/`offline` event listening
- **Visual status indicator**: Compact badge showing 🟢 Online / 🔴 Offline / 🔄 Syncing / ⚠️ Error
- **Centralized status hook**: `useNetworkStatus()` provides single source of truth
- **Professional UX**: Matches industry-standard PMS systems (Opera, Mews, Cloudbeds)

## Components Added

### 1. `useNetworkStatus` Hook
Location: `src/hooks/useNetworkStatus.ts`

Provides centralized network state management:
- Listens to browser `online`/`offline` events
- Tracks last sync timestamp
- Manages syncing state
- Handles error states

**API:**
```typescript
const {
  status,           // 'online' | 'offline' | 'syncing' | 'error'
  isOnline,         // boolean
  lastSyncAt,       // Date | null
  errorMessage,     // string | null
  setStatus,        // (status: NetworkStatus) => void
  setSyncing,       // (syncing: boolean) => void
  setError,         // (error: string | null) => void
  updateLastSync    // () => void
} = useNetworkStatus();
```

### 2. `NetworkStatusBanner` Component
Location: `src/components/common/NetworkStatusBanner.tsx`

Two variants:
- **Full Banner**: Shows detailed status with icon, title, and message
- **Compact Indicator**: Small badge for headers/toolbars

**Usage:**
```typescript
import { NetworkStatusBanner, NetworkStatusIndicator } from '@/components/common/NetworkStatusBanner';

// Full banner (auto-hides when online)
<NetworkStatusBanner />

// Compact indicator for headers
<NetworkStatusIndicator />
```

## Migration Status

✅ **Updated Components:**
- `FrontDeskDashboard.tsx`:
  - Removed `isOffline` and `offlineTimeRemaining` state
  - Removed `useEffect` for online/offline events
  - Removed mock offline banner
  - Removed "Simulate Offline" button
  - Added `NetworkStatusIndicator` in header

## Status Indicators

### 🟢 Online (Hidden by default)
- Shows only when explicitly needed
- Auto-hides after stable connection
- Last sync timestamp displayed

### 🔴 Offline
```
┌─────────────────────────────────────┐
│ 📶 Offline                          │
│ Working locally - changes will      │
│ sync when online          Local Mode│
└─────────────────────────────────────┘
```

### 🔄 Syncing
```
┌─────────────────────────────────────┐
│ ⟳ Syncing                          │
│ Synchronizing data...               │
└─────────────────────────────────────┘
```

### ⚠️ Error
```
┌─────────────────────────────────────┐
│ ⚠ Connection Issue                  │
│ Retrying connection...              │
└─────────────────────────────────────┘
```

## Compact Indicator (Header)

Used in `FrontDeskDashboard` header:
```tsx
<NetworkStatusIndicator />
```

Renders as small badge:
- `🟢 Online` - Hidden (only shows when recovering)
- `🔴 Offline` - Red badge
- `🔄 Syncing` - Blue badge with spinner
- `⚠️ Error` - Orange badge

## Behavior Details

### Automatic Transitions
1. **Browser goes offline** → Status changes to `offline` immediately
2. **Browser comes online** → Status changes to `syncing` for 2 seconds
3. **Sync complete** → Status changes to `online` (banner auto-hides)

### Error Recovery
- Errors display orange banner with retry message
- Auto-clears when connection restored
- Exponential backoff handled by Phase 1's `useUnifiedRealtime`

### Last Sync Timestamp
- Updates on successful data sync
- Shows relative time (e.g., "2 minutes ago")
- Uses `date-fns` for human-readable formatting

## Testing Checklist

✅ **Network Detection:**
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Verify indicator shows `🔴 Offline` immediately
- [ ] Restore connection
- [ ] Verify indicator shows `🔄 Syncing` then disappears

✅ **Visual States:**
- [ ] All 4 states render correctly (online, offline, syncing, error)
- [ ] Colors match design system (HSL semantic tokens)
- [ ] Animations are smooth (fade in/out)
- [ ] Text is readable in light and dark mode

✅ **Browser Events:**
- [ ] Airplane mode triggers offline state
- [ ] WiFi disconnect triggers offline state
- [ ] Reconnection triggers syncing then online

✅ **Integration:**
- [ ] Front desk dashboard shows indicator in header
- [ ] Indicator doesn't block other header items
- [ ] Mobile responsive (compact mode)

## Code Examples

### Basic Usage in Any Component
```typescript
import { NetworkStatusBanner } from '@/components/common/NetworkStatusBanner';

function MyComponent() {
  return (
    <div>
      <NetworkStatusBanner />
      {/* Your component content */}
    </div>
  );
}
```

### Header/Toolbar Usage
```typescript
import { NetworkStatusIndicator } from '@/components/common/NetworkStatusBanner';

function AppHeader() {
  return (
    <header className="flex items-center gap-3 p-4">
      <Search />
      <Notifications />
      <NetworkStatusIndicator /> {/* Compact badge */}
    </header>
  );
}
```

### Custom Styling
```typescript
<NetworkStatusBanner className="mb-4" />
<NetworkStatusIndicator className="ml-auto" />
```

## Performance

- **Minimal re-renders**: Only updates on actual network state changes
- **Auto-cleanup**: Event listeners properly removed on unmount
- **Debounced transitions**: 2s delay prevents UI flicker
- **Conditional rendering**: Hidden when status is stable online

## Design System Compliance

All colors use HSL semantic tokens from `index.css`:
- 🟢 Success: `bg-green-500/10`, `text-green-600`, `border-green-500/20`
- 🔴 Destructive: `bg-destructive/10`, `text-destructive`, `border-destructive/20`
- 🔄 Primary: `bg-primary/10`, `text-primary`, `border-primary/20`
- ⚠️ Warning: `bg-orange-500/10`, `text-orange-600`, `border-orange-500/20`

## Next Steps: Phase 3

- Implement `user_sessions` table
- Add session heartbeat tracking
- Build multi-device session management
- Add session revocation for Super Admin

## Questions?

The network status system is fully automatic. If you need to manually control the status (e.g., for testing), you can use the hook directly:

```typescript
const { setStatus, setSyncing, setError } = useNetworkStatus();

// Manually set status
setStatus('offline');
setSyncing(true);
setError('Custom error message');
```
