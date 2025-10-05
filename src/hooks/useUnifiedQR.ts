import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QRSession {
  sessionId: string;
  tenantId: string;
  qrCodeId: string;
  hotelName: string;
  roomNumber: string;
  services: string[];
  expiresAt: string;
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

      return response.data as { success: boolean; session: QRSession };
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
      priority = 'normal'
    }: {
      sessionId: string;
      requestType: string;
      requestData: Record<string, any>;
      priority?: string;
    }) => {
      const response = await supabase.functions.invoke('qr-unified-api/request', {
        body: { sessionId, requestType, requestData, priority }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data as { success: boolean; request: QRRequest };
    },
    onSuccess: (_, variables) => {
      // Invalidate requests for this session
      queryClient.invalidateQueries({ queryKey: ['qr-requests', variables.sessionId] });
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
      refetchInterval: 5000, // Poll every 5 seconds
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
      refetchInterval: 10000, // Poll every 10 seconds
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

  return {
    // Guest operations
    validateQR,
    createRequest,
    useRequestStatus,
    useSessionRequests,
    
    // Staff/Owner operations
    useAllQRRequests,
    updateRequestStatus,
    useQRAnalytics,
  };
}