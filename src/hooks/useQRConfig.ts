import { useState, useEffect } from 'react';

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
        // In production, this would validate the JWT token and fetch from Supabase
        // For now, using mock data but with production-ready structure
        
        // Simulate token validation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock config - in production this comes from database
        const mockConfig: QRConfig = {
          id: 'qr-config-123',
          hotel_id: 'hotel-1',
          location_id: '205',
          location_type: 'room',
          enabled_services: [
            'room-service',
            'housekeeping', 
            'maintenance',
            'wifi',
            'feedback',
            'bill-preview'
          ],
          branding: {
            primary_color: '#C9A96E',
            logo_url: '/logo.png',
            welcome_message: 'Welcome to Lagos Grand Hotel'
          },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          max_concurrent_requests: 5
        };

        setConfig(mockConfig);
      } catch (err) {
        setError('Failed to load QR configuration');
        console.error('QR config error:', err);
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
    // In production, this would return service-specific configuration
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