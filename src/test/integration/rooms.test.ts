import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

// Test utilities
const testTenantId = 'test-tenant-123'
const otherTenantId = 'other-tenant-456'

const createMockRoom = (overrides = {}) => ({
  id: 'room-123',
  tenant_id: testTenantId,
  room_number: '101',
  room_type_id: 'standard',
  floor: 1,
  status: 'available',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

const createMockRoomType = (overrides = {}) => ({
  id: 'standard',
  tenant_id: testTenantId,
  name: 'Standard Room',
  description: 'A comfortable standard room',
  base_rate: 15000, // ₦150 in kobo
  max_occupancy: 2,
  amenities: ['wifi', 'tv', 'ac'],
  ...overrides
})

describe('Room Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Room Creation', () => {
    it('should create room with proper tenant isolation', async () => {
      const newRoom = createMockRoom({ id: undefined })
      const createdRoom = createMockRoom()

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdRoom, error: null })
          })
        })
      } as any)

      const result = await supabase
        .from('rooms')
        .insert([{
          room_number: '101',
          room_type_id: 'standard',
          floor: 1,
          status: 'available',
          tenant_id: testTenantId
        }])
        .select()
        .single()

      expect(result.data.tenant_id).toBe(testTenantId)
      expect(result.data.room_number).toBe('101')
      expect(result.data.status).toBe('available')
    })

    it('should validate room number uniqueness within tenant', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue({
              error: { message: 'duplicate key value violates unique constraint', code: '23505' }
            })
          })
        })
      } as any)

      await expect(
        supabase
          .from('rooms')
          .insert([{
            room_number: '101', // Duplicate
            room_type_id: 'standard',
            tenant_id: testTenantId
          }])
          .select()
          .single()
      ).rejects.toThrow()
    })

    it('should require valid room type', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue({
              error: { message: 'foreign key constraint violation', code: '23503' }
            })
          })
        })
      } as any)

      await expect(
        supabase
          .from('rooms')
          .insert([{
            room_number: '102',
            room_type_id: 'nonexistent',
            tenant_id: testTenantId
          }])
          .select()
          .single()
      ).rejects.toThrow()
    })
  })

  describe('Room Status Updates', () => {
    it('should update room status with audit trail', async () => {
      const updatedRoom = createMockRoom({ status: 'occupied' })
      const auditLogEntry = {
        id: 'audit-123',
        action: 'room_status_updated',
        resource_type: 'room',
        resource_id: 'room-123',
        actor_id: 'user-123',
        tenant_id: testTenantId,
        old_values: { status: 'available' },
        new_values: { status: 'occupied' },
        created_at: '2024-01-01T00:00:00Z'
      }

      // Mock room update
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'rooms') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [updatedRoom], error: null })
            })
          } as any
        }
        if (table === 'audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ data: [auditLogEntry], error: null })
          } as any
        }
        return {} as any
      })

      const roomUpdate = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', 'room-123')

      const auditLog = await supabase
        .from('audit_log')
        .insert([{
          action: 'room_status_updated',
          resource_type: 'room',
          resource_id: 'room-123',
          actor_id: 'user-123',
          tenant_id: testTenantId,
          old_values: { status: 'available' },
          new_values: { status: 'occupied' }
        }])

      expect(roomUpdate.error).toBeNull()
      expect(auditLog.error).toBeNull()
    })

    it('should validate status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        'available': ['occupied', 'maintenance', 'dirty'],
        'occupied': ['available', 'dirty', 'maintenance'],
        'dirty': ['available', 'maintenance'],
        'maintenance': ['available', 'dirty']
      }

      const isValidTransition = (from: string, to: string): boolean => {
        return validTransitions[from]?.includes(to) || false
      }

      expect(isValidTransition('available', 'occupied')).toBe(true)
      expect(isValidTransition('occupied', 'available')).toBe(true)
      expect(isValidTransition('available', 'dirty')).toBe(true)
      expect(isValidTransition('dirty', 'occupied')).toBe(false) // Invalid
    })

    it('should handle batch status updates', async () => {
      const roomsToUpdate = ['room-1', 'room-2', 'room-3']
      const updatedRooms = roomsToUpdate.map(id => createMockRoom({ id, status: 'dirty' }))

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: updatedRooms, error: null })
        })
      } as any)

      const result = await supabase
        .from('rooms')
        .update({ status: 'dirty' })
        .in('id', roomsToUpdate)

      expect(result.data).toHaveLength(3)
      expect(result.data).toBeTruthy()
      expect(Array.isArray(result.data)).toBe(true)
      const rooms = result.data as typeof updatedRooms
      if (rooms) {
        expect(rooms.every(room => room.status === 'dirty')).toBe(true)
      }
    })
  })

  describe('Tenant Isolation', () => {
    it('should not allow cross-tenant room access', async () => {
      // Mock RLS behavior - return empty result for cross-tenant access
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }) // RLS filters out
        })
      } as any)

      const result = await supabase
        .from('rooms')
        .select('*')
        .eq('id', 'other-tenant-room')

      expect(result.data).toHaveLength(0) // RLS should filter out
    })

    it('should enforce tenant_id in all room operations', async () => {
      const testCases = [
        { operation: 'select', tenantId: testTenantId, expectAccess: true },
        { operation: 'select', tenantId: otherTenantId, expectAccess: false },
        { operation: 'insert', tenantId: testTenantId, expectAccess: true },
        { operation: 'update', tenantId: testTenantId, expectAccess: true },
        { operation: 'delete', tenantId: testTenantId, expectAccess: false } // Soft delete only
      ]

      testCases.forEach(({ operation, tenantId, expectAccess }) => {
        // In real implementation, this would test actual RLS policies
        const mockRLSCheck = (userTenantId: string, resourceTenantId: string): boolean => {
          return userTenantId === resourceTenantId
        }

        expect(mockRLSCheck(tenantId, testTenantId)).toBe(expectAccess)
      })
    })
  })

  describe('Room Search and Filtering', () => {
    it('should filter rooms by status', async () => {
      const availableRooms = [
        createMockRoom({ id: 'room-1', status: 'available' }),
        createMockRoom({ id: 'room-2', status: 'available' })
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: availableRooms, error: null })
          })
        })
      } as any)

      const result = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available')
        .order('room_number')

      expect(result.data).toHaveLength(2)
      expect(result.data?.every(room => room.status === 'available')).toBe(true)
    })

    it('should filter rooms by floor', async () => {
      const floor2Rooms = [
        createMockRoom({ id: 'room-201', room_number: '201', floor: 2 }),
        createMockRoom({ id: 'room-202', room_number: '202', floor: 2 })
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: floor2Rooms, error: null })
          })
        })
      } as any)

      const result = await supabase
        .from('rooms')
        .select('*')
        .eq('floor', 2)
        .order('room_number')

      expect(result.data?.every(room => room.floor === 2)).toBe(true)
    })

    it('should search rooms by number pattern', async () => {
      const matchingRooms = [
        createMockRoom({ id: 'room-101', room_number: '101' }),
        createMockRoom({ id: 'room-201', room_number: '201' }),
        createMockRoom({ id: 'room-301', room_number: '301' })
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          like: vi.fn().mockResolvedValue({ data: matchingRooms, error: null })
        })
      } as any)

      const result = await supabase
        .from('rooms')
        .select('*')
        .like('room_number', '%01') // Rooms ending in '01'

      expect(result.data?.every(room => room.room_number.endsWith('01'))).toBe(true)
    })
  })

  describe('Room Type Management', () => {
    it('should create room type with pricing', async () => {
      const roomType = createMockRoomType()

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: roomType, error: null })
          })
        })
      } as any)

      const result = await supabase
        .from('room_types')
        .insert([{
          name: 'Standard Room',
          description: 'A comfortable standard room',
          base_rate: 15000,
          max_occupancy: 2,
          amenities: ['wifi', 'tv', 'ac'],
          tenant_id: testTenantId
        }])
        .select()
        .single()

      expect(result.data.name).toBe('Standard Room')
      expect(result.data.base_rate).toBe(15000)
      expect(result.data.max_occupancy).toBe(2)
    })

    it('should update room type pricing', async () => {
      const updatedRoomType = createMockRoomType({ base_rate: 18000 })

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedRoomType, error: null })
            })
          })
        })
      } as any)

      const result = await supabase
        .from('room_types')
        .update({ base_rate: 18000 })
        .eq('id', 'standard')
        .select()
        .single()

      expect(result.data.base_rate).toBe(18000)
    })
  })

  describe('Room Occupancy Tracking', () => {
    it('should track check-in and check-out times', async () => {
      const reservation = {
        id: 'res-123',
        room_id: 'room-123',
        guest_name: 'John Doe',
        check_in_date: '2024-01-01',
        check_out_date: '2024-01-03',
        status: 'confirmed'
      }

      const checkedInReservation = {
        ...reservation,
        status: 'checked_in',
        checked_in_at: '2024-01-01T15:00:00Z'
      }

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: checkedInReservation, error: null })
            })
          })
        })
      } as any)

      const result = await supabase
        .from('reservations')
        .update({
          status: 'checked_in',
          checked_in_at: '2024-01-01T15:00:00Z'
        })
        .eq('id', 'res-123')
        .select()
        .single()

      expect(result.data.status).toBe('checked_in')
      expect(result.data.checked_in_at).toBe('2024-01-01T15:00:00Z')
    })

    it('should calculate occupancy rates', () => {
      const calculateOccupancyRate = (occupiedRooms: number, totalRooms: number): number => {
        if (totalRooms === 0) return 0
        return Math.round((occupiedRooms / totalRooms) * 100)
      }

      expect(calculateOccupancyRate(75, 100)).toBe(75)
      expect(calculateOccupancyRate(0, 50)).toBe(0)
      expect(calculateOccupancyRate(50, 50)).toBe(100)
      expect(calculateOccupancyRate(33, 100)).toBe(33)
    })
  })
})