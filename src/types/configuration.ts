export interface HotelConfiguration {
  // General Settings
  general: {
    hotel_name: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postal_code: string;
    };
    contact: {
      phone: string;
      email: string;
      website?: string;
    };
    timezone: string;
    date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    time_format: '12h' | '24h';
  };

  // Currency & Financials
  currency: {
    default_currency: string;
    currency_symbol: string;
    symbol_position: 'before' | 'after';
    decimal_places: number;
    thousand_separator: ',' | '.' | ' ';
    decimal_separator: '.' | ',';
  };
  
  tax: {
    vat_rate: number;
    service_charge_rate: number;
    tax_inclusive: boolean;
    service_charge_inclusive: boolean;
    vat_applicable_to?: string[];
    service_applicable_to?: string[];
    show_tax_breakdown?: boolean;
    zero_rate_hidden?: boolean;
  };

  // Branding & Identity
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    receipt_header_text: string;
    receipt_footer_text: string;
    font_style: 'giveny' | 'didot' | 'bodoni' | 'cormorant' | 'playfair' | 'zabatana' | 'coldiac' | 'malligoe';
  };

  // Receipts & Documents
  documents: {
    default_receipt_template: 'A4' | 'thermal_80mm' | 'thermal_58mm' | 'half_page';
    invoice_prefix: string;
    receipt_prefix: string;
    digital_signature_enabled: boolean;
    include_qr_code: boolean;
  };

  // Guest Experience
  guest_experience: {
    checkin_slip_fields: {
      guest_id_required: boolean;
      phone_required: boolean;
      email_required: boolean;
      address_required: boolean;
    };
    qr_defaults: {
      include_logo: boolean;
      include_hotel_name: boolean;
      qr_size: 'small' | 'medium' | 'large';
      default_services: string[];
    };
  };

  // Staff Permissions
  permissions: {
    pricing_changes_require_approval: boolean;
    discount_approval_threshold: number;
    refund_approval_threshold: number;
    service_price_edits_require_approval: boolean;
    manager_can_override_rates: boolean;
  };
}

export interface ConfigurationAuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: 'create' | 'update' | 'delete';
  section: keyof HotelConfiguration;
  field: string;
  old_value?: any;
  new_value: any;
  description: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
];