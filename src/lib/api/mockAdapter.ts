import { z } from 'zod';

// Mock API Adapter for LuxuryHotelSaaS
// Simulates API responses with latency and 10% failure rate

// Schemas for API validation
export const PaginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(50),
  total: z.number(),
  has_next: z.boolean(),
});

export const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
  }),
});

// Hotel Schema
export const HotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(['active', 'suspended', 'inactive']),
  plan: z.enum(['starter', 'growth', 'pro']),
  created_at: z.string(),
  settings: z.object({
    currency: z.string().default('NGN'),
    timezone: z.string().default('Africa/Lagos'),
    offline_window_hours: z.number().default(24),
  }),
});

// User Schema
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
  tenant_id: z.string().optional(),
  created_at: z.string(),
});

// Room Service Order Schema
export const RoomServiceOrderSchema = z.object({
  id: z.string(),
  room_number: z.string(),
  guest_name: z.string(),
  guest_phone: z.string(),
  items: z.array(z.object({
    item_id: z.string(),
    name: z.string(),
    qty: z.number(),
    price: z.number(),
    notes: z.string().optional(),
  })),
  total_amount: z.number(),
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']),
  estimated_delivery: z.string().optional(),
  payment_status: z.enum(['unpaid', 'paid']),
  payment_method: z.enum(['cash', 'pos', 'transfer', 'online']).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Menu Item Schema
export const MenuItemSchema = z.object({
  id: z.string(),
  hotel_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  category: z.string(),
  available: z.boolean(),
  preparation_time: z.number(),
  image: z.string().optional(),
  created_at: z.string(),
});

// Reservation Schema
export const ReservationSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  guest: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  room_type: z.object({
    id: z.string(),
    name: z.string(),
  }),
  room: z.object({
    id: z.string(),
    number: z.string(),
  }).optional(),
  status: z.enum(['booked', 'checked_in', 'checked_out', 'cancelled']),
  source: z.enum(['direct', 'walkin', 'ota', 'corporate']),
  check_in: z.string(),
  check_out: z.string(),
  folio_id: z.string(),
  totals: z.object({
    room: z.number(),
    tax: z.number(),
    fees: z.number(),
    paid: z.number(),
    balance: z.number(),
  }),
  created_at: z.string(),
});

// API Response wrapper
type ApiResponse<T> = {
  data: T;
  meta?: z.infer<typeof PaginationSchema>;
};

type ApiError = z.infer<typeof ErrorSchema>;

// Mock data store
class MockDataStore {
  private data: Record<string, any[]> = {
    hotels: [],
    users: [],
    reservations: [],
    menu_items: [],
    room_service_orders: [],
    rooms: [],
    staff: [],
    reports: [],
  };

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample Hotels
    this.data.hotels = [
      {
        id: '1',
        name: 'Lagos Grand Hotel',
        slug: 'lagos-grand',
        status: 'active',
        plan: 'growth',
        created_at: '2024-01-15T10:00:00Z',
        settings: {
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          offline_window_hours: 24,
        },
      },
      {
        id: '2',
        name: 'Abuja Executive Suites',
        slug: 'abuja-executive',
        status: 'active',
        plan: 'pro',
        created_at: '2024-02-01T10:00:00Z',
        settings: {
          currency: 'NGN',
          timezone: 'Africa/Lagos',
          offline_window_hours: 48,
        },
      },
    ];

