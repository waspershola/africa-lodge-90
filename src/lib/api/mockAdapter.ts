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
    staffCount: 1,
    isSystem: true,
    createdDate: '2024-01-01',
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
    staffCount: 3,
    isSystem: false,
    createdDate: '2024-01-15',
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
    staffCount: 2,
    isSystem: false,
    createdDate: '2024-01-10',
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
    staffCount: 0,
    isSystem: true,
    createdDate: '2024-01-01',
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
    description: 'Perfect for small boutique hotels',
    price: 35000,
    currency: 'NGN',
    maxRooms: 25,
    trialDays: 14,
    billingCycle: 'monthly',
    popular: false,
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
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Ideal for growing hotels with advanced features',
    price: 65000,
    currency: 'NGN',
    maxRooms: 75,
    trialDays: 14,
    billingCycle: 'monthly',
    popular: true,
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
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Enterprise solution with unlimited features',
    price: 120000,
    currency: 'NGN',
    maxRooms: 999,
    trialDays: 30,
    billingCycle: 'monthly',
    popular: false,
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
    }
  }
];

// Mock reservations data
const mockReservations = [
  {
    id: 'RES001',
    guestName: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+234 801 234 5678',
    room: '205',
    roomType: 'Deluxe King',
    checkIn: new Date(2024, 7, 22),
    checkOut: new Date(2024, 7, 25),
    status: 'confirmed',
    guests: 2,
    adults: 2,
    children: 0,
    nights: 3,
    amount: 450000,
    amountPaid: 200000,
    balanceDue: 250000,
    source: 'Direct Booking',
    paymentStatus: 'partial',
    paymentMode: 'card',
    specialRequests: 'Early check-in requested',
    createdAt: new Date(2024, 6, 15),
    updatedAt: new Date(2024, 6, 18),
    companyId: null,
    isOTA: false,
    otaReference: null
  },
  {
    id: 'RES002', 
    guestName: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    phone: '+234 802 345 6789',
    room: '312',
    roomType: 'Standard Twin',
    checkIn: new Date(2024, 7, 23),
    checkOut: new Date(2024, 7, 26),
    status: 'checked-in',
    guests: 1,
    adults: 1,
    children: 0,
    nights: 3,
    amount: 285000,
    amountPaid: 285000,
    balanceDue: 0,
    source: 'Booking.com',
    paymentStatus: 'paid',
    paymentMode: 'ota',
    specialRequests: '',
    createdAt: new Date(2024, 6, 20),
    updatedAt: new Date(2024, 7, 23),
    companyId: null,
    isOTA: true,
    otaReference: 'BK123456789'
  },
  {
    id: 'RES003',
    guestName: 'Michael Chen',
    email: 'michael.chen@email.com', 
    phone: '+234 803 456 7890',
    room: '108',
    roomType: 'Family Suite',
    checkIn: new Date(2024, 7, 24),
    checkOut: new Date(2024, 7, 27),
    status: 'pending',
    guests: 3,
    adults: 2,
    children: 1,
    nights: 3,
    amount: 520000,
    amountPaid: 0,
    balanceDue: 520000,
    source: 'Phone Booking',
    paymentStatus: 'pending',
    paymentMode: 'cash',
    specialRequests: 'Late checkout requested',
    createdAt: new Date(2024, 7, 10),
    updatedAt: new Date(2024, 7, 20),
    companyId: null,
    isOTA: false,
    otaReference: null
  },
  {
    id: 'RES004',
    guestName: 'Alice Johnson',
    email: 'alice.johnson@techcorp.com',
    phone: '+234 804 567 8901',
    room: '401',
    roomType: 'Executive Suite',
    checkIn: new Date(2024, 7, 25),
    checkOut: new Date(2024, 7, 28),
    status: 'confirmed',
    guests: 1,
    adults: 1,
    children: 0,
    nights: 3,
    amount: 375000,
    amountPaid: 375000,
    balanceDue: 0,
    source: 'Corporate',
    paymentStatus: 'paid',
    paymentMode: 'transfer',
    specialRequests: 'Business center access',
    createdAt: new Date(2024, 7, 1),
    updatedAt: new Date(2024, 7, 2),
    companyId: 'CORP001',
    companyName: 'TechCorp Solutions',
    isOTA: false,
    otaReference: null
  },
  {
    id: 'RES005',
    guestName: 'David Brown',
    email: 'david.brown@email.com',
    phone: '+234 805 678 9012',
    room: '102',
    roomType: 'Standard Twin',
    checkIn: new Date(2024, 7, 26),
    checkOut: new Date(2024, 7, 29),
    status: 'confirmed',
    guests: 2,
    adults: 2,
    children: 0,
    nights: 3,
    amount: 255000,
    amountPaid: 100000,
    balanceDue: 155000,
    source: 'Walk-in',
    paymentStatus: 'partial',
    paymentMode: 'cash',
    specialRequests: 'Ground floor room',
    createdAt: new Date(2024, 7, 21),
    updatedAt: new Date(2024, 7, 21),
    companyId: null,
    isOTA: false,
    otaReference: null
  }
];

