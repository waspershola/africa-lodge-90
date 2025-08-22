// Mock API Adapter for LuxuryHotelSaaS
// Simulates API contracts with realistic data and latency

// Mock data for Super Admin
const mockTenants = [
  {
    id: '1',
    name: 'Grand Palace Hotel',
    slug: 'grand-palace',
    plan: 'Pro',
    status: 'active',
    offlineWindowHours: 24,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    contactEmail: 'admin@grandpalace.com',
    totalRooms: 120,
    city: 'Lagos'
  },
  {
    id: '2',
    name: 'Boutique Suites',
    slug: 'boutique-suites',
    plan: 'Growth',
    status: 'active',
    offlineWindowHours: 12,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
    contactEmail: 'manager@boutiquesuites.com',
    totalRooms: 45,
    city: 'Abuja'
  },
  {
    id: '3',
    name: 'City Inn Express',
    slug: 'city-inn',
    plan: 'Starter',
    status: 'inactive',
    offlineWindowHours: 48,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    contactEmail: 'contact@cityinn.com',
    totalRooms: 25,
    city: 'Port Harcourt'
  }
];

const mockPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 35000,
    currency: 'NGN',
    maxRooms: 25,
    features: {
      frontDesk: true,
      localPayments: true,
      basicReports: true,
      emailNotifications: true,
      offlineSync: true,
      posIntegration: false,
      roomServiceQR: false,
      whatsappNotifications: false,
      powerTracking: false,
      kioskCheckin: false,
      multiProperty: false,
      advancedAnalytics: false
    },
    popular: false
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 65000,
    currency: 'NGN',
    maxRooms: 75,
    features: {
      frontDesk: true,
      localPayments: true,
      basicReports: true,
      emailNotifications: true,
      offlineSync: true,
      posIntegration: true,
      roomServiceQR: true,
      whatsappNotifications: true,
      powerTracking: true,
      kioskCheckin: false,
      multiProperty: false,
      advancedAnalytics: false
    },
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 120000,
    currency: 'NGN',
    maxRooms: 999,
    features: {
      frontDesk: true,
      localPayments: true,
      basicReports: true,
      emailNotifications: true,
      offlineSync: true,
      posIntegration: true,
      roomServiceQR: true,
      whatsappNotifications: true,
      powerTracking: true,
      kioskCheckin: true,
      multiProperty: true,
      advancedAnalytics: true
    },
    popular: false
  }
];

const mockAuditLogs = [
  {
    id: '1',
    timestamp: '2024-01-20T10:30:00Z',
    tenantId: '1',
    tenantName: 'Grand Palace Hotel',
    action: 'user_login',
    userId: 'user123',
    userName: 'John Doe',
    details: 'Staff member logged into front desk',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0...'
  },
  {
    id: '2',
    timestamp: '2024-01-20T09:15:00Z',
    tenantId: '2',
    tenantName: 'Boutique Suites',
    action: 'booking_created',
    userId: 'user456',
    userName: 'Jane Smith',
    details: 'New reservation created for Room 204',
    ipAddress: '192.168.1.15',
    userAgent: 'Mozilla/5.0...'
  },
  {
    id: '3',
    timestamp: '2024-01-20T08:45:00Z',
    tenantId: '1',
    tenantName: 'Grand Palace Hotel',
    action: 'plan_upgrade',
    userId: 'owner789',
    userName: 'Alice Johnson',
    details: 'Upgraded from Growth to Pro plan',
    ipAddress: '192.168.1.20',
    userAgent: 'Mozilla/5.0...'
  }
];

const mockMetrics = {
  overview: {
    totalTenants: 156,
    activeTenants: 142,
    monthlyActiveUsers: 2847,
    totalRevenue: 18500000,
    mrr: 1540000,
    arr: 18480000,
    growthRate: 12.5,
    churnRate: 3.2,
    avgOccupancy: 78.5,
    activeStaff: 1284
  },
  trends: {
    tenants: [
      { month: 'Jan', value: 120 },
      { month: 'Feb', value: 135 },
      { month: 'Mar', value: 142 },
      { month: 'Apr', value: 156 }
    ],
    revenue: [
      { month: 'Jan', value: 14200000 },
      { month: 'Feb', value: 15800000 },
      { month: 'Mar', value: 17200000 },
      { month: 'Apr', value: 18500000 }
    ],
    users: [
      { month: 'Jan', value: 2100 },
      { month: 'Feb', value: 2400 },
      { month: 'Mar', value: 2650 },
      { month: 'Apr', value: 2847 }
    ],
    occupancy: [
      { month: 'Jan', value: 72.3 },
      { month: 'Feb', value: 75.8 },
      { month: 'Mar', value: 76.9 },
      { month: 'Apr', value: 78.5 }
    ]
  }
};

