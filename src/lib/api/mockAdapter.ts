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
    { id: '1', name: 'Grand Palace Hotel', city: 'Lagos', revenue: 2850000, occupancy: 85.2, orders: 1247, satisfaction: 4.8, status: 'healthy' },
    { id: '2', name: 'Boutique Suites', city: 'Abuja', revenue: 1920000, occupancy: 78.4, orders: 892, satisfaction: 4.6, status: 'healthy' },
    { id: '4', name: 'Marina Heights', city: 'Lagos', revenue: 1650000, occupancy: 82.1, orders: 743, satisfaction: 4.7, status: 'healthy' },
    { id: '5', name: 'Capital Lodge', city: 'Abuja', revenue: 1420000, occupancy: 76.8, orders: 654, satisfaction: 4.5, status: 'warning' },
    { id: '3', name: 'City Inn Express', city: 'Port Harcourt', revenue: 980000, occupancy: 65.3, orders: 421, satisfaction: 4.2, status: 'at-risk' }
  ],
  churnMetrics: {
    activeHotels: 142,
    cancelledThisMonth: 5,
    churnRate: 3.4,
    retentionRate: 96.6,
    newSignups: 14,
    reactivations: 2,
    atRiskHotels: 8
  },
  revenueForecasting: {
    currentMRR: 1540000,
    projectedMRR: 1680000,
    forecastAccuracy: 92.5,
    nextMonthProjection: 1720000,
    atRiskRevenue: 285000
  },
  userAnalytics: {
    totalActiveUsers: 2847,
    byRole: {
      frontDesk: 1420,
      manager: 584,
      owner: 142,
      maintenance: 398,
      guestServices: 303
    },
    growthTrend: [
      { month: 'Jan', active: 2100, new: 156, churned: 23 },
      { month: 'Feb', active: 2400, new: 320, churned: 18 },
      { month: 'Mar', active: 2650, new: 285, churned: 35 },
      { month: 'Apr', active: 2847, new: 223, churned: 26 }
    ]
  },
  templates: [
    { id: 'luxury', name: 'Luxury Resort', category: 'Resort', features: ['spa', 'concierge', 'valet'], usage: 23 },
    { id: 'business', name: 'Business Hotel', category: 'Business', features: ['meeting-rooms', 'business-center'], usage: 45 },
    { id: 'boutique', name: 'Boutique Inn', category: 'Boutique', features: ['personalized-service', 'unique-design'], usage: 34 }
  ],
  broadcasts: [
    { id: '1', title: 'System Maintenance', message: 'Scheduled maintenance on Saturday 2am UTC', status: 'scheduled', recipients: 142, created: '2024-01-20T10:00:00Z' },
    { id: '2', title: 'New Feature Release', message: 'Room service QR codes now available', status: 'sent', recipients: 142, created: '2024-01-18T14:30:00Z' }
  ],
  supportTickets: [
    { id: '1', tenantName: 'Grand Palace Hotel', subject: 'Payment integration issue', priority: 'high', status: 'open', created: '2024-01-20T09:15:00Z' },
    { id: '2', tenantName: 'Boutique Suites', subject: 'Staff login problems', priority: 'medium', status: 'in-progress', created: '2024-01-19T16:20:00Z' }
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
    { name: 'Lagos', count: 45, revenue: 8200000, lat: 6.5244, lng: 3.3792 },
    { name: 'Abuja', count: 38, revenue: 6800000, lat: 9.0765, lng: 7.3986 },
    { name: 'Port Harcourt', count: 28, revenue: 2100000, lat: 4.8156, lng: 7.0498 },
    { name: 'Kano', count: 22, revenue: 1900000, lat: 12.0022, lng: 8.5920 },
    { name: 'Ibadan', count: 23, revenue: 1600000, lat: 7.3775, lng: 3.9470 }
  ],
  emergencyMode: {
    enabled: false,
    activatedBy: null,
    activatedAt: null,
    reason: null
  }
};

