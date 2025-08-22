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
    city: 'Lagos',
    templateId: 'luxury',
    ownerUserId: 'owner1',
    billingStatus: 'active',
    lastActivity: '2024-01-20T10:30:00Z',
    metrics: {
      monthlyRevenue: 2850000,
      occupancyRate: 85.2,
      totalOrders: 1247,
      avgRating: 4.8,
      activeStaff: 25
    }
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
    city: 'Abuja',
    templateId: 'boutique',
    ownerUserId: 'owner2',
    billingStatus: 'active',
    lastActivity: '2024-01-20T09:15:00Z',
    metrics: {
      monthlyRevenue: 1920000,
      occupancyRate: 78.4,
      totalOrders: 892,
      avgRating: 4.6,
      activeStaff: 15
    }
  },
  {
    id: '3',
    name: 'City Inn Express',
    slug: 'city-inn',
    plan: 'Starter',
    status: 'suspended',
    offlineWindowHours: 48,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    contactEmail: 'contact@cityinn.com',
    totalRooms: 25,
    city: 'Port Harcourt',
    templateId: 'budget',
    ownerUserId: 'owner3',
    billingStatus: 'overdue',
    lastActivity: '2024-01-15T15:20:00Z',
    metrics: {
      monthlyRevenue: 980000,
      occupancyRate: 65.3,
      totalOrders: 421,
      avgRating: 4.2,
      activeStaff: 8
    }
  }
];

const mockTemplates = [
  {
    id: 'luxury',
    name: 'Luxury Hotel',
    category: 'Luxury',
    description: 'Premium luxury hotel setup with concierge and spa services',
    roomTypes: [
      { name: 'Presidential Suite', basePrice: 150000, amenities: ['King Bed', 'Private Balcony', 'Butler Service', 'Spa Access'] },
      { name: 'Executive Suite', basePrice: 85000, amenities: ['Queen Bed', 'City View', 'Minibar', 'WiFi'] },
      { name: 'Deluxe Room', basePrice: 45000, amenities: ['Double Bed', 'AC', 'TV', 'WiFi'] }
    ],
    pricingRules: {
      taxRate: 7.5,
      serviceCharge: 10,
      seasonalMarkup: 25
    },
    branding: {
      primaryColor: '#8B0000',
      accentColor: '#FFD700',
      logoPlaceholder: '/luxury-logo-placeholder.png'
    },
    features: ['concierge', 'spa', 'valet', 'roomService24', 'businessCenter']
  },
  {
    id: 'boutique',
    name: 'Boutique Hotel',
    category: 'Boutique',
    description: 'Intimate boutique hotel with personalized service',
    roomTypes: [
      { name: 'Designer Suite', basePrice: 65000, amenities: ['Queen Bed', 'Designer Furniture', 'Kitchenette', 'Balcony'] },
      { name: 'Comfort Room', basePrice: 35000, amenities: ['Double Bed', 'Modern Decor', 'Work Desk', 'WiFi'] }
    ],
    pricingRules: {
      taxRate: 7.5,
      serviceCharge: 8,
      seasonalMarkup: 15
    },
    branding: {
      primaryColor: '#4A5568',
      accentColor: '#ED8936',
      logoPlaceholder: '/boutique-logo-placeholder.png'
    },
    features: ['personalizedService', 'localExperiences', 'artGallery']
  },
  {
    id: 'budget',
    name: 'Budget Inn',
    category: 'Budget',
    description: 'Cost-effective accommodation with essential amenities',
    roomTypes: [
      { name: 'Standard Room', basePrice: 15000, amenities: ['Single Bed', 'AC', 'Shared Bath', 'WiFi'] },
      { name: 'Twin Room', basePrice: 22000, amenities: ['Twin Beds', 'Private Bath', 'TV', 'WiFi'] }
    ],
    pricingRules: {
      taxRate: 7.5,
      serviceCharge: 5,
      seasonalMarkup: 10
    },
    branding: {
      primaryColor: '#2D3748',
      accentColor: '#48BB78',
      logoPlaceholder: '/budget-logo-placeholder.png'
    },
    features: ['basicService', 'selfCheckIn', 'localTours']
  }
];