    // Sample Users
    this.data.users = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@luxuryhotelsaas.com',
        roles: ['SUPER_ADMIN'],
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Hotel Owner',
        email: 'owner@lagasgrand.com',
        roles: ['HOTEL_OWNER'],
        tenant_id: '1',
        created_at: '2024-01-15T10:00:00Z',
      },
    ];

    // Sample Menu Items
    this.data.menu_items = [
      {
        id: '1',
        hotel_id: '1',
        name: 'Jollof Rice & Grilled Chicken',
        description: 'Traditional Nigerian jollof rice with perfectly grilled chicken breast, served with plantain',
        price: 3500,
        category: 'Main Course',
        available: true,
        preparation_time: 25,
        image: '/api/placeholder/300/200',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        hotel_id: '1',
        name: 'Pepper Soup (Goat Meat)',
        description: 'Spicy Nigerian pepper soup with tender goat meat and local spices',
        price: 4200,
        category: 'Soups',
        preparation_time: 20,
        available: true,
        created_at: '2024-01-15T10:00:00Z',
      },
    ];

    // Sample Room Service Orders
    this.data.room_service_orders = [
      {
        id: '1',
        room_number: '201',
        guest_name: 'John Doe',
        guest_phone: '+2348123456789',
        items: [
          {
            item_id: '1',
            name: 'Jollof Rice & Grilled Chicken',
            qty: 1,
            price: 3500,
            notes: 'Extra spicy',
          },
        ],
        total_amount: 3500,
        status: 'preparing',
        estimated_delivery: '2024-01-20T14:30:00Z',
        payment_status: 'unpaid',
        created_at: '2024-01-20T14:00:00Z',
        updated_at: '2024-01-20T14:05:00Z',
      },
    ];

    // Sample Reservations
    this.data.reservations = [
      {
        id: '1',
        tenant_id: '1',
        guest: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+2348123456789',
        },
        room_type: {
          id: '1',
          name: 'Deluxe Room',
        },
        room: {
          id: '1',
          number: '201',
        },
        status: 'checked_in',
        source: 'direct',
        check_in: '2024-01-20T15:00:00Z',
        check_out: '2024-01-22T12:00:00Z',
        folio_id: '1',
        totals: {
          room: 25000,
          tax: 2000,
          fees: 500,
          paid: 15000,
          balance: 12500,
        },
        created_at: '2024-01-15T10:00:00Z',
      },
    ];
  }

  get<T>(endpoint: string, params?: Record<string, any>): T[] {
    const [resource] = endpoint.split('/').filter(Boolean);
    return this.data[resource] || [];
  }

  post<T>(endpoint: string, data: any): T {
    const [resource] = endpoint.split('/').filter(Boolean);
    const newItem = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (!this.data[resource]) {
      this.data[resource] = [];
    }
    
    this.data[resource].push(newItem);
    return newItem as T;
  }

  patch<T>(endpoint: string, id: string, data: any): T {
    const [resource] = endpoint.split('/').filter(Boolean);
    const items = this.data[resource] || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    this.data[resource][index] = {
      ...items[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    return this.data[resource][index] as T;
  }

  delete(endpoint: string, id: string): boolean {
    const [resource] = endpoint.split('/').filter(Boolean);
    const items = this.data[resource] || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      return false;
    }
    
    this.data[resource].splice(index, 1);
    return true;
  }
}

// Singleton mock data store
const mockStore = new MockDataStore();

// Mock API client
export class MockApiClient {
  private baseURL = '/api/v1';
  private failureRate = 0.1; // 10% failure rate
  private minLatency = 200; // minimum 200ms
  private maxLatency = 600; // maximum 600ms

  private async simulateLatency(): Promise<void> {
    const latency = Math.random() * (this.maxLatency - this.minLatency) + this.minLatency;
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  private async simulateFailure(): Promise<void> {
    if (Math.random() < this.failureRate) {
      throw new Error('Simulated network failure');
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T[]>> {
    await this.simulateLatency();
    await this.simulateFailure();

    const data = mockStore.get<T>(endpoint, params);
    
    // Simulate pagination
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const total = data.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      meta: {
        page,
        limit,
        total,
        has_next: endIndex < total,
      },
    };
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    await this.simulateLatency();
    await this.simulateFailure();

    const result = mockStore.post<T>(endpoint, data);
    return { data: result };
  }

  async patch<T>(endpoint: string, id: string, data: any): Promise<ApiResponse<T>> {
    await this.simulateLatency();
    await this.simulateFailure();

    const result = mockStore.patch<T>(endpoint, id, data);
    return { data: result };
  }

  async delete(endpoint: string, id: string): Promise<ApiResponse<{ success: boolean }>> {
    await this.simulateLatency();
    await this.simulateFailure();

    const success = mockStore.delete(endpoint, id);
    return { data: { success } };
  }
}

// Export singleton instance
export const mockApi = new MockApiClient();

// Helper function to get current user (mock)
export const getCurrentUser = () => ({
  id: '2',
  name: 'Hotel Owner',
  email: 'owner@lagosgrand.com',
  roles: ['HOTEL_OWNER'],
  tenant_id: '1',
  plan: 'growth' as const,
  permissions: [
    'reservations.read',
    'reservations.write',
    'checkin.execute',
    'checkout.execute',
    'folios.read',
    'folios.write',
    'payments.collect',
    'roomservice.menu.read',
    'roomservice.menu.write',
    'roomservice.order.read',
    'roomservice.order.write',
    'reports.view',
    'staff.manage',
  ],
});

// Helper function to get current hotel
export const getCurrentHotel = () => ({
  id: '1',
  name: 'Lagos Grand Hotel',
  slug: 'lagos-grand',
  status: 'active' as const,
  plan: 'growth' as const,
});