import { useState, useEffect } from 'react';
import { HotelConfiguration, ConfigurationAuditLog } from '@/types/configuration';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

// Default configuration template
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
    receipt_footer_text: 'We hope to see you again soon!',
    font_style: 'playfair' as const
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
  const [auditLogs, setAuditLogs] = useState<ConfigurationAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load configuration on mount
  useEffect(() => {
    if (user?.tenant_id) {
      loadConfiguration();
    }
  }, [user?.tenant_id]);

  const loadConfiguration = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    setError(null);
    
    try {
      // Get tenant configuration
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .single();

      if (tenantError) throw tenantError;

      // Transform tenant data to HotelConfiguration format
      const config: HotelConfiguration = {
        general: {
          hotel_name: tenant.hotel_name,
          address: {
            street: tenant.address || '',
            city: tenant.city || '',
            state: '',
            country: tenant.country,
            postal_code: ''
          },
          contact: {
            phone: tenant.phone || '',
            email: tenant.email || '',
            website: ''
          },
          timezone: tenant.timezone || 'Africa/Lagos',
          date_format: 'DD/MM/YYYY',
          time_format: '24h'
        },
        currency: {
          default_currency: tenant.currency,
          currency_symbol: tenant.currency === 'NGN' ? '₦' : '$',
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
          primary_color: (tenant.brand_colors as any)?.primary || '#2563eb',
          secondary_color: (tenant.brand_colors as any)?.secondary || '#64748b',
          accent_color: (tenant.brand_colors as any)?.accent || '#f59e0b',
          logo_url: tenant.logo_url,
          receipt_header_text: `Thank you for choosing ${tenant.hotel_name}`,
          receipt_footer_text: 'We hope to see you again soon!',
          font_style: 'playfair' as const
        },
        documents: {
          default_receipt_template: (tenant.receipt_template as 'A4' | 'thermal_80mm' | 'thermal_58mm' | 'half_page') || 'A4',
          invoice_prefix: 'INV',
          receipt_prefix: 'RCP',
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

      setConfiguration(config);

      // Load audit logs
      const { data: logs, error: logsError } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .eq('resource_type', 'tenant')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      const auditLogs: ConfigurationAuditLog[] = logs.map(log => ({
        id: log.id,
        timestamp: log.created_at || '',
        user_id: log.actor_id || '',
        user_name: log.actor_email || 'Unknown',
        user_role: log.actor_role || 'unknown',
        action: 'update',
        section: 'general',
        field: 'configuration',
        old_value: log.old_values,
        new_value: log.new_values,
        description: log.description || ''
      }));

      setAuditLogs(auditLogs);
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (section: keyof HotelConfiguration, updates: Partial<HotelConfiguration[keyof HotelConfiguration]>) => {
    if (!user?.tenant_id) return false;

    setLoading(true);
    setError(null);

    try {
      const oldConfiguration = { ...configuration };
      let tenantUpdates: any = {};

      // Map configuration sections to tenant fields
      switch (section) {
        case 'general':
          const generalUpdates = updates as Partial<HotelConfiguration['general']>;
          if (generalUpdates.hotel_name) tenantUpdates.hotel_name = generalUpdates.hotel_name;
          if (generalUpdates.address?.city) tenantUpdates.city = generalUpdates.address.city;
          if (generalUpdates.address?.country) tenantUpdates.country = generalUpdates.address.country;
          if (generalUpdates.contact?.phone) tenantUpdates.phone = generalUpdates.contact.phone;
          if (generalUpdates.contact?.email) tenantUpdates.email = generalUpdates.contact.email;
          if (generalUpdates.timezone) tenantUpdates.timezone = generalUpdates.timezone;
          break;
        case 'currency':
          const currencyUpdates = updates as Partial<HotelConfiguration['currency']>;
          if (currencyUpdates.default_currency) tenantUpdates.currency = currencyUpdates.default_currency;
          break;
        case 'branding':
          const brandingUpdates = updates as Partial<HotelConfiguration['branding']>;
          const currentBrandColors = (await supabase
            .from('tenants')
            .select('brand_colors')
            .eq('tenant_id', user.tenant_id)
            .single()).data?.brand_colors as any || {};
          
          tenantUpdates.brand_colors = {
            ...currentBrandColors,
            ...(brandingUpdates.primary_color && { primary: brandingUpdates.primary_color }),
            ...(brandingUpdates.secondary_color && { secondary: brandingUpdates.secondary_color }),
            ...(brandingUpdates.accent_color && { accent: brandingUpdates.accent_color })
          };
          
          if (brandingUpdates.logo_url) tenantUpdates.logo_url = brandingUpdates.logo_url;
          break;
        case 'documents':
          const docUpdates = updates as Partial<HotelConfiguration['documents']>;
          if (docUpdates.default_receipt_template) tenantUpdates.receipt_template = docUpdates.default_receipt_template;
          break;
      }

      // Update tenant record
      const { error: updateError } = await supabase
        .from('tenants')
        .update(tenantUpdates)
        .eq('tenant_id', user.tenant_id);

      if (updateError) throw updateError;

      // Update local configuration
      const newConfiguration = {
        ...configuration,
        [section]: {
          ...configuration[section],
          ...updates
        }
      };
      setConfiguration(newConfiguration);

      // Create audit log entry
      await supabase
        .from('audit_log')
        .insert([{
          action: 'configuration_updated',
          resource_type: 'tenant',
          resource_id: user.tenant_id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Updated ${section} configuration`,
          old_values: oldConfiguration[section],
          new_values: updates
        }]);

      // Reload audit logs
      await loadConfiguration();

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update configuration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    if (!user?.tenant_id) throw new Error('No tenant ID available');

    setLoading(true);
    setError(null);

    try {
      // Upload file to Supabase Storage (using hotel-logos bucket)
      // Use folder structure: tenant_id/filename for RLS policies
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.tenant_id}/logo-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hotel-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hotel-logos')
        .getPublicUrl(fileName);

      // Update tenant record with logo URL
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('tenant_id', user.tenant_id);

      if (updateError) throw updateError;

      // Update local configuration
      setConfiguration(prev => ({
        ...prev,
        branding: {
          ...prev.branding,
          logo_url: publicUrl
        }
      }));

      return publicUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async (section?: keyof HotelConfiguration) => {
    if (!user?.tenant_id) return false;

    setLoading(true);
    setError(null);

    try {
      if (section) {
        await updateConfiguration(section, defaultConfiguration[section]);
      } else {
        // Reset entire configuration
        const tenantUpdates = {
          brand_colors: {},
          logo_url: null,
          receipt_template: 'A4'
        };

        await supabase
          .from('tenants')
          .update(tenantUpdates)
          .eq('tenant_id', user.tenant_id);

        setConfiguration(defaultConfiguration);
        
        // Create audit log for full reset
        await supabase
          .from('audit_log')
          .insert([{
            action: 'configuration_reset',
            resource_type: 'tenant',
            resource_id: user.tenant_id,
            actor_id: user.id,
            actor_email: user.email,
            actor_role: user.role,
            tenant_id: user.tenant_id,
            description: 'Reset all configuration to defaults'
          }]);

        await loadConfiguration();
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to reset configuration');
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