export interface ServiceCharge {
  id: string;
  service_type: 'room' | 'restaurant' | 'housekeeping' | 'maintenance' | 'events';
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  staff_id?: string;
  staff_name?: string;
}

export interface GuestBill {
  room_id: string;
  room_number: string;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  stay_duration: number;
  service_charges: ServiceCharge[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  pending_balance: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
}

export interface PaymentRecord {
  id: string;
  bill_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  processed_by: string;
  processed_at: string;
}

export interface CheckoutSession {
  room_id: string;
  guest_bill: GuestBill;
  payment_records: PaymentRecord[];
  checkout_status: 'pending' | 'ready' | 'completed';
  handled_by?: string;
  completed_at?: string;
}

export type AddonType = 'sms_bundle' | 'integration' | 'customization' | 'feature';
export type BillingInterval = 'monthly' | 'quarterly' | 'yearly' | 'one_time';
export type SMSSourceType = 'plan_included' | 'addon_purchase' | 'manual_topup' | 'usage';
export type SMSStatus = 'sent' | 'failed' | 'pending';

export interface Addon {
  id: string;
  name: string;
  description: string;
  addon_type: AddonType;
  price: number;
  is_recurring: boolean;
  billing_interval: BillingInterval;
  sms_credits_bonus: number;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantAddon {
  id: string;
  tenant_id: string;
  addon_id: string;
  addon: Addon;
  is_active: boolean;
  purchased_at: string;
  expires_at?: string;
  auto_renew: boolean;
  quantity: number;
  metadata: Record<string, any>;
}

export interface SMSCredits {
  id: string;
  tenant_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  last_topup_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SMSLog {
  id: string;
  tenant_id: string;
  credits_used: number;
  source_type: SMSSourceType;
  source_id?: string;
  purpose?: string;
  recipient_phone?: string;
  message_preview?: string;
  status: SMSStatus;
  cost_per_credit: number;
  created_at: string;
}

export interface SMSUsageStats {
  total_sent: number;
  total_failed: number;
  credits_used_today: number;
  credits_used_this_month: number;
  average_daily_usage: number;
  projected_monthly_usage: number;
}