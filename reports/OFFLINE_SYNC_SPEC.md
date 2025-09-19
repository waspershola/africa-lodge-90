# Offline Sync Specification

## Overview
Comprehensive offline-first architecture for hotel operations with conflict resolution and data consistency guarantees.

## Business Requirements

### Critical Offline Operations
1. **POS Orders** - Kitchen operations must continue during internet outages
2. **Room Check-ins/Check-outs** - Front desk operations cannot halt
3. **QR Service Requests** - Guest services must remain functional
4. **Housekeeping Task Updates** - Staff productivity tracking
5. **Maintenance Reports** - Equipment failure logging
6. **Cash Payments** - Payment recording and folio updates

### Offline Window Policy
- **Standard**: 8 hours offline capability
- **Extended**: 24 hours for remote properties
- **Emergency**: 72 hours with degraded functionality

## IndexedDB Schema

### 1. Action Queue Table
```typescript
interface OfflineAction {
  id: string; // UUID v4
  tenant_id: string;
  user_id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  local_id?: string; // Temporary ID for new records
  server_id?: string; // Actual server ID after sync
  data: Record<string, any>;
  conflict_resolution: 'server_wins' | 'client_wins' | 'manual';
  idempotency_key: string;
  created_at: number; // Unix timestamp
  sync_attempts: number;
  last_sync_attempt?: number;
  sync_status: 'pending' | 'synced' | 'conflict' | 'failed';
  error_message?: string;
}
```

### 2. Sync Metadata Table
```typescript
interface SyncMetadata {
  tenant_id: string;
  table_name: string;
  last_sync_token: string;
  last_sync_timestamp: number;
  pending_actions_count: number;
  last_successful_sync: number;
}
```

### 3. Conflict Resolution Table
```typescript
interface ConflictRecord {
  id: string;
  action_id: string;
  server_data: Record<string, any>;
  client_data: Record<string, any>;
  conflict_type: 'version' | 'data' | 'foreign_key';
  resolution_strategy: string;
  resolved: boolean;
  resolved_at?: number;
  resolution_data?: Record<string, any>;
}
```

## Sync Protocol

### 1. Client-to-Server Sync Endpoint
```
POST /api/hotel/:hotelId/offline/sync
Content-Type: application/json
Authentication: Bearer JWT
```

**Request Payload:**
```typescript
interface SyncRequest {
  last_sync_token: string;
  actions: OfflineAction[];
  device_id: string;
  sync_timestamp: number;
}
```

**Response Schema:**
```typescript
interface SyncResponse {
  sync_token: string;
  results: Array<{
    action_id: string;
    status: 'success' | 'conflict' | 'error';
    server_id?: string; // For successful INSERTs
    conflict_data?: {
      server_version: Record<string, any>;
      conflict_fields: string[];
    };
    error_message?: string;
  }>;
  server_changes: Array<{
    table_name: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    data: Record<string, any>;
    timestamp: number;
  }>;
}
```

### 2. Server Change Detection
```sql
-- Change tracking trigger function
CREATE OR REPLACE FUNCTION track_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO change_log (
    tenant_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_by,
    changed_at
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) END,
    auth.uid(),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to all syncable tables
CREATE TRIGGER rooms_changes AFTER INSERT OR UPDATE OR DELETE ON rooms
  FOR EACH ROW EXECUTE FUNCTION track_changes();
```

## Conflict Resolution Rules

### 1. Automatic Resolution Strategies

#### Server Wins (Default)
```typescript
const serverWinsConflict = (serverData: any, clientData: any) => {
  return {
    resolution: 'server_wins',
    final_data: serverData,
    reason: 'Server data is authoritative'
  };
};
```

#### Last Writer Wins
```typescript
const lastWriterWins = (serverData: any, clientData: any) => {
  const serverTimestamp = new Date(serverData.updated_at).getTime();
  const clientTimestamp = new Date(clientData.updated_at).getTime();
  
  return {
    resolution: clientTimestamp > serverTimestamp ? 'client_wins' : 'server_wins',
    final_data: clientTimestamp > serverTimestamp ? clientData : serverData,
    reason: `${clientTimestamp > serverTimestamp ? 'Client' : 'Server'} has newer timestamp`
  };
};
```

