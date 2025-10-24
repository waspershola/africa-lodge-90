import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get unread message count for staff viewing a specific request
 */
export const useUnreadMessagesForRequest = (qrRequestId: string | null) => {
  return useQuery({
    queryKey: ['unread-messages-request', qrRequestId],
    queryFn: async () => {
      if (!qrRequestId) return 0;

      const { count } = await supabase
        .from('guest_messages')
        .select('*', { count: 'exact', head: true })
        .eq('qr_request_id', qrRequestId)
        .eq('sender_type', 'guest')
        .eq('is_read', false);

      return count || 0;
    },
    enabled: !!qrRequestId,
    // Phase 3: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
};

/**
 * Hook to get unread message counts for multiple requests (staff dashboard)
 */
export const useUnreadMessagesForRequests = (requestIds: string[]) => {
  return useQuery({
    queryKey: ['unread-messages-multiple', requestIds],
    queryFn: async () => {
      if (requestIds.length === 0) return {};

      const { data, error } = await supabase
        .from('guest_messages')
        .select('qr_request_id')
        .in('qr_request_id', requestIds)
        .eq('sender_type', 'guest')
        .eq('is_read', false);

      if (error) throw error;

      // Count messages per request
      const counts: Record<string, number> = {};
      (data || []).forEach((msg) => {
        counts[msg.qr_request_id] = (counts[msg.qr_request_id] || 0) + 1;
      });

      return counts;
    },
    enabled: requestIds.length > 0,
    // Phase 3: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
};
