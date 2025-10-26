import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JWTClient } from '@/lib/jwt-client';

interface QRSession {
  sessionId: string;
  tenantId: string;
  qrCodeId: string;
  hotelName: string;
  roomNumber: string;
  services: string[];
  expiresAt: string;
  token?: string; // JWT token
}

interface QRRequest {
  requestId: string;
  trackingNumber: string;
  createdAt: string;
}

interface RequestStatus {
  id: string;
  status: string;
  priority: string;
  request_type: string;
  request_data: Record<string, any>;
  created_at: string;
  completed_at?: string;
  notes?: string;
}

const QR_UNIFIED_API_URL = `https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-unified-api`;

/**
 * Master hook for all QR operations
 * Replaces: useQRSession, useGuestSession, useQRData
 */
export function useUnifiedQR() {
  const queryClient = useQueryClient();

  /**
   * Validate QR token and create guest session
   */
  const validateQR = useMutation({
    mutationFn: async ({ qrToken, deviceInfo = {} }: { qrToken: string; deviceInfo?: Record<string, any> }) => {
      const response = await supabase.functions.invoke('qr-unified-api/validate', {
        body: { qrToken, deviceInfo }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as { success: boolean; session: QRSession; token: string };
      
      // Store JWT token securely
      if (result.token) {
        JWTClient.storeToken(result.token, result.session);
      }

      return result;
    },
    onSuccess: (data) => {
      // Cache session data
      queryClient.setQueryData(['qr-session', data.session.sessionId], data.session);
    }
  });

  /**
   * Create a new service request
   */
  const createRequest = useMutation({
    mutationFn: async ({
      sessionId,
      requestType,
      requestData,
      priority = 'normal',
      smsEnabled = false,
      guestPhone,
      guestName
    }: {
      sessionId: string;
      requestType: string;
      requestData: Record<string, any>;
      priority?: string;
      smsEnabled?: boolean;
      guestPhone?: string;
      guestName?: string;
    }) => {
      console.log('[⏱️ Request] Starting creation...', { requestType });
      const startTime = performance.now();
      
      // Get JWT token
      const token = JWTClient.getToken();
      
      // Check if token is valid
      if (token && !JWTClient.isTokenValid(token)) {
        JWTClient.clearToken();
        throw new Error('Session expired. Please scan QR code again.');
      }

      // Add 10-second timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      );
      
      const requestPromise = supabase.functions.invoke('qr-unified-api/request', {
        body: { sessionId, requestType, requestData, priority, smsEnabled, guestPhone, guestName },
        headers: token ? { 'x-session-token': token } : {}
      });

      const response = await Promise.race([requestPromise, timeoutPromise]);

      const duration = performance.now() - startTime;
      console.log(`[⏱️ Request] Completed in ${duration.toFixed(0)}ms`);

      if (response.error) {
        console.error('[❌ Request] Failed:', response.error);
        throw new Error(response.error.message);
      }

      return response.data as { success: boolean; request: QRRequest };
    },
    onSuccess: (_, variables) => {
      // Invalidate requests for this session
      queryClient.invalidateQueries({ queryKey: ['qr-requests', variables.sessionId] });
    },
    onError: (error) => {
      console.error('[❌ Request] Submission failed:', error);
      // Error message will be shown by the component
    }
  });

  /**
   * Get request status by ID
   */
  const useRequestStatus = (requestId: string | null) => {
    return useQuery({
      queryKey: ['qr-request', requestId],
      queryFn: async () => {
        if (!requestId) return null;

        const response = await supabase.functions.invoke(`qr-unified-api/request/${requestId}`, {
          method: 'GET'
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.data.request as RequestStatus;
      },
      enabled: !!requestId,
      // ✅ PHASE 4: Conservative polling for active request tracking (safety net)
      refetchInterval: (query) => {
        // Only poll if request is not completed/cancelled
        const data = query.state.data;
        if (!data || data.status === 'completed' || data.status === 'cancelled') {
          return false;
        }
        return 30000; // Poll every 30 seconds for active requests
      },
      refetchIntervalInBackground: false,
    });
  };

  /**
   * Get all requests for a session
   */
  const useSessionRequests = (sessionId: string | null) => {
    return useQuery({
      queryKey: ['qr-requests', sessionId],
      queryFn: async () => {
        if (!sessionId) return [];

        const response = await supabase.functions.invoke(`qr-unified-api/session/${sessionId}/requests`, {
          method: 'GET'
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.data.requests as RequestStatus[];
      },
      enabled: !!sessionId,
      // ✅ PHASE 4: Conservative polling as safety net (only if real-time fails)
      refetchInterval: 60000, // Poll every 60 seconds as backup
      refetchIntervalInBackground: false, // Don't poll when tab is hidden
    });
  };

  /**
   * Get analytics for a QR code
   */
  const useQRAnalytics = (qrCodeId: string | null) => {
    return useQuery({
      queryKey: ['qr-analytics', qrCodeId],
      queryFn: async () => {
        if (!qrCodeId) return [];

        const response = await supabase.functions.invoke(`qr-unified-api/analytics/qr/${qrCodeId}`, {
          method: 'GET'
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.data.scans;
      },
      enabled: !!qrCodeId,
    });
  };

  /**
   * Direct database query for staff/owner use
   * Get all QR requests for a tenant
   */
  const useAllQRRequests = (tenantId: string | null) => {
    return useQuery({
      queryKey: ['all-qr-requests', tenantId],
      queryFn: async () => {
        if (!tenantId) return [];

        const { data, error } = await supabase
          .from('qr_requests')
          .select(`
            *,
            rooms (room_number),
            users (name, email)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: !!tenantId,
    });
  };

  /**
   * Update request status (staff only)
   */
  const updateRequestStatus = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes
    }: {
      requestId: string;
      status: string;
      notes?: string;
    }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (notes) updates.notes = notes;
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('qr_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-request', data.id] });
      queryClient.invalidateQueries({ queryKey: ['all-qr-requests'] });
      queryClient.invalidateQueries({ queryKey: ['qr-requests', data.session_id] });
    }
  });

  /**
   * Clear session and JWT token
   */
  const clearSession = () => {
    JWTClient.clearToken();
    queryClient.clear();
  };

  /**
   * Check if current session is valid
   */
  const isSessionValid = (): boolean => {
    const token = JWTClient.getToken();
    return token ? JWTClient.isTokenValid(token) : false;
  };

  /**
   * Get current session data
   */
  const getCurrentSession = (): any | null => {
    return JWTClient.getSessionData();
  };

  return {
    // Guest operations
    validateQR,
    createRequest,
    useRequestStatus,
    useSessionRequests,
    clearSession,
    isSessionValid,
    getCurrentSession,
    
    // Staff/Owner operations
    useAllQRRequests,
    updateRequestStatus,
    useQRAnalytics,
  };
}