#### Field-level Merge
```typescript
const fieldLevelMerge = (serverData: any, clientData: any, rules: Record<string, 'server' | 'client' | 'sum'>) => {
  const merged = { ...serverData };
  
  Object.entries(rules).forEach(([field, strategy]) => {
    switch (strategy) {
      case 'client':
        merged[field] = clientData[field];
        break;
      case 'sum':
        merged[field] = (serverData[field] || 0) + (clientData[field] || 0);
        break;
      // 'server' is default (no change needed)
    }
  });
  
  return {
    resolution: 'merged',
    final_data: merged,
    reason: 'Field-level merge applied'
  };
};
```

### 2. Business Logic Specific Rules

#### Folio Charges - Additive Conflict Resolution
```typescript
const resolveFolioCharges = (serverCharges: any[], clientCharges: any[]) => {
  // Merge charges, avoiding duplicates by idempotency key
  const allCharges = [...serverCharges];
  const existingKeys = new Set(serverCharges.map(c => c.idempotency_key));
  
  clientCharges.forEach(charge => {
    if (!existingKeys.has(charge.idempotency_key)) {
      allCharges.push(charge);
    }
  });
  
  return allCharges;
};
```

#### Room Status - Priority-based Resolution
```typescript
const roomStatusPriority = {
  'out_of_order': 5,
  'maintenance': 4,
  'dirty': 3,
  'occupied': 2,
  'available': 1
};

const resolveRoomStatus = (serverStatus: string, clientStatus: string) => {
  const serverPriority = roomStatusPriority[serverStatus] || 0;
  const clientPriority = roomStatusPriority[clientStatus] || 0;
  
  return {
    final_status: serverPriority >= clientPriority ? serverStatus : clientStatus,
    reason: 'Higher priority status takes precedence'
  };
};
```

## Implementation Architecture

### 1. Service Worker for Background Sync
```typescript
// sw.js - Service Worker
self.addEventListener('sync', event => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  const db = await openDB();
  const pendingActions = await db.getAll('offline_actions', IDBKeyRange.only('pending'));
  
  if (pendingActions.length > 0) {
    try {
      await syncToServer(pendingActions);
    } catch (error) {
      console.error('Background sync failed:', error);
      // Schedule retry
      await self.registration.sync.register('offline-sync');
    }
  }
}
```

### 2. React Hook for Offline Operations
```typescript
export const useOfflineSync = (tenant_id: string) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const queueAction = useCallback(async (
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    conflictResolution: 'server_wins' | 'client_wins' = 'server_wins'
  ) => {
    const action: OfflineAction = {
      id: generateUUID(),
      tenant_id,
      user_id: getCurrentUserId(),
      table_name: table,
      operation,
      data,
      conflict_resolution: conflictResolution,
      idempotency_key: generateIdempotencyKey(table, operation, data),
      created_at: Date.now(),
      sync_attempts: 0,
      sync_status: 'pending'
    };

    await storeOfflineAction(action);
    setPendingActions(prev => prev + 1);

    // Attempt immediate sync if online
    if (isOnline) {
      attemptSync();
    }
  }, [tenant_id, isOnline]);

  return {
    isOnline,
    pendingActions,
    lastSync,
    queueAction,
    forceSync: attemptSync
  };
};
```

### 3. Optimistic UI Updates
```typescript
export const useOptimisticMutation = <T>(
  mutationFn: (data: T) => Promise<T>,
  optimisticUpdate: (current: T[], data: T) => T[]
) => {
  const [data, setData] = useState<T[]>([]);
  const [isOffline] = useOfflineMode();

  const mutate = async (newData: T) => {
    // Apply optimistic update immediately
    setData(current => optimisticUpdate(current, newData));

    try {
      if (isOffline) {
        // Queue for later sync
        await queueOfflineAction('table_name', 'INSERT', newData);
      } else {
        // Attempt immediate server update
        const result = await mutationFn(newData);
        setData(current => 
          current.map(item => 
            item.id === result.id ? result : item
          )
        );
      }
    } catch (error) {
      // Revert optimistic update on failure
      setData(current => 
        current.filter(item => item.id !== newData.id)
      );
      throw error;
    }
  };

  return { data, mutate };
};
```

