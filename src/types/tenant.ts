export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'canceled' | 'suspended';
export type BillingProvider = 'stripe' | 'paystack' | 'manual';
export type UserRole = 'super_admin' | 'owner' | 'manager' | 'staff' | 'chef' | 'accountant';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'disabled';

export interface Tenant {
  tenant_id: string;
  hotel_name: string;
  location?: string;
  plan_id: string;
  subscription_status: SubscriptionStatus;
  billing_provider?: BillingProvider;
  trial_start?: string;
  trial_end?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  is_trial_active?: boolean;
  days_remaining?: number;
  is_expired?: boolean;
}

export interface Plan {
  plan_id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  room_capacity_min: number;
  room_capacity_max: number;
  is_trial_allowed: boolean;
  trial_duration_days: number;
  status: 'active' | 'deprecated';
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  shift_start?: string;
  shift_end?: string;
  permissions: string[];
  
  // Password reset fields
  force_reset: boolean;
  temp_password?: string;
  temp_expires?: string;
  
  // Metadata
  last_login?: string;
  created_at: string;
  updated_at: string;
  invited_by?: string;
  invited_at?: string;
}

export interface BillingTransaction {
  txn_id: string;
  tenant_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  provider: BillingProvider;
  provider_txn_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoice_url?: string;
  created_at: string;
  processed_at?: string;
}

export interface AuditLog {
  log_id: string;
  actor_id: string;
  actor_email: string;
  tenant_id?: string;
  target_user_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface TenantInvite {
  invite_id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  department?: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface TrialExtension {
  extension_id: string;
  tenant_id: string;
  extended_by: string; // super_admin user_id
  original_end: string;
  new_end: string;
  reason: string;
  created_at: string;
}