const mockTemplates = [
  {
    id: '1',
    name: 'Luxury Resort Template',
    description: 'Perfect for high-end resort properties with spa and concierge services',
    category: 'luxury',
    pricing: { markup: 25, taxes: 8, serviceFees: 5 },
    roomTypes: [
      { name: 'Presidential Suite', basePrice: 500, amenities: ['WiFi', 'AC', 'TV', 'Minibar', 'Jacuzzi'] },
      { name: 'Executive Room', basePrice: 200, amenities: ['WiFi', 'AC', 'TV', 'Minibar'] },
      { name: 'Standard Room', basePrice: 100, amenities: ['WiFi', 'AC', 'TV'] }
    ],
    branding: { theme: 'luxury', primaryColor: '#1A237E', secondaryColor: '#FFD700' }
  },
  {
    id: '2',
    name: 'Business Hotel Template',
    description: 'Optimized for business travelers with meeting facilities',
    category: 'business',
    pricing: { markup: 15, taxes: 8, serviceFees: 3 },
    roomTypes: [
      { name: 'Business Suite', basePrice: 180, amenities: ['WiFi', 'AC', 'TV', 'Desk', 'Coffee'] },
      { name: 'Standard Room', basePrice: 90, amenities: ['WiFi', 'AC', 'TV'] }
    ],
    branding: { theme: 'modern', primaryColor: '#2C3E50', secondaryColor: '#3498DB' }
  },
  {
    id: '3',
    name: 'Budget Inn Template',
    description: 'Cost-effective solution for budget accommodations',
    category: 'budget',
    pricing: { markup: 10, taxes: 8, serviceFees: 2 },
    roomTypes: [
      { name: 'Economy Room', basePrice: 50, amenities: ['WiFi', 'AC'] },
      { name: 'Standard Room', basePrice: 70, amenities: ['WiFi', 'AC', 'TV'] }
    ],
    branding: { theme: 'minimal', primaryColor: '#27AE60', secondaryColor: '#F39C12' }
  }
];

const mockRoles = [
  {
    id: '1',
    name: 'Hotel Owner',
    description: 'Full access to all hotel operations',
    isDefault: true,
    assignedCount: 25,
    permissions: {
      reservations: ['view', 'create', 'edit', 'delete', 'checkin', 'checkout'],
      guests: ['view', 'create', 'edit', 'delete', 'notes'],
      rooms: ['view', 'edit', 'maintenance', 'pricing'],
      billing: ['view', 'process', 'refund', 'reports'],
      reports: ['view', 'export', 'financial', 'operational']
    }
  },
  {
    id: '2',
    name: 'Front Desk Manager',
    description: 'Manage reservations, guests, and front desk operations',
    isDefault: true,
    assignedCount: 42,
    permissions: {
      reservations: ['view', 'create', 'edit', 'checkin', 'checkout'],
      guests: ['view', 'create', 'edit', 'notes'],
      rooms: ['view'],
      billing: ['view', 'process'],
      reports: ['view']
    }
  },
  {
    id: '3',
    name: 'Front Desk Agent',
    description: 'Handle check-in/out and basic guest services',
    isDefault: true,
    assignedCount: 78,
    permissions: {
      reservations: ['view', 'checkin', 'checkout'],
      guests: ['view'],
      rooms: ['view'],
      billing: ['view'],
      reports: []
    }
  }
];

const mockGlobalUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@luxuryhotelsaas.com',
    type: 'platform',
    tenantAccess: 'global',
    status: 'active',
    lastLogin: '2024-01-15T10:30:00Z',
    assignedTenants: null
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@luxuryhotelsaas.com',
    type: 'support',
    tenantAccess: 'global',
    status: 'active',
    lastLogin: '2024-01-14T16:45:00Z',
    assignedTenants: null
  },
  {
    id: '3',
    name: 'API Integration Service',
    email: 'integrator@example.com',
    type: 'integrator',
    tenantAccess: 'specific',
    status: 'active',
    lastLogin: '2024-01-15T08:20:00Z',
    assignedTenants: ['1', '2', '3']
  }
];

