import { describe, it, expect } from 'vitest'

// Mock interfaces for offline sync testing
interface Charge {
  id: string
  amount: number
  idempotency_key: string
  description?: string
}

interface ConflictData {
  server_data: {
    status: string
    updated_at: string
  }
  client_data: {
    status: string
    updated_at: string
  }
}

interface ConflictResolution {
  final_data: {
    status: string
    updated_at: string
  }
  resolution: 'server_wins' | 'client_wins' | 'merged'
  reason: string
}

// Offline sync utilities
function resolveFolioCharges(serverCharges: Charge[], clientCharges: Charge[]): Charge[] {
  const chargeMap = new Map<string, Charge>()
  
  // Add server charges first
  serverCharges.forEach(charge => {
    chargeMap.set(charge.idempotency_key, charge)
  })
  
  // Add client charges, avoiding duplicates based on idempotency key
  clientCharges.forEach(charge => {
    if (!chargeMap.has(charge.idempotency_key)) {
      chargeMap.set(charge.idempotency_key, charge)
    }
  })
  
  return Array.from(chargeMap.values())
}

function resolveRoomStatusConflict(conflict: ConflictData): ConflictResolution {
  const serverTime = new Date(conflict.server_data.updated_at).getTime()
  const clientTime = new Date(conflict.client_data.updated_at).getTime()
  
  // For room status, server always wins due to potential maintenance issues
  if (conflict.server_data.status === 'maintenance') {
    return {
      final_data: conflict.server_data,
      resolution: 'server_wins',
      reason: 'Maintenance status has priority for safety'
    }
  }
  
  // Otherwise, use timestamp-based resolution
  if (serverTime >= clientTime) {
    return {
      final_data: conflict.server_data,
      resolution: 'server_wins',
      reason: 'Server data is newer or equal'
    }
  } else {
    return {
      final_data: conflict.client_data,
      resolution: 'client_wins',
      reason: 'Client data is newer'
    }
  }
}

