import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QRRequest } from '@/components/qr-portal/QRPortal';
import { useShortUrl } from './useShortUrl';
import { QRSecurity } from '@/lib/qr-security';

export interface QRSession {
  id: string;
  hotel_id: string;
  room_id: string | null;
  location_type: 'room' | 'bar' | 'pool' | 'restaurant' | 'lobby';
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

export const useQRSession = (sessionToken?: string | null) => {
  const [session, setSession] = useState<QRSession | null>(null);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  const [requests, setRequests] = useState<QRRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { createShortUrl } = useShortUrl();

  // Load session and hotel config from Supabase
  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!sessionToken) {
        // For demo purposes, create a mock session
        const mockSession: QRSession = {
          id: 'session-123',
          hotel_id: 'hotel-1',
          room_id: '205',
          location_type: 'room',
          guest_session_id: 'guest-session-456',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        setSession(mockSession);
        
        // Load hotel config for the session
        await loadHotelConfig(mockSession.hotel_id);
        await loadRequestsForSession(mockSession.guest_session_id);
        return;
      }

      // In production: decode and validate JWT token
      // For now, extract basic info from token (mock implementation)
      const tokenParts = sessionToken.split('-');
      if (tokenParts.length < 3) {
        throw new Error('Invalid session token format');
      }

      // Mock token validation - in production this would verify JWT
      if (sessionToken.startsWith('invalid')) {
        throw new Error('Invalid session token');
      }

      // Extract session info from token (mock)
      const hotelId = tokenParts[1] || 'hotel-1';
      const roomNumber = tokenParts[2] || '205';

      // Look up QR code and session info using secure validation function
      const { data: qrData, error: qrError } = await supabase
        .rpc('validate_qr_token_public', { token_input: sessionToken });

      if (qrError || !qrData || !Array.isArray(qrData) || qrData.length === 0 || !qrData[0].is_valid) {
        throw new Error('QR code not found or expired');
      }

      const validationResult = qrData[0] as {
        is_valid: boolean;
        hotel_name: string;
        location_type: string;
        services: string[];
        tenant_id: string;
        room_id: string;
      };

      // Create session object
      const sessionData: QRSession = {
        id: `session-${sessionToken}`,
        hotel_id: validationResult.tenant_id,
        room_id: validationResult.room_id,
        location_type: validationResult.location_type as 'room' | 'bar' | 'pool' | 'restaurant' | 'lobby',
        guest_session_id: `guest-${Date.now()}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      setSession(sessionData);
      
      // Load hotel config and existing requests
      await loadHotelConfig(validationResult.tenant_id);
      await loadRequestsForSession(sessionData.guest_session_id);

    } catch (error) {
      console.error('Failed to load QR session:', error);
      
      // Fallback to demo data for development
      const mockSession: QRSession = {
        id: 'session-demo',
        hotel_id: 'hotel-1',
        room_id: '205',
        location_type: 'room',
        guest_session_id: 'guest-demo',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      setSession(mockSession);
      await loadHotelConfig('hotel-1');
      await loadRequestsForSession('guest-demo');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Load hotel configuration
  const loadHotelConfig = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          tenant_id,
          hotel_name,
          logo_url,
          brand_colors,
          settings
        `)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;

      const config: HotelConfig = {
        id: data.tenant_id,
        name: data.hotel_name || 'Lagos Grand Hotel',
        logo: data.logo_url,
        primary_color: (data.brand_colors as any)?.primary || '#C9A96E',
        wifi_ssid: (data.settings as any)?.wifi_ssid || 'Hotel-Guest-WiFi',
        wifi_password: (data.settings as any)?.wifi_password || 'Welcome2024!',
        enabled_services: (data.settings as any)?.enabled_services || [
          'room-service', 'housekeeping', 'maintenance', 'wifi', 'feedback', 'bill-preview'
        ],
        room_service_menu: (data.settings as any)?.room_service_menu || []
      };

      setHotelConfig(config);
    } catch (error) {
      console.error('Error loading hotel config:', error);
      // Fallback to demo config
      const mockConfig: HotelConfig = {
        id: tenantId,
        name: 'Lagos Grand Hotel',
        logo: '/logo.png',
        primary_color: '#C9A96E',
        wifi_ssid: 'LagosGrand-Guest',
        wifi_password: 'Welcome2024!',
        enabled_services: ['room-service', 'housekeeping', 'maintenance', 'wifi', 'feedback', 'bill-preview']
      };
      setHotelConfig(mockConfig);
    }
  };

  // Load existing requests for this session
  const loadRequestsForSession = async (guestSessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('qr_requests')
        .select('*')
        .eq('session_id', guestSessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: QRRequest[] = (data || []).map(order => ({
        id: order.id,
        type: order.request_type as QRRequest['type'],
        status: order.status as QRRequest['status'],
        title: `${order.request_type} Request`,
        details: order.request_data,
        created_at: order.created_at || '',
        updated_at: order.updated_at || '',
        eta_minutes: (order.request_data as any)?.eta_minutes,
        assigned_staff: (order.request_data as any)?.assigned_staff
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      // Set empty array on error
      setRequests([]);
    }
  };

  // Create new request
  const createRequest = async (type: string, data: any): Promise<QRRequest> => {
    if (!session) throw new Error('No active session');

    try {
      const { data: orderData, error } = await supabase
        .from('qr_requests')
        .insert([{
          tenant_id: session.hotel_id,
          qr_code_id: session.id,
          session_id: session.guest_session_id,
          request_type: type,
          status: 'pending',
          request_data: data,
          priority: data.priority || 'medium',
          notes: data.special_instructions || data.notes
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate short URL for session resume link
      try {
        const resumeUrl = `${QRSecurity.generateQRUrl(sessionToken || session.id)}?request=${orderData.id}`;
        
        const { short_url } = await createShortUrl({
          url: resumeUrl,
          tenantId: session.hotel_id,
          sessionToken: sessionToken || session.id,
          linkType: 'session_resume'
        });

        // Update the request with the short URL
        await supabase
          .from('qr_requests')
          .update({ resume_short_url: short_url })
          .eq('id', orderData.id);

        console.log('Short URL created:', short_url);
      } catch (shortUrlError) {
        console.error('Failed to create short URL:', shortUrlError);
        // Continue without short URL - not critical
      }

      const newRequest: QRRequest = {
        id: orderData.id,
        type: type as QRRequest['type'],
        status: 'pending',
        title: data.title || `${type} Request`,
        details: data,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at
      };

      setRequests(prev => [newRequest, ...prev]);
      return newRequest;
    } catch (error) {
      console.error('Error creating request:', error);
      
      // Fallback to local state for demo
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
    }
  };

  // Update request status
  const updateRequest = async (requestId: string, updates: Partial<QRRequest>) => {
    try {
      const { error } = await supabase
        .from('qr_requests')
        .update({
          status: updates.status,
          request_data: updates.details,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, ...updates, updated_at: new Date().toISOString() }
            : req
        )
      );
    } catch (error) {
      console.error('Error updating request:', error);
      
      // Fallback to local state update
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, ...updates, updated_at: new Date().toISOString() }
            : req
        )
      );
    }
  };

  // Subscribe to real-time updates for this session
  const subscribeToUpdates = useCallback(() => {
    if (!session) return () => {};

    const channel = supabase
      .channel(`qr_session_${session.guest_session_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qr_requests',
          filter: `session_id=eq.${session.guest_session_id}`
        },
        (payload) => {
          console.log('QR Order update:', payload);
          loadRequestsForSession(session.guest_session_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Load session on mount and token change
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Subscribe to updates when session is available
  useEffect(() => {
    if (session) {
      const unsubscribe = subscribeToUpdates();
      return unsubscribe;
    }
  }, [session, subscribeToUpdates]);

  return {
    session,
    hotelConfig,
    requests,
    isLoading,
    createRequest,
    updateRequest,
    refreshSession: loadSession
  };
};