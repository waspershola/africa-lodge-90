import { useState, useEffect } from 'react';
import { HotelConfiguration, ConfigurationAuditLog } from '@/types/configuration';

// Mock default configuration
const defaultConfiguration: HotelConfiguration = {
  general: {
    hotel_name: 'Grand Palace Lagos',
    address: {
      street: '123 Victoria Island',
      city: 'Lagos',
      state: 'Lagos State',
      country: 'Nigeria',
      postal_code: '101001'
    },
    contact: {
      phone: '+234 123 456 7890',
      email: 'info@grandpalacelagos.com',
      website: 'https://grandpalacelagos.com'
    },
    timezone: 'Africa/Lagos',
    date_format: 'DD/MM/YYYY',
    time_format: '24h'
  },
  currency: {
    default_currency: 'NGN',
    currency_symbol: '₦',
    symbol_position: 'before',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.'
  },
  tax: {
    vat_rate: 7.5,
    service_charge_rate: 10,
    tax_inclusive: false,
    service_charge_inclusive: false
  },
  branding: {
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    accent_color: '#f59e0b',
    receipt_header_text: 'Thank you for choosing Grand Palace Lagos',
    receipt_footer_text: 'We hope to see you again soon!'
  },
  documents: {
    default_receipt_template: 'A4',
    invoice_prefix: 'GP-INV',
    receipt_prefix: 'GP-RCP',
    digital_signature_enabled: true,
    include_qr_code: true
  },
  guest_experience: {
    checkin_slip_fields: {
      guest_id_required: true,
      phone_required: true,
      email_required: false,
      address_required: false
    },
    qr_defaults: {
      include_logo: true,
      include_hotel_name: true,
      qr_size: 'medium',
      default_services: ['wifi', 'room_service', 'housekeeping', 'maintenance']
    }
  },
  permissions: {
    pricing_changes_require_approval: true,
    discount_approval_threshold: 10000,
    refund_approval_threshold: 50000,
    service_price_edits_require_approval: true,
    manager_can_override_rates: false
  }
};

// Mock audit logs
const mockAuditLogs: ConfigurationAuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-19T10:15:00Z',
    user_id: 'owner-1',
    user_name: 'John Owner',
    user_role: 'owner',
    action: 'update',
    section: 'currency',
    field: 'default_currency',
    old_value: 'USD',
    new_value: 'NGN',
    description: 'Changed default currency from USD to NGN'
  },
  {
    id: '2',
    timestamp: '2024-01-19T10:17:00Z',
    user_id: 'owner-1',
    user_name: 'John Owner',
    user_role: 'owner',
    action: 'update',
    section: 'tax',
    field: 'vat_rate',
    old_value: 5,
    new_value: 7.5,
    description: 'Updated VAT rate from 5% to 7.5%'
  },
  {
    id: '3',
    timestamp: '2024-01-18T15:30:00Z',
    user_id: 'owner-1',
    user_name: 'John Owner',
    user_role: 'owner',
    action: 'update',
    section: 'branding',
    field: 'primary_color',
    old_value: '#3b82f6',
    new_value: '#2563eb',
    description: 'Updated primary brand color'
  }
];

export const useConfiguration = () => {
  const [configuration, setConfiguration] = useState<HotelConfiguration>(defaultConfiguration);
  const [auditLogs, setAuditLogs] = useState<ConfigurationAuditLog[]>(mockAuditLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock API call - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Configuration would be loaded here
      setConfiguration(defaultConfiguration);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (section: keyof HotelConfiguration, updates: Partial<HotelConfiguration[keyof HotelConfiguration]>) => {
    setLoading(true);
    setError(null);

    try {
      // Mock API call - replace with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));

      const oldValue = configuration[section];
      const newConfiguration = {
        ...configuration,
        [section]: {
          ...configuration[section],
          ...updates
        }
      };

      setConfiguration(newConfiguration);

      // Create audit log entry
      const auditEntry: ConfigurationAuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user_id: 'current-user',
        user_name: 'Current User',
        user_role: 'owner',
        action: 'update',
        section,
        field: Object.keys(updates)[0],
        old_value: oldValue,
        new_value: updates,
        description: `Updated ${section} configuration`
      };

      setAuditLogs(prev => [auditEntry, ...prev]);

      return true;
    } catch (err) {
      setError('Failed to update configuration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Mock file upload - replace with actual upload to Supabase storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const logoUrl = URL.createObjectURL(file); // Mock URL
      
      await updateConfiguration('branding', {
        ...configuration.branding,
        logo_url: logoUrl
      });

      return logoUrl;
    } catch (err) {
      setError('Failed to upload logo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async (section?: keyof HotelConfiguration) => {
    setLoading(true);
    setError(null);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (section) {
        await updateConfiguration(section, defaultConfiguration[section]);
      } else {
        setConfiguration(defaultConfiguration);
        
        // Create audit log for full reset
        const auditEntry: ConfigurationAuditLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          user_id: 'current-user',
          user_name: 'Current User',
          user_role: 'owner',
          action: 'update',
          section: 'general', // Represents full reset
          field: 'all',
          old_value: 'custom_configuration',
          new_value: 'default_configuration',
          description: 'Reset all configuration to defaults'
        };

        setAuditLogs(prev => [auditEntry, ...prev]);
      }

      return true;
    } catch (err) {
      setError('Failed to reset configuration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    configuration,
    auditLogs,
    loading,
    error,
    updateConfiguration,
    uploadLogo,
    resetToDefaults,
    loadConfiguration
  };
};