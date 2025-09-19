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