function generateIdempotencyKey(operation: string, resourceId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${operation}_${resourceId}_${timestamp}_${random}`
}

function isExpiredAction(actionTimestamp: string, maxAgeHours: number = 24): boolean {
  const actionTime = new Date(actionTimestamp).getTime()
  const maxAge = maxAgeHours * 60 * 60 * 1000
  return Date.now() - actionTime > maxAge
}

describe('Conflict Resolution', () => {
  it('should resolve folio charge conflicts additively', () => {
    const serverCharges: Charge[] = [
      { id: '1', amount: 1000, idempotency_key: 'charge-1', description: 'Room service' }
    ]
    const clientCharges: Charge[] = [
      { id: '2', amount: 500, idempotency_key: 'charge-2', description: 'Minibar' },
      { id: '3', amount: 1000, idempotency_key: 'charge-1', description: 'Room service' } // Duplicate
    ]

    const resolved = resolveFolioCharges(serverCharges, clientCharges)
    
    expect(resolved).toHaveLength(2)
    expect(resolved.find(c => c.idempotency_key === 'charge-1')).toBeDefined()
    expect(resolved.find(c => c.idempotency_key === 'charge-2')).toBeDefined()
    
    // Verify server version is kept for duplicates
    const charge1 = resolved.find(c => c.idempotency_key === 'charge-1')
    expect(charge1?.id).toBe('1') // Server version
  })

  it('should apply server-wins for room status conflicts with maintenance', () => {
    const conflict: ConflictData = {
      server_data: { status: 'maintenance', updated_at: '2024-01-02T09:00:00Z' },
      client_data: { status: 'available', updated_at: '2024-01-02T10:00:00Z' }
    }

    const resolved = resolveRoomStatusConflict(conflict)
    
    expect(resolved.final_data.status).toBe('maintenance')
    expect(resolved.resolution).toBe('server_wins')
    expect(resolved.reason).toContain('Maintenance status has priority')
  })

  it('should apply timestamp-based resolution for non-maintenance conflicts', () => {
    const conflict: ConflictData = {
      server_data: { status: 'occupied', updated_at: '2024-01-02T10:00:00Z' },
      client_data: { status: 'available', updated_at: '2024-01-02T09:00:00Z' }
    }

    const resolved = resolveRoomStatusConflict(conflict)
    
    expect(resolved.final_data.status).toBe('occupied')
    expect(resolved.resolution).toBe('server_wins')
    expect(resolved.reason).toContain('Server data is newer')
  })

  it('should apply client-wins when client data is newer', () => {
    const conflict: ConflictData = {
      server_data: { status: 'available', updated_at: '2024-01-02T09:00:00Z' },
      client_data: { status: 'occupied', updated_at: '2024-01-02T10:00:00Z' }
    }

    const resolved = resolveRoomStatusConflict(conflict)
    
    expect(resolved.final_data.status).toBe('occupied')
    expect(resolved.resolution).toBe('client_wins')
    expect(resolved.reason).toContain('Client data is newer')
  })
})

describe('Idempotency Key Generation', () => {
  it('should generate unique idempotency keys', () => {
    const key1 = generateIdempotencyKey('charge', 'folio-123')
    const key2 = generateIdempotencyKey('charge', 'folio-123')
    
    expect(key1).not.toBe(key2)
    expect(key1).toMatch(/^charge_folio-123_\d+_[a-z0-9]{6}$/)
  })

  it('should include operation and resource in key', () => {
    const key = generateIdempotencyKey('payment', 'folio-456')
    
    expect(key).toContain('payment')
    expect(key).toContain('folio-456')
  })

  it('should generate keys with consistent format', () => {
    const operations = ['charge', 'payment', 'room_update', 'task_complete']
    const resources = ['folio-123', 'room-456', 'task-789']
    
    operations.forEach(op => {
      resources.forEach(res => {
        const key = generateIdempotencyKey(op, res)
        expect(key).toMatch(/^[a-z_]+_[a-z0-9-]+_\d+_[a-z0-9]{6}$/)
      })
    })
  })
})

describe('Action Expiration', () => {
  it('should identify expired actions', () => {
    const expiredAction = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
    const recentAction = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    
    expect(isExpiredAction(expiredAction, 24)).toBe(true)
    expect(isExpiredAction(recentAction, 24)).toBe(false)
  })

  it('should handle custom expiration windows', () => {
    const action6HoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    
    expect(isExpiredAction(action6HoursAgo, 4)).toBe(true)  // 4-hour window
    expect(isExpiredAction(action6HoursAgo, 8)).toBe(false) // 8-hour window
  })

  it('should handle edge cases', () => {
    const exactlyMaxAge = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const futureAction = new Date(Date.now() + 1000).toISOString() // 1 second in future
    
    expect(isExpiredAction(exactlyMaxAge, 24)).toBe(false) // Exactly at limit
    expect(isExpiredAction(futureAction, 24)).toBe(false)  // Future actions not expired
  })
})

describe('Offline Queue Management', () => {
  interface OfflineAction {
    id: string
    table_name: string
    action_type: string
    data: Record<string, any>
    timestamp: string
    retry_count: number
    max_retries: number
  }

  function prioritizeOfflineActions(actions: OfflineAction[]): OfflineAction[] {
    // Priority order: payments > charges > room updates > other
    const priority = {
      'payments': 1,
      'folio_charges': 2,
      'rooms': 3
    }
    
    return actions.sort((a, b) => {
      const aPriority = priority[a.table_name as keyof typeof priority] || 999
      const bPriority = priority[b.table_name as keyof typeof priority] || 999
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Same priority: sort by timestamp (oldest first)
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })
  }

  function shouldRetryAction(action: OfflineAction): boolean {
    return action.retry_count < action.max_retries && !isExpiredAction(action.timestamp, 24)
  }

  it('should prioritize critical operations', () => {
    const actions: OfflineAction[] = [
      { id: '1', table_name: 'housekeeping_tasks', action_type: 'INSERT', data: {}, timestamp: '2024-01-01T10:00:00Z', retry_count: 0, max_retries: 3 },
      { id: '2', table_name: 'payments', action_type: 'INSERT', data: {}, timestamp: '2024-01-01T11:00:00Z', retry_count: 0, max_retries: 3 },
      { id: '3', table_name: 'folio_charges', action_type: 'INSERT', data: {}, timestamp: '2024-01-01T09:00:00Z', retry_count: 0, max_retries: 3 },
      { id: '4', table_name: 'rooms', action_type: 'UPDATE', data: {}, timestamp: '2024-01-01T08:00:00Z', retry_count: 0, max_retries: 3 }
    ]

    const prioritized = prioritizeOfflineActions(actions)
    
    expect(prioritized[0].table_name).toBe('payments')      // Highest priority
    expect(prioritized[1].table_name).toBe('folio_charges') // Second priority  
    expect(prioritized[2].table_name).toBe('rooms')         // Third priority
    expect(prioritized[3].table_name).toBe('housekeeping_tasks') // Lowest priority
  })

  it('should consider retry limits', () => {
    const maxRetriesReached: OfflineAction = {
      id: '1', table_name: 'payments', action_type: 'INSERT', data: {},
      timestamp: '2024-01-01T10:00:00Z', retry_count: 3, max_retries: 3
    }
    
    const canRetry: OfflineAction = {
      id: '2', table_name: 'payments', action_type: 'INSERT', data: {},
      timestamp: '2024-01-01T10:00:00Z', retry_count: 1, max_retries: 3
    }

    expect(shouldRetryAction(maxRetriesReached)).toBe(false)
    expect(shouldRetryAction(canRetry)).toBe(true)
  })
})