const mockSupportTickets = [
  {
    id: '1',
    tenantId: '1',
    tenantName: 'Grand Palace Hotel',
    subject: 'Payment integration issue',
    description: 'Unable to process credit card payments through the POS system',
    priority: 'high',
    status: 'open',
    createdAt: '2024-01-20T09:15:00Z'
  },
  {
    id: '2',
    tenantId: '2',
    tenantName: 'Boutique Suites',
    subject: 'Staff login problems',
    description: 'Front desk staff unable to login to the system',
    priority: 'medium',
    status: 'in_progress',
    createdAt: '2024-01-19T16:20:00Z'
  },
  {
    id: '3',
    tenantId: '3',
    tenantName: 'City Inn Express',
    subject: 'Report generation error',
    description: 'Monthly reports failing to generate',
    priority: 'low',
    status: 'resolved',
    createdAt: '2024-01-18T14:30:00Z'
  }
];

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

  // Super Admin - Templates
  async getTemplates() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch templates');
    return { data: mockTemplates };
  },

  async createTemplate(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create template');
    const newTemplate = { 
      id: Date.now().toString(), 
      ...data, 
      createdAt: new Date().toISOString() 
    };
    mockTemplates.push(newTemplate);
    return { data: newTemplate };
  },

  async updateTemplate(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update template');
    const index = mockTemplates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');
    mockTemplates[index] = { ...mockTemplates[index], ...data };
    return { data: mockTemplates[index] };
  },

  async deleteTemplate(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete template');
    const index = mockTemplates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');
    mockTemplates.splice(index, 1);
    return { success: true };
  },

  // Super Admin - Roles
  async getRoles() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch roles');
    return { data: mockRoles };
  },

  async createRole(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create role');
    const newRole = {
      id: Date.now().toString(),
      ...data,
      isDefault: false,
      assignedCount: 0
    };
    mockRoles.push(newRole);
    return { data: newRole };
  },

  async updateRole(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update role');
    const index = mockRoles.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Role not found');
    mockRoles[index] = { ...mockRoles[index], ...data };
    return { data: mockRoles[index] };
  },

  async deleteRole(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete role');
    const index = mockRoles.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Role not found');
    if (mockRoles[index].isDefault) throw new Error('Cannot delete system role');
    mockRoles.splice(index, 1);
    return { success: true };
  },

  // Super Admin - Global Users
  async getGlobalUsers() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch global users');
    return { data: mockGlobalUsers };
  },

  async createGlobalUser(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create global user');
    const newUser = {
      id: Date.now().toString(),
      ...data,
      status: 'active',
      lastLogin: null,
      createdAt: new Date().toISOString()
    };
    mockGlobalUsers.push(newUser);
    return { data: newUser };
  },

  async updateGlobalUser(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update global user');
    const index = mockGlobalUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockGlobalUsers[index] = { ...mockGlobalUsers[index], ...data };
    return { data: mockGlobalUsers[index] };
  },

  async deleteGlobalUser(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete global user');
    const index = mockGlobalUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockGlobalUsers.splice(index, 1);
    return { success: true };
  },

  // Super Admin - Support
  async getSupportTickets() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch support tickets');
    return { data: mockSupportTickets };
  },

  async createSupportTicket(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create support ticket');
    const newTicket = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    };
    mockSupportTickets.push(newTicket);
    return { data: newTicket };
  },

  async updateSupportTicket(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update support ticket');
    const index = mockSupportTickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Ticket not found');
    mockSupportTickets[index] = { ...mockSupportTickets[index], ...data };
    return { data: mockSupportTickets[index] };
  },

  // Super Admin - Emergency Mode
  async getEmergencyMode() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch emergency mode status');
    return { 
      data: { 
        globalMode: mockDashboardData.emergencyMode.enabled,
        lastToggled: mockDashboardData.emergencyMode.activatedAt,
        ...mockDashboardData.emergencyMode 
      } 
    };
  },

  async toggleEmergencyMode(data: { type: string; enabled: boolean; tenantId?: string }) {
    await delay();
    if (shouldFail()) throw new Error('Failed to toggle emergency mode');
    
    if (data.type === 'global') {
      mockDashboardData.emergencyMode = {
        enabled: data.enabled,
        activatedBy: data.enabled ? 'admin' : null,
        activatedAt: data.enabled ? new Date().toISOString() : null,
        reason: data.enabled ? 'Global emergency activated' : null
      };
    } else if (data.type === 'tenant' && data.tenantId) {
      const tenant = mockTenants.find(t => t.id === data.tenantId);
      if (tenant) {
        (tenant as any).emergencyMode = data.enabled;
        tenant.updatedAt = new Date().toISOString();
      }
    }
    
    return { data: { enabled: data.enabled } };
  },

  // Super Admin - Tenant Management
  async createTenantUser(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create tenant user');
    const newUser = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    };
    return { data: newUser };
  },

  async impersonateTenant(tenantId: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to impersonate tenant');
    const tenant = mockTenants.find(t => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');
    return { data: { token: `impersonate-${tenantId}-${Date.now()}`, tenant } };
  },

  // Super Admin - Broadcasts
  async getBroadcasts() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch broadcasts');
    return { data: mockDashboardData.broadcasts };
  },

  async sendBroadcast(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to send broadcast');
    const broadcast = {
      id: Date.now().toString(),
      ...data,
      status: 'sent',
      recipients: mockTenants.length,
      created: new Date().toISOString()
    };
    mockDashboardData.broadcasts.unshift(broadcast);
    return { data: broadcast };
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
        emergencyMode: mockDashboardData.emergencyMode,
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