const mockRoles = [
  {
    id: 'hotel-owner',
    name: 'Hotel Owner',
    description: 'Full administrative access to hotel operations',
    permissions: {
      dashboard: { read: true, write: true },
      reservations: { read: true, write: true, cancel: true },
      rooms: { read: true, write: true },
      staff: { read: true, write: true, manage: true },
      reports: { read: true, write: true, export: true },
      billing: { read: true, write: true },
      settings: { read: true, write: true }
    },
    scope: 'tenant'
  },
  {
    id: 'front-desk',
    name: 'Front Desk',
    description: 'Guest check-in/out and reservation management',
    permissions: {
      dashboard: { read: true, write: false },
      reservations: { read: true, write: true, cancel: false },
      rooms: { read: true, write: true },
      staff: { read: false, write: false, manage: false },
      reports: { read: true, write: false, export: false },
      billing: { read: true, write: false },
      settings: { read: false, write: false }
    },
    scope: 'tenant'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Operations management and staff supervision',
    permissions: {
      dashboard: { read: true, write: true },
      reservations: { read: true, write: true, cancel: true },
      rooms: { read: true, write: true },
      staff: { read: true, write: true, manage: false },
      reports: { read: true, write: true, export: true },
      billing: { read: true, write: false },
      settings: { read: true, write: false }
    },
    scope: 'tenant'
  },
  {
    id: 'platform-admin',
    name: 'Platform Admin',
    description: 'Global platform administration',
    permissions: {
      tenants: { read: true, write: true, suspend: true },
      plans: { read: true, write: true },
      templates: { read: true, write: true },
      globalUsers: { read: true, write: true },
      audit: { read: true, write: true, export: true },
      support: { read: true, write: true }
    },
    scope: 'global'
  }
];

const mockGlobalUsers = [
  {
    id: 'admin1',
    name: 'Sarah Johnson',
    email: 'sarah@luxuryhotelsaas.com',
    role: 'platform-admin',
    status: 'active',
    department: 'Operations',
    lastLogin: '2024-01-20T08:30:00Z',
    permissions: ['all'],
    assignedTenants: []
  },
  {
    id: 'support1',
    name: 'Mike Chen',
    email: 'mike@luxuryhotelsaas.com',
    role: 'support-agent',
    status: 'active',
    department: 'Support',
    lastLogin: '2024-01-20T09:45:00Z',
    permissions: ['view', 'support'],
    assignedTenants: ['1', '2', '3']
  },
  {
    id: 'auditor1',
    name: 'Lisa Williams',
    email: 'lisa@luxuryhotelsaas.com',
    role: 'auditor',
    status: 'active',
    department: 'Compliance',
    lastLogin: '2024-01-19T14:20:00Z',
    permissions: ['view', 'audit'],
    assignedTenants: []
  }
];

const mockSupportTickets = [
  {
    id: 'ticket1',
    tenantId: '1',
    tenantName: 'Grand Palace Hotel',
    subject: 'Payment processing issue',
    status: 'open',
    priority: 'high',
    assignedTo: 'support1',
    createdAt: '2024-01-20T08:15:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    description: 'Credit card payments failing for new reservations'
  },
  {
    id: 'ticket2',
    tenantId: '2',
    tenantName: 'Boutique Suites',
    subject: 'Room service QR code not working',
    status: 'in-progress',
    priority: 'medium',
    assignedTo: 'support1',
    createdAt: '2024-01-19T16:20:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    description: 'Guests unable to scan QR codes in rooms 201-205'
  }
];