// Mock companies for corporate bookings
const mockCompanies = [
  {
    id: 'CORP001',
    name: 'TechCorp Solutions',
    email: 'bookings@techcorp.com',
    phone: '+234 700 100 2000',
    address: '123 Victoria Island, Lagos',
    contactPerson: 'Jane Doe',
    paymentTerms: 'NET30',
    discountRate: 15,
    isActive: true
  },
  {
    id: 'CORP002', 
    name: 'Global Enterprises',
    email: 'travel@globalent.com',
    phone: '+234 700 200 3000',
    address: '456 Central Business District, Abuja',
    contactPerson: 'Bob Smith',
    paymentTerms: 'NET15',
    discountRate: 10,
    isActive: true
  }
];

// Mock guest profiles for returning guests
const mockGuestProfiles = [
  {
    id: 'GUEST001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+234 801 234 5678',
    preferences: 'High floor, king bed',
    vipStatus: 'Gold',
    totalStays: 5,
    lastStay: '2024-05-15'
  },
  {
    id: 'GUEST002',
    name: 'Sarah Wilson', 
    email: 'sarah.wilson@email.com',
    phone: '+234 802 345 6789',
    preferences: 'Non-smoking, early check-in',
    vipStatus: 'Silver',
    totalStays: 3,
    lastStay: '2024-06-10'
  }
];

