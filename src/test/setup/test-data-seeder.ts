import { supabase } from '@/integrations/supabase/client'

/**
 * Test Data Seeder for Phase 4 Testing
 * Creates realistic test data for comprehensive testing
 */

export interface TestTenant {
  tenant_id: string
  hotel_name: string
  hotel_slug: string
  plan_id: string
}

export interface TestUser {
  id: string
  email: string
  role: string
  tenant_id: string
}

export interface TestRoom {
  id: string
  room_number: string
  tenant_id: string
  room_type_id: string
  status: string
}

export class TestDataSeeder {
  private tenants: TestTenant[] = []
  private users: TestUser[] = []
  private rooms: TestRoom[] = []

  async seedAll(): Promise<void> {
    console.log('🌱 Seeding test data...')
    
    try {
      await this.seedPlans()
      await this.seedTenants()
      await this.seedUsers()
      await this.seedRoomTypes()
      await this.seedRooms()
      await this.seedReservations()
      await this.seedQRCodes()
      
      console.log('✅ Test data seeded successfully!')
    } catch (error) {
      console.error('❌ Failed to seed test data:', error)
      throw error
    }
  }

  async cleanAll(): Promise<void> {
    console.log('🧹 Cleaning test data...')
    
    try {
      // Clean in reverse order to respect foreign keys
      await supabase.from('qr_orders').delete().neq('id', '')
      await supabase.from('reservations').delete().neq('id', '')
      await supabase.from('qr_codes').delete().neq('id', '')
      await supabase.from('rooms').delete().neq('id', '')
      await supabase.from('room_types').delete().neq('id', '')
      await supabase.from('users').delete().neq('id', '')
      await supabase.from('tenants').delete().neq('tenant_id', '')
      await supabase.from('plans').delete().neq('id', '')
      
      console.log('✅ Test data cleaned successfully!')
    } catch (error) {
      console.error('❌ Failed to clean test data:', error)
      throw error
    }
  }

  private async seedPlans(): Promise<void> {
    const plans = [
      {
        name: 'Starter',
        price_monthly: 2900, // ₦29 in kobo
        max_rooms: 10,
        max_staff: 5,
        features: { 
          qr_services: true, 
          basic_reports: true, 
          email_support: true 
        }
      },
      {
        name: 'Growth', 
        price_monthly: 9900, // ₦99 in kobo
        max_rooms: 50,
        max_staff: 20,
        features: { 
          qr_services: true, 
          advanced_reports: true, 
          priority_support: true,
          api_access: true
        }
      },
      {
        name: 'Enterprise',
        price_monthly: 19900, // ₦199 in kobo
        max_rooms: -1, // Unlimited
        max_staff: -1, // Unlimited
        features: { 
          qr_services: true, 
          enterprise_reports: true, 
          dedicated_support: true,
          api_access: true,
          white_label: true
        }
      }
    ]

    const { error } = await supabase.from('plans').insert(plans)
    if (error) throw error
  }

  private async seedTenants(): Promise<void> {
    const tenants = [
      {
        hotel_name: 'Lagos Grand Hotel',
        hotel_slug: 'lagos-grand',
        plan_id: '1' // Will be replaced with actual plan ID
      },
      {
        hotel_name: 'Abuja Luxury Suites',
        hotel_slug: 'abuja-luxury',
        plan_id: '2'
      },
      {
        hotel_name: 'Port Harcourt Resort',
        hotel_slug: 'portharcourt-resort',  
        plan_id: '1'
      }
    ]

    // Get actual plan IDs
    const { data: plans } = await supabase.from('plans').select('id, name')
    if (!plans) throw new Error('No plans found')

    const planMap = plans.reduce((acc, plan) => {
      acc[plan.name] = plan.id
      return acc
    }, {} as Record<string, string>)

    // Update tenant data with real plan IDs and ensure all required fields
    const tenantsWithPlanIds = tenants.map((tenant, index) => ({
      hotel_name: tenant.hotel_name,
      hotel_slug: tenant.hotel_slug,
      plan_id: planMap[index === 0 ? 'Growth' : index === 1 ? 'Enterprise' : 'Starter']
    }))

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenantsWithPlanIds)
      .select()