const mockAnnouncements = [
  {
    id: 'ann1',
    title: 'System Maintenance Scheduled',
    content: 'Planned maintenance window on Sunday 2AM-4AM GMT',
    type: 'maintenance',
    targetTenants: [],
    isGlobal: true,
    createdAt: '2024-01-18T10:00:00Z',
    status: 'active'
  },
  {
    id: 'ann2',
    title: 'New Feature: Mobile Check-in',
    content: 'Mobile check-in is now available for all Pro plan customers',
    type: 'feature',
    targetTenants: ['1'],
    isGlobal: false,
    createdAt: '2024-01-15T14:30:00Z',
    status: 'active'
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
    suspendedTenants: 14,
    monthlyActiveUsers: 2847,
    totalRevenue: 18500000,
    mrr: 1540000,
    arr: 18480000,
    growthRate: 12.5,
    churnRate: 3.2,
    avgOccupancy: 78.5,
    activeStaff: 1284,
    supportTickets: 24,
    emergencyModeActive: false
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
    ],
    churn: [
      { month: 'Jan', value: 2.8 },
      { month: 'Feb', value: 3.1 },
      { month: 'Mar', value: 2.9 },
      { month: 'Apr', value: 3.2 }
    ]
  },
  forecasting: {
    revenue: [
      { month: 'May', predicted: 19200000, confidence: 0.85 },
      { month: 'Jun', predicted: 20100000, confidence: 0.82 },
      { month: 'Jul', predicted: 21500000, confidence: 0.78 }
    ],
    churnRisk: [
      { tenantId: '3', tenantName: 'City Inn Express', riskScore: 0.85, factors: ['overdue_billing', 'low_usage'] },
      { tenantId: '4', tenantName: 'Marina Heights', riskScore: 0.65, factors: ['decreased_activity'] }
    ]
  },
  userAnalytics: {
    byPlan: [
      { plan: 'Starter', users: 145, avgSessionTime: 25 },
      { plan: 'Growth', users: 892, avgSessionTime: 35 },
      { plan: 'Pro', users: 1810, avgSessionTime: 45 }
    ],
    engagement: [
      { feature: 'Front Desk', usage: 95.2 },
      { feature: 'Room Service', usage: 78.4 },
      { feature: 'Reports', usage: 65.8 },
      { feature: 'QR Menus', usage: 82.1 }
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
      updatedAt: new Date().toISOString(),
      status: 'active',
      billingStatus: 'active'
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

  async suspendTenant(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to suspend tenant');
    const tenant = mockTenants.find(t => t.id === id);
    if (!tenant) throw new Error('Tenant not found');
    tenant.status = 'suspended';
    tenant.updatedAt = new Date().toISOString();
    return { data: tenant };
  },

  async reactivateTenant(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to reactivate tenant');
    const tenant = mockTenants.find(t => t.id === id);
    if (!tenant) throw new Error('Tenant not found');
    tenant.status = 'active';
    tenant.updatedAt = new Date().toISOString();
    return { data: tenant };
  },

  async impersonateTenant(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to generate impersonation token');
    return { 
      data: { 
        token: `impersonation_${id}_${Date.now()}`,
        redirectUrl: `/hotel/${id}/dashboard`,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }
    };
  },

  // Templates
  async getTemplates() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch templates');
    return { data: mockTemplates };
  },

  async getTemplate(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch template');
    const template = mockTemplates.find(t => t.id === id);
    if (!template) throw new Error('Template not found');
    return { data: template };
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

  // Roles & Permissions
  async getRoles() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch roles');
    return { data: mockRoles };
  },

  async getRole(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch role');
    const role = mockRoles.find(r => r.id === id);
    if (!role) throw new Error('Role not found');
    return { data: role };
  },

  async createRole(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create role');
    const newRole = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
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
    mockRoles.splice(index, 1);
    return { success: true };
  },

  // Global User Management
  async getGlobalUsers() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch global users');
    return { data: mockGlobalUsers };
  },

  async getGlobalUser(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch global user');
    const user = mockGlobalUsers.find(u => u.id === id);
    if (!user) throw new Error('Global user not found');
    return { data: user };
  },

  async createGlobalUser(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create global user');
    const newUser = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    mockGlobalUsers.push(newUser);
    return { data: newUser };
  },

  async updateGlobalUser(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update global user');
    const index = mockGlobalUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Global user not found');
    mockGlobalUsers[index] = { ...mockGlobalUsers[index], ...data };
    return { data: mockGlobalUsers[index] };
  },

  async deleteGlobalUser(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete global user');
    const index = mockGlobalUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Global user not found');
    mockGlobalUsers.splice(index, 1);
    return { success: true };
  },

  // Support & Communication
  async getSupportTickets() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch support tickets');
    return { data: mockSupportTickets };
  },

  async getSupportTicket(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch support ticket');
    const ticket = mockSupportTickets.find(t => t.id === id);
    if (!ticket) throw new Error('Support ticket not found');
    return { data: ticket };
  },

  async updateSupportTicket(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update support ticket');
    const index = mockSupportTickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Support ticket not found');
    mockSupportTickets[index] = { ...mockSupportTickets[index], ...data, updatedAt: new Date().toISOString() };
    return { data: mockSupportTickets[index] };
  },

  async getAnnouncements() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch announcements');
    return { data: mockAnnouncements };
  },

  async createAnnouncement(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create announcement');
    const newAnnouncement = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    mockAnnouncements.push(newAnnouncement);
    return { data: newAnnouncement };
  },

  async broadcastMessage(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to broadcast message');
    return { 
      data: { 
        messageId: Date.now().toString(),
        sentTo: data.targetTenants?.length || mockTenants.length,
        status: 'sent'
      }
    };
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
        emergencyModeEnabled: false,
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
  },

  async toggleEmergencyMode(enabled: boolean) {
    await delay();
    if (shouldFail()) throw new Error('Failed to toggle emergency mode');
    return { 
      data: { 
        emergencyModeEnabled: enabled,
        affectedTenants: mockTenants.length,
        updatedAt: new Date().toISOString()
      }
    };
  },

  // Bulk Operations
  async bulkImportTenants(csvData: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to import tenants');
    return { 
      data: { 
        imported: csvData.length,
        failed: 0,
        warnings: []
      }
    };
  },

  async bulkUpdateTenants(updates: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to bulk update tenants');
    return { 
      data: { 
        updated: updates.length,
        failed: 0
      }
    };
  }
};

export type Tenant = typeof mockTenants[0];
export type Plan = typeof mockPlans[0];
export type AuditLog = typeof mockAuditLogs[0];
export type Metrics = typeof mockMetrics;
export type Template = typeof mockTemplates[0];
export type Role = typeof mockRoles[0];
export type GlobalUser = typeof mockGlobalUsers[0];
export type SupportTicket = typeof mockSupportTickets[0];
export type Announcement = typeof mockAnnouncements[0];