const mockDashboardData = {
  topPerformers: [
    { id: '1', name: 'Grand Palace Hotel', city: 'Lagos', revenue: 2850000, occupancy: 85.2, orders: 1247, satisfaction: 4.8 },
    { id: '2', name: 'Boutique Suites', city: 'Abuja', revenue: 1920000, occupancy: 78.4, orders: 892, satisfaction: 4.6 },
    { id: '4', name: 'Marina Heights', city: 'Lagos', revenue: 1650000, occupancy: 82.1, orders: 743, satisfaction: 4.7 },
    { id: '5', name: 'Capital Lodge', city: 'Abuja', revenue: 1420000, occupancy: 76.8, orders: 654, satisfaction: 4.5 },
    { id: '3', name: 'City Inn Express', city: 'Port Harcourt', revenue: 980000, occupancy: 65.3, orders: 421, satisfaction: 4.2 }
  ],
  healthStatus: [
    { tenantId: '1', name: 'Grand Palace Hotel', status: 'healthy', uptime: 99.8, latency: 142, errors: 0 },
    { tenantId: '2', name: 'Boutique Suites', status: 'healthy', uptime: 99.5, latency: 156, errors: 2 },
    { tenantId: '3', name: 'City Inn Express', status: 'warning', uptime: 97.2, latency: 289, errors: 12 },
    { tenantId: '4', name: 'Marina Heights', status: 'healthy', uptime: 99.9, latency: 138, errors: 0 },
    { tenantId: '5', name: 'Capital Lodge', status: 'healthy', uptime: 98.9, latency: 178, errors: 4 }
  ],
  resourceUsage: [
    { tenantId: '1', name: 'Grand Palace Hotel', dbSize: 2.8, apiCalls: 45200, storage: 1.2, plan: 'Pro' },
    { tenantId: '2', name: 'Boutique Suites', dbSize: 1.9, apiCalls: 28900, storage: 0.8, plan: 'Growth' },
    { tenantId: '3', name: 'City Inn Express', dbSize: 0.9, apiCalls: 12400, storage: 0.3, plan: 'Starter' },
    { tenantId: '4', name: 'Marina Heights', dbSize: 2.1, apiCalls: 32100, storage: 0.9, plan: 'Growth' },
    { tenantId: '5', name: 'Capital Lodge', dbSize: 1.6, apiCalls: 23800, storage: 0.6, plan: 'Growth' }
  ],
  billingOverview: {
    totalInvoices: 142,
    paidInvoices: 135,
    failedPayments: 7,
    pendingAmount: 485000,
    nextBillingCycle: '2024-02-01'
  },
  regions: [
    { name: 'Lagos', count: 45, revenue: 8200000 },
    { name: 'Abuja', count: 38, revenue: 6800000 },
    { name: 'Port Harcourt', count: 28, revenue: 2100000 },
    { name: 'Kano', count: 22, revenue: 1900000 },
    { name: 'Ibadan', count: 23, revenue: 1600000 }
  ]
};

// Utility functions
const delay = () => new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 200));
const shouldFail = () => Math.random() < 0.1; // 10% failure rate

// API endpoints
export const mockApi = {
  // Super Admin - Tenants
  async getTenants() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch tenants');
    return {
      data: mockTenants,
      total: mockTenants.length,
      page: 1,
      limit: 10
    };
  },

  async getTenant(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch tenant');
    const tenant = mockTenants.find(t => t.id === id);
    if (!tenant) throw new Error('Tenant not found');
    return { data: tenant };
  },

  async createTenant(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create tenant');
    const newTenant = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockTenants.push(newTenant);
    return { data: newTenant };
  },

  async updateTenant(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update tenant');
    const index = mockTenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    mockTenants[index] = { ...mockTenants[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockTenants[index] };
  },

  async deleteTenant(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete tenant');
    const index = mockTenants.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    mockTenants.splice(index, 1);
    return { success: true };
  },

  // Super Admin - Plans
  async getPlans() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch plans');
    return { data: mockPlans };
  },

  async updatePlan(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update plan');
    const index = mockPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');
    mockPlans[index] = { ...mockPlans[index], ...data };
    return { data: mockPlans[index] };
  },

  // Super Admin - Audit
  async getAuditLogs(page = 1, limit = 20) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch audit logs');
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: mockAuditLogs.slice(start, end),
      total: mockAuditLogs.length,
      page,
      limit
    };
  },

  // Super Admin - Metrics
  async getMetrics() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch metrics');
    return { data: mockMetrics };
  },

  // Super Admin - Dashboard
  async getDashboardData() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch dashboard data');
    return { data: mockDashboardData };
  },

  // Super Admin - Policies
  async getPolicies() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch policies');
    return {
      data: {
        defaultOfflineWindow: 24,
        maxOfflineWindow: 48,
        minOfflineWindow: 12,
        tenantOverrides: mockTenants.map(t => ({
          tenantId: t.id,
          tenantName: t.name,
          offlineWindowHours: t.offlineWindowHours
        }))
      }
    };
  },

  async updatePolicy(tenantId: string, offlineWindowHours: number) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update policy');
    const tenant = mockTenants.find(t => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');
    tenant.offlineWindowHours = offlineWindowHours;
    tenant.updatedAt = new Date().toISOString();
    return { data: tenant };
  }
};

export type Tenant = typeof mockTenants[0];
export type Plan = typeof mockPlans[0];
export type AuditLog = typeof mockAuditLogs[0];
export type Metrics = typeof mockMetrics;