    if (error) throw error
    this.tenants = data as TestTenant[]
  }

  private async seedUsers(): Promise<void> {
    const users = [
      // Lagos Grand Hotel users
      {
        email: 'owner@lagasgrand.com',
        role: 'OWNER',
        tenant_id: this.tenants[0].tenant_id,
        name: 'Lagos Owner'
      },
      {
        email: 'manager@lagasgrand.com', 
        role: 'MANAGER',
        tenant_id: this.tenants[0].tenant_id,
        name: 'Lagos Manager'
      },
      {
        email: 'frontdesk@lagasgrand.com',
        role: 'FRONT_DESK', 
        tenant_id: this.tenants[0].tenant_id,
        name: 'Front Desk Staff'
      },
      // Abuja Luxury users
      {
        email: 'owner@abujaluxury.com',
        role: 'OWNER',
        tenant_id: this.tenants[1].tenant_id,
        name: 'Abuja Owner'
      },
      // Super Admin
      {
        email: 'admin@hotelsystem.com',
        role: 'SUPER_ADMIN',
        tenant_id: null,
        name: 'System Administrator'
      }
    ]

    const { data, error } = await supabase
      .from('users')
      .insert(users)
      .select()

    if (error) throw error
    this.users = data as TestUser[]
  }

  private async seedRoomTypes(): Promise<void> {
    const roomTypes = []
    
    for (const tenant of this.tenants) {
      roomTypes.push(
        {
          name: 'Standard Room',
          description: 'Comfortable standard accommodation',
          base_rate: 15000, // ₦150 in kobo
          max_occupancy: 2,
          amenities: ['wifi', 'tv', 'ac', 'minibar'],
          tenant_id: tenant.tenant_id
        },
        {
          name: 'Deluxe Room',
          description: 'Premium room with city view',
          base_rate: 25000, // ₦250 in kobo
          max_occupancy: 3,
          amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony', 'city_view'],
          tenant_id: tenant.tenant_id
        },
        {
          name: 'Executive Suite',
          description: 'Luxury suite with separate living area',
          base_rate: 45000, // ₦450 in kobo
          max_occupancy: 4,
          amenities: ['wifi', 'tv', 'ac', 'minibar', 'balcony', 'city_view', 'living_room', 'kitchenette'],
          tenant_id: tenant.tenant_id
        }
      )
    }

    const { error } = await supabase.from('room_types').insert(roomTypes)
    if (error) throw error
  }

  private async seedRooms(): Promise<void> {
    const { data: roomTypes } = await supabase.from('room_types').select('*')
    if (!roomTypes) throw new Error('No room types found')

    const rooms = []
    const statuses = ['available', 'occupied', 'maintenance', 'dirty']
    
    for (const tenant of this.tenants) {
      const tenantRoomTypes = roomTypes.filter(rt => rt.tenant_id === tenant.tenant_id)
      
      // Create 20 rooms per tenant (floors 1-4, rooms 01-05 per floor)
      for (let floor = 1; floor <= 4; floor++) {
        for (let room = 1; room <= 5; room++) {
          const roomNumber = `${floor}${room.toString().padStart(2, '0')}`
          const roomTypeIndex = (floor + room) % tenantRoomTypes.length
          
          rooms.push({
            room_number: roomNumber,
            floor: floor,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            room_type_id: tenantRoomTypes[roomTypeIndex].id,
            tenant_id: tenant.tenant_id,
            last_cleaned: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert(rooms)
      .select()

    if (error) throw error
    this.rooms = data as TestRoom[]
  }

  private async seedReservations(): Promise<void> {
    const occupiedRooms = this.rooms.filter(room => room.status === 'occupied')
    const reservations = []

    for (const room of occupiedRooms.slice(0, 10)) { // Create 10 active reservations
      const checkInDate = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
      const checkOutDate = new Date(checkInDate.getTime() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000)
      
      reservations.push({
        reservation_number: `RES${Date.now()}${Math.floor(Math.random() * 1000)}`,
        room_id: room.id,
        guest_name: `Guest ${Math.floor(Math.random() * 1000)}`,
        guest_email: `guest${Math.floor(Math.random() * 1000)}@email.com`,
        guest_phone: `+234${Math.floor(Math.random() * 1000000000)}`,
        check_in_date: checkInDate.toISOString().split('T')[0],
        check_out_date: checkOutDate.toISOString().split('T')[0],
        adults: 1 + Math.floor(Math.random() * 3),
        children: Math.floor(Math.random() * 2),
        room_rate: 15000 + Math.floor(Math.random() * 30000),
        total_amount: 30000 + Math.floor(Math.random() * 50000),
        status: 'checked_in',
        tenant_id: room.tenant_id,
        checked_in_at: checkInDate.toISOString(),
        checked_in_by: this.users.find(u => u.tenant_id === room.tenant_id && u.role === 'FRONT_DESK')?.id
      })
    }

    const { error } = await supabase.from('reservations').insert(reservations)
    if (error) throw error
  }

  private async seedQRCodes(): Promise<void> {
    const availableRooms = this.rooms.filter(room => room.status === 'available').slice(0, 15)
    const qrCodes = []

    for (const room of availableRooms) {
      qrCodes.push({
        qr_token: `qr-${room.tenant_id}-${room.room_number}-${Date.now()}`,
        room_id: room.id,
        services: ['housekeeping', 'room_service', 'maintenance', 'wifi'],
        is_active: true,
        tenant_id: room.tenant_id,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=qr-${room.room_number}`
      })
    }

    const { error } = await supabase.from('qr_codes').insert(qrCodes)
    if (error) throw error
  }
}

// Export singleton instance
export const testDataSeeder = new TestDataSeeder()