// Mock room availability data
const mockRoomAvailability = [
  // Floor 1 - Standard Rooms
  {
    roomNumber: '101',
    roomType: 'Standard Twin',
    floor: 1,
    status: 'available',
    capacity: 2,
    price: 85000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Desk']
  },
  {
    roomNumber: '102',
    roomType: 'Standard Twin',
    floor: 1,
    status: 'reserved',
    capacity: 2,
    price: 85000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Desk'],
    currentGuest: 'RES005'
  },
  {
    roomNumber: '103',
    roomType: 'Standard Twin',
    floor: 1,
    status: 'available',
    capacity: 2,
    price: 85000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Desk']
  },
  {
    roomNumber: '104',
    roomType: 'Standard Twin',
    floor: 1,
    status: 'available',
    capacity: 2,
    price: 85000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Desk']
  },
  {
    roomNumber: '105',
    roomType: 'Standard King',
    floor: 1,
    status: 'out-of-service',
    capacity: 2,
    price: 95000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Desk', 'King Bed'],
    maintenanceReason: 'Plumbing repair'
  },
  
  // Floor 2 - Deluxe Rooms
  {
    roomNumber: '201',
    roomType: 'Deluxe King',
    floor: 2,
    status: 'available',
    capacity: 2,
    price: 125000,
    amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View']
  },
  {
    roomNumber: '202',
    roomType: 'Deluxe King',
    floor: 2,
    status: 'available',
    capacity: 2,
    price: 125000,
    amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View']
  },
  {
    roomNumber: '203',
    roomType: 'Deluxe King',
    floor: 2,
    status: 'available',
    capacity: 2,
    price: 125000,
    amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View']
  },
  {
    roomNumber: '204',
    roomType: 'Deluxe King',
    floor: 2,
    status: 'available',
    capacity: 2,
    price: 125000,
    amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View']
  },
  {
    roomNumber: '205',
    roomType: 'Deluxe King',
    floor: 2,
    status: 'reserved',
    capacity: 2,
    price: 125000,
    amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'City View'],
    currentGuest: 'RES001'
  },
  
  // Floor 3 - Suites
  {
    roomNumber: '301',
    roomType: 'Family Suite',
    floor: 3,
    status: 'available',
    capacity: 4,
    price: 185000,
    amenities: ['WiFi', 'AC', 'TV', 'Kitchenette', 'Living Area']
  },
  {
    roomNumber: '302',
    roomType: 'Family Suite',
    floor: 3,
    status: 'available',
    capacity: 4,
    price: 185000,
    amenities: ['WiFi', 'AC', 'TV', 'Kitchenette', 'Living Area']
  },
  {
    roomNumber: '303',
    roomType: 'Executive Suite',
    floor: 3,
    status: 'available',
    capacity: 3,
    price: 225000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Station', 'Balcony', 'Premium View']
  },
  {
    roomNumber: '304',
    roomType: 'Executive Suite',
    floor: 3,
    status: 'available',
    capacity: 3,
    price: 225000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Station', 'Balcony', 'Premium View']
  },
  
  // Floor 4 - Premium Suites
  {
    roomNumber: '401',
    roomType: 'Executive Suite', 
    floor: 4,
    status: 'reserved',
    capacity: 3,
    price: 225000,
    amenities: ['WiFi', 'AC', 'TV', 'Work Station', 'Balcony', 'Premium View'],
    currentGuest: 'RES004'
  },
  {
    roomNumber: '402',
    roomType: 'Presidential Suite',
    floor: 4,
    status: 'available',
    capacity: 4,
    price: 350000,
    amenities: ['WiFi', 'AC', 'TV', 'Full Kitchen', 'Living Room', 'Dining Area', 'Butler Service']
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

// Owner-specific mock data
const mockHotelProfile = {
  id: 'hotel-001',
  name: 'Lagos Grand Hotel',
  address: 'Victoria Island, Lagos, Nigeria',
  phone: '+234-1-234-5678',
  email: 'info@lagosgrand.com',
  website: 'https://lagosgrand.com',
  description: 'Luxury hospitality in the heart of Lagos',
  logo: '/api/placeholder/200/80',
  banner: '/api/placeholder/1200/400',
  theme: {
    primaryColor: '#C41E3A',
    secondaryColor: '#FFD700',
    accent: '#8B4513'
  },
  businessRegistration: 'RC-123456',
  taxId: 'TIN-987654321',
  category: 'Luxury Hotel',
  starRating: 5,
  totalRooms: 120,
  checkInTime: '15:00',
  checkOutTime: '12:00',
  timezone: 'Africa/Lagos',
  currency: 'NGN'
};

const mockOwnerStaff = [
  {
    id: 'staff-001',
    name: 'Adebayo Johnson',
    email: 'adebayo@lagosgrand.com',
    phone: '+234-701-234-5678',
    role: 'Front Desk Manager',
    department: 'Front Office',
    status: 'active',
    startDate: '2023-01-15',
    permissions: ['reservations.view', 'reservations.edit', 'guests.view'],
    avatar: '/api/placeholder/40/40',
    lastLogin: '2024-01-20T10:30:00Z'
  },
  {
    id: 'staff-002',
    name: 'Fatima Aliyu',
    email: 'fatima@lagosgrand.com',
    phone: '+234-702-345-6789',
    role: 'Housekeeping Supervisor',
    department: 'Housekeeping',
    status: 'active',
    startDate: '2023-03-20',
    permissions: ['rooms.view', 'rooms.edit'],
    avatar: '/api/placeholder/40/40',
    lastLogin: '2024-01-20T08:15:00Z'
  }
];

const mockOwnerAuditLogs = [
  {
    id: 'audit-001',
    action: 'staff.invite',
    userId: 'owner-001',
    userName: 'Hotel Owner',
    details: 'Invited new staff member: Adebayo Johnson',
    timestamp: '2024-01-20T10:30:00Z',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'audit-002',
    action: 'pricing.update',
    userId: 'owner-001',
    userName: 'Hotel Owner',
    details: 'Updated pricing for Deluxe Room category',
    timestamp: '2024-01-20T09:15:00Z',
    ipAddress: '192.168.1.100'
  }
];

const mockOwnerRoomCategories = [
  {
    id: 'cat-001',
    name: 'Standard Room',
    description: 'Comfortable accommodation with essential amenities',
    baseRate: 25000,
    maxOccupancy: 2,
    size: 28,
    amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar'],
    totalRooms: 40,
    availableRooms: 35,
    images: ['/api/placeholder/300/200']
  },
  {
    id: 'cat-002',
    name: 'Deluxe Room',
    description: 'Spacious room with premium amenities and city view',
    baseRate: 45000,
    maxOccupancy: 3,
    size: 42,
    amenities: ['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'City View', 'Coffee Machine'],
    totalRooms: 50,
    availableRooms: 42,
    images: ['/api/placeholder/300/200']
  }
];

// API endpoints
export const mockApi = {
  // Owner API endpoints
  getHotelProfile: async (): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch hotel profile');
    return { data: mockHotelProfile };
  },

  updateHotelProfile: async (data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to update hotel profile');
    return { data: { ...mockHotelProfile, ...data } };
  },

  getOwnerStaff: async (): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch staff');
    return { data: mockOwnerStaff };
  },

  inviteStaff: async (data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to invite staff');
    const newStaff = {
      id: `staff-${Date.now()}`,
      ...data,
      status: 'pending',
      avatar: '/api/placeholder/40/40'
    };
    return { data: newStaff };
  },

  updateStaffMember: async (id: string, data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to update staff');
    return { data: { id, ...data } };
  },

  deleteStaffMember: async (id: string): Promise<{ data: { success: boolean } }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete staff');
    return { data: { success: true } };
  },

  getOwnerRoomCategories: async (): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch room categories');
    return { data: mockOwnerRoomCategories };
  },

  createRoomCategory: async (data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to create room category');
    const newCategory = {
      id: `cat-${Date.now()}`,
      ...data,
      availableRooms: data.totalRooms
    };
    return { data: newCategory };
  },

  updateRoomCategory: async (id: string, data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to update room category');
    return { data: { id, ...data } };
  },

  deleteRoomCategory: async (id: string): Promise<{ data: { success: boolean } }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete room category');
    return { data: { success: true } };
  },

  getOwnerAuditLogs: async (): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch audit logs');
    return { data: mockOwnerAuditLogs };
  },

  // Reservations API endpoints
  getReservations: async (): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch reservations');
    return { data: mockReservations };
  },

  getReservation: async (id: string): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch reservation');
    const reservation = mockReservations.find(r => r.id === id);
    if (!reservation) throw new Error('Reservation not found');
    return { data: reservation };
  },

  createReservation: async (data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to create reservation');
    const newReservation = {
      id: `RES${Date.now()}`,
      ...data,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockReservations.push(newReservation);
    return { data: newReservation };
  },

  updateReservation: async (id: string, data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to update reservation');
    const index = mockReservations.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found');
    mockReservations[index] = { ...mockReservations[index], ...data, updatedAt: new Date() };
    return { data: mockReservations[index] };
  },

  deleteReservation: async (id: string): Promise<{ data: { success: boolean } }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete reservation');
    const index = mockReservations.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found');
    mockReservations.splice(index, 1);
    return { data: { success: true } };
  },

  // Room Availability API endpoints
  getRoomAvailability: async (checkIn?: Date, checkOut?: Date): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch room availability');
    return { data: mockRoomAvailability };
  },

  assignRoom: async (reservationId: string, roomNumber: string): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to assign room');
    const reservation = mockReservations.find(r => r.id === reservationId);
    if (!reservation) throw new Error('Reservation not found');
    
    // Check for conflicts
    const conflicts = mockReservations.filter(r => 
      r.room === roomNumber && 
      r.id !== reservationId &&
      r.status !== 'cancelled' &&
      ((new Date(reservation.checkIn) >= new Date(r.checkIn) && new Date(reservation.checkIn) < new Date(r.checkOut)) ||
       (new Date(reservation.checkOut) > new Date(r.checkIn) && new Date(reservation.checkOut) <= new Date(r.checkOut)))
    );
    
    if (conflicts.length > 0) {
      throw new Error('Room assignment conflict detected');
    }
    
    reservation.room = roomNumber;
    reservation.updatedAt = new Date();
    return { data: reservation };
  },

  // Check-in/Check-out operations
  checkInGuest: async (reservationId: string): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to check in guest');
    const reservation = mockReservations.find(r => r.id === reservationId);
    if (!reservation) throw new Error('Reservation not found');
    
    reservation.status = 'checked-in';
    reservation.updatedAt = new Date();
    return { data: reservation };
  },

  checkOutGuest: async (reservationId: string): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to check out guest');
    const reservation = mockReservations.find(r => r.id === reservationId);
    if (!reservation) throw new Error('Reservation not found');
    
    reservation.status = 'checked-out';
    reservation.updatedAt = new Date();
    return { data: reservation };
  },

  // Company/Corporate booking endpoints
  getCompanies: async (): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch companies');
    return { data: mockCompanies };
  },

  createCompany: async (data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to create company');
    const newCompany = {
      id: `CORP${Date.now()}`,
      ...data,
      isActive: true,
      createdAt: new Date()
    };
    mockCompanies.push(newCompany);
    return { data: newCompany };
  },

  // Guest profile endpoints
  getGuestProfiles: async (): Promise<{ data: any[] }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch guest profiles');
    return { data: mockGuestProfiles };
  },

  createGuestProfile: async (data: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to create guest profile');
    const newGuest = {
      id: `GUEST${Date.now()}`,
      ...data,
      totalStays: 0,
      vipStatus: 'Bronze',
      createdAt: new Date()
    };
    mockGuestProfiles.push(newGuest);
    return { data: newGuest };
  },

  // Auto-assignment logic
  autoAssignRoom: async (reservationData: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to auto-assign room');
    
    // Find available rooms matching the criteria
    const availableRooms = mockRoomAvailability.filter(room => 
      room.status === 'available' && 
      room.capacity >= reservationData.guests &&
      room.roomType.toLowerCase().includes(reservationData.roomType?.toLowerCase() || 'standard')
    );

    if (availableRooms.length === 0) {
      throw new Error('No available rooms matching criteria');
    }

    // Simple assignment logic - pick first available room
    const assignedRoom = availableRooms[0];
    
    return { data: { roomNumber: assignedRoom.roomNumber, roomType: assignedRoom.roomType } };
  },

  // OTA integration placeholders
  importOTAReservation: async (otaData: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to import OTA reservation');
    
    const newReservation = {
      id: `OTA${Date.now()}`,
      ...otaData,
      source: otaData.source || 'OTA',
      isOTA: true,
      paymentMode: 'ota',
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockReservations.push(newReservation);
    return { data: newReservation };
  },

  // Enhanced conflict detection
  checkRoomConflicts: async (reservationData: any): Promise<{ data: any }> => {
    await delay();
    if (shouldFail()) throw new Error('Failed to check room conflicts');
    
    const { roomNumber, checkIn, checkOut, reservationId } = reservationData;
    const conflicts = mockReservations.filter(r => 
      r.room === roomNumber && 
      r.id !== reservationId &&
      r.status !== 'cancelled' &&
      r.status !== 'checked-out' &&
      (
        (new Date(checkIn) >= new Date(r.checkIn) && new Date(checkIn) < new Date(r.checkOut)) ||
        (new Date(checkOut) > new Date(r.checkIn) && new Date(checkOut) <= new Date(r.checkOut)) ||
        (new Date(checkIn) <= new Date(r.checkIn) && new Date(checkOut) >= new Date(r.checkOut))
      )
    );
    
    return { 
      data: { 
        hasConflicts: conflicts.length > 0, 
        conflicts: conflicts.map(c => ({
          id: c.id,
          guestName: c.guestName,
          checkIn: c.checkIn,
          checkOut: c.checkOut,
          status: c.status
        }))
      }
    };
  },
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

  async getPlans() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch plans');
    return { data: mockPlans };
  },

  async createPlan(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create plan');
    const newPlan = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    };
    mockPlans.push(newPlan);
    return { data: newPlan };
  },

  async updatePlan(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update plan');
    const index = mockPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');
    mockPlans[index] = { ...mockPlans[index], ...data };
    return { data: mockPlans[index] };
  },

  async deletePlan(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to delete plan');
    const index = mockPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');
    mockPlans.splice(index, 1);
    return { success: true };
  },

  async getPlanMetrics() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch plan metrics');
    return {
      data: {
        adoption: [
          { planName: 'Starter', subscribers: 45, revenue: 1575000, growth: 12.5 },
          { planName: 'Growth', subscribers: 78, revenue: 5070000, growth: 18.3 },
          { planName: 'Pro', subscribers: 33, revenue: 3960000, growth: 22.1 }
        ],
        revenue: [
          { month: 'Jan', starter: 1200000, growth: 3800000, pro: 2800000 },
          { month: 'Feb', starter: 1350000, growth: 4200000, pro: 3200000 },
          { month: 'Mar', starter: 1450000, growth: 4650000, pro: 3650000 },
          { month: 'Apr', starter: 1575000, growth: 5070000, pro: 3960000 }
        ],
        trialConversions: [
          { planName: 'Starter', trials: 125, conversions: 89, conversionRate: 71.2 },
          { planName: 'Growth', trials: 98, conversions: 78, conversionRate: 79.6 },
          { planName: 'Pro', trials: 45, conversions: 33, conversionRate: 73.3 }
        ],
        churn: [
          { planName: 'Starter', churned: 8, retained: 37, churnRate: 17.8 },
          { planName: 'Growth', churned: 5, retained: 73, churnRate: 6.4 },
          { planName: 'Pro', churned: 2, retained: 31, churnRate: 6.1 }
        ]
      }
    };
  },

  async sendInvoiceReminder(tenantId: string, type: 'overdue' | 'upcoming') {
    await delay();
    if (shouldFail()) throw new Error('Failed to send invoice reminder');
    return {
      data: {
        messageId: Date.now().toString(),
        sentTo: tenantId,
        type,
        status: 'sent',
        sentAt: new Date().toISOString()
      }
    };
  },

  async processSubscriptionRenewal(tenantId: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to process subscription renewal');
    const tenant = mockTenants.find(t => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');
    
    // Simulate subscription expiry check and renewal
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    return {
      data: {
        tenantId,
        renewed: true,
        nextBillingDate: nextBillingDate.toISOString(),
        amount: mockPlans.find(p => p.name === tenant.plan)?.price || 0
      }
    };
  },

  async checkSubscriptionExpiry() {
    await delay();
    if (shouldFail()) throw new Error('Failed to check subscription expiry');
    
    // Simulate checking for expired subscriptions
    const expiredTenants = mockTenants.filter(t => t.billingStatus === 'overdue');
    const expiringTenants = mockTenants.filter(t => 
      t.billingStatus === 'active' && Math.random() > 0.8 // Simulate 20% expiring soon
    );
    
    return {
      data: {
        expired: expiredTenants,
        expiringSoon: expiringTenants,
        totalChecked: mockTenants.length,
        suspensionRequired: expiredTenants.length
      }
    };
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
  },

  // Billing & Payments API
  async getBills(filters?: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch bills');
    
    // Mock bills data linked to reservations
    const mockBills = [
      {
        id: 'BILL-001',
        reservationId: 'RES-001',
        guestName: 'John Smith',
        room: '205',
        checkIn: new Date(2024, 7, 22),
        checkOut: new Date(2024, 7, 25),
        status: 'pending',
        totalAmount: 450000,
        paidAmount: 200000,
        balancedue: 250000,
        lineItems: [
          { type: 'Room', description: 'Deluxe Room - 3 nights', quantity: 3, unitPrice: 120000, total: 360000 },
          { type: 'Tax', description: 'VAT (7.5%)', quantity: 1, unitPrice: 27000, total: 27000 },
          { type: 'Service', description: 'Service Charge (10%)', quantity: 1, unitPrice: 36000, total: 36000 },
          { type: 'Extra', description: 'Minibar', quantity: 1, unitPrice: 15000, total: 15000 }
        ],
        payments: [
          { id: 'PAY-001', date: new Date(2024, 7, 22), amount: 200000, method: 'card', reference: 'TXN123456' }
        ],
        discounts: [],
        createdAt: new Date(2024, 7, 22)
      },
      {
        id: 'BILL-002',
        reservationId: 'RES-002', 
        guestName: 'Sarah Wilson',
        room: '312',
        checkIn: new Date(2024, 7, 23),
        checkOut: new Date(2024, 7, 26),
        status: 'paid',
        totalAmount: 285000,
        paidAmount: 285000,
        balancedue: 0,
        lineItems: [
          { type: 'Room', description: 'Standard Room - 3 nights', quantity: 3, unitPrice: 80000, total: 240000 },
          { type: 'Tax', description: 'VAT (7.5%)', quantity: 1, unitPrice: 18000, total: 18000 },
          { type: 'Service', description: 'Service Charge (10%)', quantity: 1, unitPrice: 24000, total: 24000 }
        ],
        payments: [
          { id: 'PAY-002', date: new Date(2024, 7, 23), amount: 285000, method: 'transfer', reference: 'BANK789' }
        ],
        discounts: [],
        createdAt: new Date(2024, 7, 23)
      }
    ];

    return { data: mockBills };
  },

  async addChargeToBill(billId: string, chargeData: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to add charge to bill');
    
    return { 
      data: { 
        billId,
        chargeId: Date.now().toString(),
        ...chargeData,
        addedAt: new Date().toISOString()
      }
    };
  },

  async recordPayment(paymentData: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to record payment');
    
    return {
      data: {
        id: `PAY-${Date.now()}`,
        ...paymentData,
        recordedAt: new Date().toISOString(),
        status: 'completed'
      }
    };
  },

  async getBillingStats() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch billing stats');
    
    return {
      data: {
        totalRevenue: 12500000,
        pendingPayments: 3200000,
        totalInvoices: 156,
        outstandingBalance: 850000,
        todaysCashflow: {
          cash: 2800000,
          card: 4200000,
          transfer: 3500000,
          pos: 1200000,
          wallet: 800000
        }
      }
    };
  },

  // Guest Management API
  async getGuests() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch guests');
    
    const mockGuests = [
      {
        id: 'GUEST-001',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+234 802 123 4567',
        nationality: 'American',
        company: 'Tech Solutions Inc.',
        status: 'vip',
        loyaltyTier: 'gold',
        totalStays: 15,
        totalNights: 45,
        totalSpent: 2500000,
        avgSpendPerStay: 166667,
        outstandingBalance: 0,
        lastStayDate: new Date(2024, 7, 25),
        avatar: null,
        notes: 'Prefers executive floor rooms. Vegetarian meals.',
        preferences: 'Non-smoking rooms, late checkout',
        tags: ['Corporate', 'VIP', 'Frequent']
      },
      {
        id: 'GUEST-002',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        phone: '+234 803 987 6543',
        nationality: 'British',
        company: null,
        status: 'active',
        loyaltyTier: 'silver',
        totalStays: 8,
        totalNights: 20,
        totalSpent: 950000,
        avgSpendPerStay: 118750,
        outstandingBalance: 0,
        lastStayDate: new Date(2024, 7, 20),
        avatar: null,
        notes: 'Allergic to seafood. Prefers ground floor.',
        preferences: 'Quiet rooms, early breakfast',
        tags: ['Leisure', 'Regular']
      },
      {
        id: 'GUEST-003',
        name: 'Michael Chen',
        email: 'michael.chen@corp.com',
        phone: '+234 805 555 1234',
        nationality: 'Chinese',
        company: 'Global Industries Ltd.',
        status: 'active',
        loyaltyTier: 'bronze',
        totalStays: 3,
        totalNights: 12,
        totalSpent: 520000,
        avgSpendPerStay: 173333,
        outstandingBalance: 420000,
        lastStayDate: new Date(2024, 7, 27),
        avatar: null,
        notes: 'Corporate account holder. Extended stays.',
        preferences: 'Business center access, Wi-Fi',
        tags: ['Corporate', 'Extended Stay']
      }
    ];

    return { data: mockGuests };
  },

  async getGuest(id: string) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch guest');
    
    const guests = (await this.getGuests()).data;
    const guest = guests.find(g => g.id === id);
    if (!guest) throw new Error('Guest not found');
    
    return { data: guest };
  },

  async createGuest(data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to create guest');
    
    const newGuest = {
      id: `GUEST-${Date.now()}`,
      ...data,
      totalStays: 0,
      totalNights: 0,
      totalSpent: 0,
      avgSpendPerStay: 0,
      outstandingBalance: 0,
      loyaltyTier: data.isVip ? 'gold' : 'bronze',
      lastStayDate: null,
      avatar: null,
      tags: data.isVip ? ['VIP'] : [],
      createdAt: new Date().toISOString()
    };

    return { data: newGuest };
  },

  async updateGuest(id: string, data: any) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update guest');
    
    return { 
      data: { 
        id,
        ...data,
        updatedAt: new Date().toISOString()
      }
    };
  },

  async getGuestStats() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch guest stats');
    
    return {
      data: {
        totalGuests: 156,
        vipGuests: 23,
        corporateAccounts: 12,
        totalRevenue: 15800000
      }
    };
  },

  async getCorporateAccounts() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch corporate accounts');
    
    const mockAccounts = [
      {
        id: 'CORP-001',
        companyName: 'Tech Solutions Inc.',
        industry: 'Technology',
        contactPerson: 'David Johnson',
        contactPhone: '+234 801 234 5678',
        contactEmail: 'david.johnson@techsol.com',
        status: 'active',
        billingType: 'centralized',
        totalGuests: 25,
        activeBookings: 3,
        totalBookings: 145,
        totalRevenue: 8500000,
        outstandingBalance: 0,
        creditLimit: 2000000,
        rateType: 'corporate',
        corporateDiscount: 15,
        paymentTerms: 30,
        recentBookings: [
          { guestName: 'John Smith', room: '205', checkIn: 'Aug 22', amount: 450000 },
          { guestName: 'Jane Doe', room: '312', checkIn: 'Aug 20', amount: 285000 },
          { guestName: 'Bob Wilson', room: '108', checkIn: 'Aug 18', amount: 320000 }
        ]
      },
      {
        id: 'CORP-002',
        companyName: 'Global Industries Ltd.',
        industry: 'Manufacturing',
        contactPerson: 'Lisa Chen',
        contactPhone: '+234 802 345 6789',
        contactEmail: 'lisa.chen@global.com',
        status: 'active',
        billingType: 'individual',
        totalGuests: 18,
        activeBookings: 2,
        totalBookings: 89,
        totalRevenue: 4200000,
        outstandingBalance: 420000,
        creditLimit: 1500000,
        rateType: 'corporate',
        corporateDiscount: 10,
        paymentTerms: 45,
        recentBookings: [
          { guestName: 'Michael Chen', room: '415', checkIn: 'Aug 24', amount: 520000 },
          { guestName: 'Susan Lee', room: '220', checkIn: 'Aug 19', amount: 180000 }
        ]
      }
    ];

    return { data: mockAccounts };
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