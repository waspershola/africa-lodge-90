export type ServiceStatus = 'active' | 'beta' | 'deprecated' | 'coming-soon';
export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';

export interface GlobalService {
  id: string;
  code: string; // Unique identifier like SERVICE_RS
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'hospitality' | 'dining' | 'maintenance' | 'guest-experience' | 'analytics';
  status: ServiceStatus;
  requires_staff_role?: string[];
  baseline_pricing?: ServicePricingTemplate[];
  created_at: string;
  updated_at: string;
  created_by: string;
  multilingual_support: boolean;
  api_endpoints?: string[];
}

export interface ServicePricingTemplate {
  id: string;
  service_code: string;
  item_name: string;
  baseline_price: number;
  currency: 'NGN'; // Base currency, auto-converted for tenants
  price_type: 'fixed' | 'per_unit' | 'percentage';
  min_allowed_price: number;
  max_allowed_price: number;
  override_allowed: boolean;
  approval_required_for_changes: boolean;
  description: string;
}

export interface ServicePlanMapping {
  id: string;
  service_code: string;
  plan: SubscriptionPlan;
  included: boolean;
  trial_access: boolean;
  feature_limits?: Record<string, any>;
  created_at: string;
}

export interface TenantServiceConfig {
  id: string;
  tenant_id: string;
  service_code: string;
  enabled: boolean;
  plan: SubscriptionPlan;
  trial_mode: boolean;
  trial_expires_at?: string;
  custom_pricing: ServiceCustomPricing[];
  restrictions: Record<string, any>;
  usage_stats: ServiceUsageStats;
  activated_at: string;
  activated_by: string;
}

export interface ServiceCustomPricing {
  id: string;
  template_id: string;
  custom_price: number;
  approved_by?: string;
  approved_at?: string;
  override_reason: string;
}

export interface ServiceUsageStats {
  total_requests: number;
  monthly_requests: number;
  peak_usage_date: string;
  average_response_time: number;
  customer_satisfaction: number;
  revenue_generated: number;
}

export interface ServiceAuditLog {
  id: string;
  action: 'service_created' | 'service_updated' | 'service_deprecated' | 'pricing_updated' | 'tenant_enabled' | 'tenant_disabled' | 'trial_started' | 'trial_expired' | 'plan_upgraded' | 'override_approved';
  service_code?: string;
  tenant_id?: string;
  performed_by: string;
  performed_at: string;
  details: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  services: string[]; // Array of service codes
  pricing_templates: ServicePricingTemplate[];
  default_for_plan?: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface TrialConfiguration {
  duration_days: number;
  included_services: string[];
  usage_limits: Record<string, number>;
  auto_expire: boolean;
  notification_days_before_expiry: number[];
  downgrade_plan: SubscriptionPlan;
}

export const DEFAULT_SERVICES: Omit<GlobalService, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] = [
  {
    code: 'SERVICE_RS',
    name: 'Room Service',
    description: 'In-room dining and delivery service with POS integration',
    icon: 'UtensilsCrossed',
    category: 'dining',
    status: 'active',
    requires_staff_role: ['restaurant', 'room-service'],
    multilingual_support: true,
    api_endpoints: ['/api/room-service/orders', '/api/room-service/menu']
  },
  {
    code: 'SERVICE_HK',
    name: 'Housekeeping',
    description: 'Room cleaning and maintenance request system',
    icon: 'Sparkles',
    category: 'hospitality',
    status: 'active',
    requires_staff_role: ['housekeeping'],
    multilingual_support: true,
    api_endpoints: ['/api/housekeeping/requests', '/api/housekeeping/status']
  },
  {
    code: 'SERVICE_MT',
    name: 'Maintenance',
    description: 'Facility maintenance and repair management',
    icon: 'Wrench',
    category: 'maintenance',
    status: 'active',
    requires_staff_role: ['maintenance', 'engineering'],
    multilingual_support: false,
    api_endpoints: ['/api/maintenance/work-orders']
  },
  {
    code: 'SERVICE_WIFI',
    name: 'Guest Wi-Fi',
    description: 'Guest internet access and network management',
    icon: 'Wifi',
    category: 'guest-experience',
    status: 'active',
    requires_staff_role: [],
    multilingual_support: true,
    api_endpoints: ['/api/wifi/access', '/api/wifi/usage']
  },
  {
    code: 'SERVICE_MENU',
    name: 'Digital Menu',
    description: 'QR-based digital menu and ordering system',
    icon: 'MenuSquare',
    category: 'dining',
    status: 'active',
    requires_staff_role: ['restaurant', 'kitchen'],
    multilingual_support: true,
    api_endpoints: ['/api/menu/items', '/api/menu/orders']
  },
  {
    code: 'SERVICE_EVENTS',
    name: 'Events & Packages',
    description: 'Event booking and package management system',
    icon: 'Calendar',
    category: 'hospitality',
    status: 'active',
    requires_staff_role: ['events', 'sales'],
    multilingual_support: true,
    api_endpoints: ['/api/events/bookings', '/api/events/packages']
  },
  {
    code: 'SERVICE_FEEDBACK',
    name: 'Feedback & Reviews',
    description: 'Guest feedback collection and review management',
    icon: 'MessageSquare',
    category: 'guest-experience',
    status: 'active',
    requires_staff_role: [],
    multilingual_support: true,
    api_endpoints: ['/api/feedback/submit', '/api/feedback/analytics']
  },
  {
    code: 'SERVICE_AI_CONCIERGE',
    name: 'AI Concierge',
    description: 'AI-powered guest assistance and automation',
    icon: 'Bot',
    category: 'guest-experience',
    status: 'beta',
    requires_staff_role: [],
    multilingual_support: true,
    api_endpoints: ['/api/ai/concierge', '/api/ai/chat']
  }
];

