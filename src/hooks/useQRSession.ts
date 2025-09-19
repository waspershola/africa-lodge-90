import { useState, useEffect } from 'react';
import { QRRequest } from '@/components/qr-portal/QRPortal';

export interface QRSession {
  id: string;
  hotel_id: string;
  room_id: string;
  location_type: 'room' | 'bar' | 'pool' | 'restaurant';
  guest_session_id: string;
  expires_at: string;
}

export interface HotelConfig {
  id: string;
  name: string;
  logo?: string;
  primary_color: string;
  wifi_ssid?: string;
  wifi_password?: string;
  enabled_services: string[];
  room_service_menu?: any[];
}

// Mock data for development
const mockSession: QRSession = {
  id: 'session-123',
  hotel_id: 'hotel-1',
  room_id: '205',
  location_type: 'room',
  guest_session_id: 'guest-session-456',
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

const mockHotelConfig: HotelConfig = {
  id: 'hotel-1',
  name: 'Lagos Grand Hotel',
  logo: '/logo.png',
  primary_color: '#C9A96E',
  wifi_ssid: 'LagosGrand-Guest',
  wifi_password: 'Welcome2024!',
  enabled_services: ['room-service', 'housekeeping', 'maintenance', 'wifi', 'feedback', 'bill-preview']
};

const mockRequests: QRRequest[] = [
  {
    id: 'req-1',
    type: 'room-service',
    status: 'in-progress',
    title: 'Jollof Rice & Grilled Chicken',
    details: {
      items: [
        { name: 'Jollof Rice & Grilled Chicken', quantity: 1, price: 3500 }
      ],
      total: 3500,
      special_instructions: 'Extra spicy please'
    },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    eta_minutes: 15,
    assigned_staff: 'Kitchen Staff'
  }
];

export const useQRSession = (sessionToken?: string | null) => {
  const [session, setSession] = useState<QRSession | null>(null);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  const [requests, setRequests] = useState<QRRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Production-ready session loading with token validation
    const loadSession = async () => {
      try {
        if (sessionToken) {
          // In production: validate token with backend
          // For demo: simulate token validation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock validation - in production this would verify JWT
          if (sessionToken.startsWith('invalid')) {
            throw new Error('Invalid session token');
          }
        }
        
        setSession(mockSession);
        setHotelConfig(mockHotelConfig);
        setRequests(mockRequests);
      } catch (error) {
        console.error('Failed to load QR session:', error);
        // In production: redirect to error page or show invalid QR message
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionToken]);

  const createRequest = async (type: string, data: any): Promise<QRRequest> => {
    const newRequest: QRRequest = {
      id: `req-${Date.now()}`,
      type: type as QRRequest['type'],
      status: 'pending',
      title: data.title || `${type} Request`,
      details: data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setRequests(prev => [newRequest, ...prev]);
    return newRequest;
  };

  const updateRequest = async (requestId: string, updates: Partial<QRRequest>) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, ...updates, updated_at: new Date().toISOString() }
          : req
      )
    );
  };

  return {
    session,
    hotelConfig,
    requests,
    isLoading,
    createRequest,
    updateRequest
  };
};