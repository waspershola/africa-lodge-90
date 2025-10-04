import { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Calendar,
  BedDouble,
  Users,
  QrCode,
  FileText,
  UserCircle,
  Battery,
  Settings,
  DollarSign,
  CreditCard,
  Sparkles,
  User,
  MessageSquare,
  Home,
  Receipt,
  Shield,
  Activity,
  Bell,
  Bed,
  CheckCircle,
  ClipboardList,
  Package,
  Clock,
  AlertTriangle,
  Wrench,
  ChefHat,
  Menu,
  UtensilsCrossed
} from 'lucide-react';

export type UserRole = 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS' | 'FRONT_DESK' | 'SUPER_ADMIN';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  module?: string;
  permission?: string;
}

export interface RoleDashboardConfig {
  displayName: string;
  subtitle: string;
  navigation: NavigationItem[];
  defaultRoute: string;
  headerBadge: {
    icon: LucideIcon;
    label: string;
  };
  layoutConfig?: {
    showTrialBanner?: boolean;
    backToSiteUrl?: string;
  };
}

export const DASHBOARD_CONFIG: Record<UserRole, RoleDashboardConfig> = {
  OWNER: {
    displayName: 'Hotel Owner',
    subtitle: 'Hotel Owner Dashboard',
    navigation: [
      { name: 'Dashboard', href: '/owner-dashboard/dashboard', icon: BarChart3, module: 'dashboard' },
      { name: 'Hotel Configuration', href: '/owner-dashboard/configuration', icon: Settings, module: 'configuration' },
      { name: 'Reservations', href: '/owner-dashboard/reservations', icon: Calendar, module: 'reservations' },
      { name: 'Rooms & Rates', href: '/owner-dashboard/rooms', icon: BedDouble, module: 'rooms' },
      { name: 'Guests', href: '/owner-dashboard/guests', icon: Users, module: 'guests' },
      { name: 'Housekeeping', href: '/owner-dashboard/housekeeping', icon: Sparkles, module: 'housekeeping' },
      { name: 'Billing & Payments', href: '/owner-dashboard/billing', icon: CreditCard, module: 'billing' },
      { name: 'QR Manager', href: '/owner-dashboard/qr-manager', icon: QrCode, module: 'qr-manager' },
      { name: 'QR Analytics', href: '/owner-dashboard/qr-analytics', icon: BarChart3, module: 'qr-analytics' },
      { name: 'SMS Center', href: '/owner-dashboard/sms', icon: MessageSquare, module: 'sms' },
      { name: 'Reports', href: '/owner-dashboard/reports', icon: FileText, module: 'reports' },
      { name: 'Staff & Roles', href: '/owner-dashboard/staff', icon: UserCircle, module: 'staff' },
      { name: 'Financials', href: '/owner-dashboard/financials', icon: DollarSign, module: 'financials' },
      { name: 'Power & Fuel', href: '/owner-dashboard/utilities', icon: Battery, module: 'utilities' },
      { name: 'Profile Settings', href: '/owner-dashboard/profile', icon: User, module: 'profile' },
    ],
    defaultRoute: '/owner-dashboard/dashboard',
    headerBadge: {
      icon: Settings,
      label: 'Owner'
    },
    layoutConfig: {
      showTrialBanner: true,
      backToSiteUrl: '/'
    }
  },

  MANAGER: {
    displayName: 'Hotel Manager',
    subtitle: 'Manager Operations Center',
    navigation: [
      { name: 'Overview', href: '/manager-dashboard/dashboard', icon: Home, module: 'dashboard' },
      { name: 'Operations', href: '/manager-dashboard/operations', icon: Activity, module: 'operations' },
      { name: 'Approvals', href: '/manager-dashboard/approvals', icon: CheckCircle, module: 'approvals' },
      { name: 'Room Status', href: '/manager-dashboard/rooms', icon: Bed, module: 'rooms' },
      { name: 'Service Requests', href: '/manager-dashboard/requests', icon: Bell, module: 'requests' },
      { name: 'Staff Management', href: '/manager-dashboard/staff', icon: Users, module: 'staff' },
      { name: 'QR Management', href: '/manager-dashboard/qr-codes', icon: QrCode, module: 'qr-codes' },
      { name: 'SMS Center', href: '/manager-dashboard/sms', icon: MessageSquare, module: 'sms' },
      { name: 'Department Finance', href: '/manager-dashboard/financials', icon: DollarSign, module: 'financials' },
      { name: 'Receipt Control', href: '/manager-dashboard/receipts', icon: Receipt, module: 'receipts' },
      { name: 'Events & Packages', href: '/manager-dashboard/events', icon: Calendar, module: 'events' },
      { name: 'Compliance', href: '/manager-dashboard/compliance', icon: Shield, module: 'compliance' },
    ],
    defaultRoute: '/manager-dashboard/dashboard',
    headerBadge: {
      icon: Settings,
      label: 'Manager'
    },
    layoutConfig: {
      backToSiteUrl: '/'
    }
  },

  ACCOUNTANT: {
    displayName: 'Accountant',
    subtitle: 'Financial Management',
    navigation: [
      { name: 'Dashboard', href: '/accountant-dashboard/dashboard', icon: BarChart3, module: 'dashboard' },
      { name: 'Payments', href: '/accountant-dashboard/payments', icon: CreditCard, module: 'payments' },
      { name: 'Financial Reports', href: '/accountant-dashboard/reports', icon: FileText, module: 'reports' },
      { name: 'Payroll', href: '/accountant-dashboard/payroll', icon: Users, module: 'payroll' },
    ],
    defaultRoute: '/accountant-dashboard/dashboard',
    headerBadge: {
      icon: DollarSign,
      label: 'Accountant'
    },
    layoutConfig: {
      backToSiteUrl: '/'
    }
  },

  HOUSEKEEPING: {
    displayName: 'Housekeeping Staff',
    subtitle: 'Housekeeping Operations Center',
    navigation: [
      { name: 'Dashboard', href: '/housekeeping-dashboard/dashboard', icon: Home, module: 'dashboard' },
      { name: 'Tasks Board', href: '/housekeeping-dashboard/tasks', icon: ClipboardList, module: 'tasks' },
      { name: 'Amenity Requests', href: '/housekeeping-dashboard/amenities', icon: Clock, module: 'amenities' },
      { name: 'Supplies', href: '/housekeeping-dashboard/supplies', icon: Package, module: 'supplies' },
      { name: 'OOS Rooms', href: '/housekeeping-dashboard/oos-rooms', icon: AlertTriangle, module: 'oos-rooms' },
      { name: 'Staff Assignments', href: '/housekeeping-dashboard/staff', icon: Users, module: 'staff' },
      { name: 'Audit Logs', href: '/housekeeping-dashboard/audit', icon: FileText, module: 'audit' },
    ],
    defaultRoute: '/housekeeping-dashboard/dashboard',
    headerBadge: {
      icon: Settings,
      label: 'Housekeeping'
    },
    layoutConfig: {
      backToSiteUrl: '/'
    }
  },

  MAINTENANCE: {
    displayName: 'Maintenance Staff',
    subtitle: 'Maintenance Operations Center',
    navigation: [
      { name: 'Dashboard', href: '/maintenance-dashboard/dashboard', icon: Home, module: 'dashboard' },
      { name: 'Work Orders', href: '/maintenance-dashboard/work-orders', icon: ClipboardList, module: 'work-orders' },
      { name: 'Preventive Schedule', href: '/maintenance-dashboard/preventive', icon: Calendar, module: 'preventive' },
      { name: 'Supplies & Parts', href: '/maintenance-dashboard/supplies', icon: Package, module: 'supplies' },
      { name: 'Audit Logs', href: '/maintenance-dashboard/audit', icon: FileText, module: 'audit' },
    ],
    defaultRoute: '/maintenance-dashboard/dashboard',
    headerBadge: {
      icon: Wrench,
      label: 'Maintenance'
    },
    layoutConfig: {
      backToSiteUrl: '/'
    }
  },

  POS: {
    displayName: 'POS Staff',
    subtitle: 'Restaurant POS System',
    navigation: [
      { name: 'Live Orders', href: '/pos/dashboard', icon: Home, module: 'dashboard' },
      { name: 'Kitchen Display', href: '/pos/kds', icon: ChefHat, module: 'kds' },
      { name: 'Menu Management', href: '/pos/menu', icon: Menu, module: 'menu' },
      { name: 'Payment & Billing', href: '/pos/payment', icon: CreditCard, module: 'payment' },
      { name: 'Approvals', href: '/pos/approvals', icon: Clock, module: 'approvals' },
      { name: 'Reports', href: '/pos/reports', icon: BarChart3, module: 'reports' },
      { name: 'Settings', href: '/pos/settings', icon: Settings, module: 'settings' },
    ],
    defaultRoute: '/pos/dashboard',
    headerBadge: {
      icon: UtensilsCrossed,
      label: 'POS'
    },
    layoutConfig: {
      backToSiteUrl: '/'
    }
  },

  // Front Desk remains separate (not part of unified shell)
  FRONT_DESK: {
    displayName: 'Front Desk',
    subtitle: 'Front Desk Operations',
    navigation: [],
    defaultRoute: '/front-desk',
    headerBadge: {
      icon: UserCircle,
      label: 'Front Desk'
    }
  },

  // Super Admin remains separate (not part of unified shell)
  SUPER_ADMIN: {
    displayName: 'Super Admin',
    subtitle: 'System Administration',
    navigation: [],
    defaultRoute: '/sa',
    headerBadge: {
      icon: Shield,
      label: 'Admin'
    }
  }
};

// Roles that use the unified dashboard shell
export const UNIFIED_DASHBOARD_ROLES: UserRole[] = [
  'OWNER',
  'MANAGER',
  'ACCOUNTANT',
  'HOUSEKEEPING',
  'MAINTENANCE',
  'POS'
];

// Helper to check if role uses unified dashboard
export const usesUnifiedDashboard = (role: UserRole): boolean => {
  return UNIFIED_DASHBOARD_ROLES.includes(role);
};

// Get dashboard config for a role
export const getDashboardConfig = (role: UserRole): RoleDashboardConfig | null => {
  return DASHBOARD_CONFIG[role] || null;
};

// Get navigation for a role
export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  const config = getDashboardConfig(role);
  return config?.navigation || [];
};

// Get default route for a role
export const getDefaultRouteForRole = (role: UserRole): string => {
  const config = getDashboardConfig(role);
  return config?.defaultRoute || '/';
};
