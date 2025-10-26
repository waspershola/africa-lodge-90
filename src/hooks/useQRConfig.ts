// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QRConfig {
  id: string;
  hotel_id: string;
  location_id: string;
  location_type: 'room' | 'bar' | 'pool' | 'restaurant' | 'lobby';
  enabled_services: string[];
  branding: {
    primary_color: string;
    logo_url?: string;
    welcome_message?: string;
  };
  expires_at?: string;
  max_concurrent_requests?: number;
}

// Production-ready QR configuration management
export const useQRConfig = (sessionToken?: string) => {
  const [config, setConfig] = useState<QRConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      if (!sessionToken) {
        setError('Invalid session token');
        setIsLoading(false);
        return;
      }

      try {
        // Extract tenant and room info from QR token
        const tokenData = JSON.parse(atob(sessionToken));
        const { tenant_id, room_id } = tokenData;
        
        if (!tenant_id || !room_id) {
          throw new Error('Invalid QR token structure');
        }

        // Fetch tenant configuration from Supabase
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('hotel_name, logo_url, brand_colors, settings')
          .eq('tenant_id', tenant_id)
          .single();

        if (tenantError) throw tenantError;

        // Fetch QR code configuration for this room
        const { data: qrCode, error: qrError } = await supabase
          .from('qr_codes')
          .select('services, template_id')
          .eq('tenant_id', tenant_id)
          .eq('room_id', room_id)
          .single();

        if (qrError) throw qrError;

        // Build tenant-specific QR config
        const brandColors = (tenant.brand_colors as any) || {};
        const tenantConfig: QRConfig = {
          id: `qr-${tenant_id}-${room_id}`,
          hotel_id: tenant_id,
          location_id: room_id,
          location_type: 'room',
          enabled_services: qrCode.services || ['room-service', 'housekeeping', 'maintenance', 'wifi'],
          branding: {
            primary_color: brandColors.primary || '#2563eb',
            logo_url: tenant.logo_url || undefined,
            welcome_message: `Welcome to ${tenant.hotel_name}`
          },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          max_concurrent_requests: 5
        };

        setConfig(tenantConfig);
      } catch (err) {
        setError('Failed to load QR configuration');
        console.error('QR config error:', err);
        // Set a basic fallback config to prevent total failure
        setConfig({
          id: 'fallback',
          hotel_id: 'unknown',
          location_id: 'unknown',
          location_type: 'room',
          enabled_services: ['wifi'],
          branding: {
            primary_color: '#2563eb',
            welcome_message: 'Welcome!'
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [sessionToken]);

  const validateService = (serviceId: string) => {
    return config?.enabled_services.includes(serviceId) ?? false;
  };

  const getServiceConfig = (serviceId: string) => {
    // Service-specific configuration
    const serviceConfigs = {
      'room-service': {
        menu_available: true,
        delivery_fee: 0,
        min_order_amount: 0,
        max_prep_time: 60
      },
      'housekeeping': {
        same_day_service: true,
        priority_levels: ['low', 'medium', 'high'],
        available_times: ['morning', 'afternoon', 'evening']
      },
      'maintenance': {
        emergency_contact: true,
        photo_upload: true,
        priority_escalation: true
      },
      'wifi': {
        auto_connect: false,
        speed_limit: null,
        data_limit: null
      }
    };

    return serviceConfigs[serviceId as keyof typeof serviceConfigs];
  };

  return {
    config,
    isLoading,
    error,
    validateService,
    getServiceConfig
  };
};