## Error Handling & Recovery

### 1. Sync Error Categories
```typescript
enum SyncErrorType {
  NETWORK_ERROR = 'network_error',           // Retry with backoff
  AUTHENTICATION_ERROR = 'auth_error',       // Re-authenticate
  VALIDATION_ERROR = 'validation_error',     // Data format issues
  CONFLICT_ERROR = 'conflict_error',         // Manual resolution needed
  FOREIGN_KEY_ERROR = 'fk_error',           // Dependency missing
  BUSINESS_RULE_ERROR = 'business_rule_error' // Custom validation failed
}
```

### 2. Recovery Strategies
```typescript
const errorRecoveryStrategies = {
  [SyncErrorType.NETWORK_ERROR]: {
    maxRetries: 5,
    backoffMultiplier: 2,
    initialDelay: 1000
  },
  [SyncErrorType.AUTHENTICATION_ERROR]: {
    maxRetries: 1,
    requiresUserAction: true,
    action: 'reauthenticate'
  },
  [SyncErrorType.VALIDATION_ERROR]: {
    maxRetries: 0,
    requiresUserAction: true,
    action: 'fix_data'
  },
  [SyncErrorType.CONFLICT_ERROR]: {
    maxRetries: 0,
    requiresUserAction: true,
    action: 'resolve_conflict'
  }
};
```

## Monitoring & Analytics

### 1. Offline Usage Metrics
```typescript
interface OfflineMetrics {
  tenant_id: string;
  offline_duration_seconds: number;
  actions_queued: number;
  actions_synced: number;
  conflicts_encountered: number;
  sync_failures: number;
  last_sync_latency_ms: number;
  device_info: {
    user_agent: string;
    connection_type: string;
    storage_quota_mb: number;
  };
}
```

### 2. Sync Performance Dashboard
- Average sync duration per tenant
- Conflict resolution success rates
- Most common conflict types
- Offline usage patterns
- Storage quota utilization

## Security Considerations

### 1. Data Encryption at Rest
```typescript
// Encrypt sensitive data in IndexedDB
const encryptData = async (data: any, key: CryptoKey): Promise<string> => {
  const dataString = JSON.stringify(data);
  const encodedData = new TextEncoder().encode(dataString);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};
```

### 2. Action Signing
```typescript
// Sign actions to prevent tampering
const signAction = async (action: OfflineAction, privateKey: CryptoKey): Promise<string> => {
  const actionString = JSON.stringify(action);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(actionString)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};
```

## Testing Strategy

### 1. Offline Simulation
```typescript
// Network simulation for testing
export class NetworkSimulator {
  private isOffline = false;
  
  goOffline() {
    this.isOffline = true;
    window.dispatchEvent(new Event('offline'));
  }
  
  goOnline() {
    this.isOffline = false;
    window.dispatchEvent(new Event('online'));
  }
  
  simulateSlowConnection(delayMs: number) {
    // Intercept fetch and add delay
  }
}
```

### 2. Conflict Testing Scenarios
1. **Concurrent Updates**: Same record modified offline and online
2. **Delete vs Update**: Record deleted on server, updated offline
3. **Foreign Key Conflicts**: Referenced record deleted
4. **Data Type Conflicts**: Field type changes during offline period
5. **Business Rule Violations**: Offline action violates server-side constraints

### 3. Performance Testing
- Sync performance with large action queues (1000+ actions)
- IndexedDB performance with large datasets
- Memory usage during extended offline periods
- Battery impact of background sync

## Deployment & Configuration

### 1. Feature Flags
```typescript
const offlineConfig = {
  enabled: true,
  maxOfflineHours: 24,
  maxActionQueueSize: 10000,
  syncIntervalMs: 30000,
  enableOptimisticUpdates: true,
  conflictResolutionUI: true
};
```

### 2. Progressive Enhancement
- Graceful degradation when IndexedDB unavailable
- Fallback to localStorage for critical operations
- Clear user messaging about offline capabilities
- Bandwidth-aware sync (WiFi vs cellular)

This offline sync specification ensures hotel operations can continue seamlessly during connectivity issues while maintaining data consistency and providing clear conflict resolution mechanisms.