export const DEFAULT_PRICING_TEMPLATES: Omit<ServicePricingTemplate, 'id'>[] = [
  {
    service_code: 'SERVICE_RS',
    item_name: 'Delivery Fee',
    baseline_price: 500,
    currency: 'NGN',
    price_type: 'fixed',
    min_allowed_price: 200,
    max_allowed_price: 2000,
    override_allowed: true,
    approval_required_for_changes: true,
    description: 'Standard room service delivery charge'
  },
  {
    service_code: 'SERVICE_EVENTS',
    item_name: 'Booking Fee',
    baseline_price: 10000,
    currency: 'NGN',
    price_type: 'fixed',
    min_allowed_price: 5000,
    max_allowed_price: 50000,
    override_allowed: true,
    approval_required_for_changes: true,
    description: 'Standard event booking processing fee'
  },
  {
    service_code: 'SERVICE_WIFI',
    item_name: 'Premium Access',
    baseline_price: 1000,
    currency: 'NGN',
    price_type: 'per_unit',
    min_allowed_price: 0,
    max_allowed_price: 5000,
    override_allowed: true,
    approval_required_for_changes: false,
    description: 'Premium Wi-Fi access per day'
  }
];

export const PLAN_SERVICE_MAPPINGS: Omit<ServicePlanMapping, 'id' | 'created_at'>[] = [
  // Basic Plan
  { service_code: 'SERVICE_WIFI', plan: 'basic', included: true, trial_access: true },
  { service_code: 'SERVICE_HK', plan: 'basic', included: true, trial_access: true },
  { service_code: 'SERVICE_FEEDBACK', plan: 'basic', included: true, trial_access: true },
  
  // Pro Plan
  { service_code: 'SERVICE_WIFI', plan: 'pro', included: true, trial_access: true },
  { service_code: 'SERVICE_HK', plan: 'pro', included: true, trial_access: true },
  { service_code: 'SERVICE_FEEDBACK', plan: 'pro', included: true, trial_access: true },
  { service_code: 'SERVICE_RS', plan: 'pro', included: true, trial_access: true },
  { service_code: 'SERVICE_MT', plan: 'pro', included: true, trial_access: true },
  { service_code: 'SERVICE_MENU', plan: 'pro', included: true, trial_access: true },
  { service_code: 'SERVICE_EVENTS', plan: 'pro', included: true, trial_access: false },
  
  // Enterprise Plan
  { service_code: 'SERVICE_WIFI', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_HK', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_FEEDBACK', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_RS', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_MT', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_MENU', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_EVENTS', plan: 'enterprise', included: true, trial_access: true },
  { service_code: 'SERVICE_AI_CONCIERGE', plan: 'enterprise', included: true, trial_access: false }
];