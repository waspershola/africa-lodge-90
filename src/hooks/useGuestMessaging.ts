import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GuestMessage {
  id: string;
  qr_order_id: string;
  sender_type: 'guest' | 'staff';
  sender_id?: string;
  message: string;
  message_type: 'text' | 'menu_suggestion' | 'order_confirmation' | 'order_modification';
  metadata: any;
  is_read: boolean;
  created_at: string;
}

interface UseGuestMessagingProps {
  qrOrderId: string | null;
  qrToken: string;
  sessionToken: string;
}

export const useGuestMessaging = ({ qrOrderId, qrToken, sessionToken }: UseGuestMessagingProps) => {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch messages - UPDATED to query database directly
  const fetchMessages = useCallback(async () => {
    if (!qrOrderId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guest_messages')
        .select('*')
        .eq('qr_order_id', qrOrderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages((data as any[]) || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [qrOrderId]);

  // Send message - UPDATED to insert directly to database with tenant_id lookup
  const sendMessage = useCallback(async (message: string) => {
    if (!qrOrderId || !message.trim()) return false;
    
    setSending(true);
    try {
      // First, get the tenant_id from the qr_request
      const { data: requestData } = await supabase
        .from('qr_requests')
        .select('tenant_id')
        .eq('id', qrOrderId)
        .single();

      if (!requestData) {
        console.error('Could not find request to get tenant_id');
        return false;
      }

      const { error } = await supabase
        .from('guest_messages')
        .insert([{
          qr_order_id: qrOrderId,
          sender_type: 'guest' as const,
          message: message,
          message_type: 'text' as const,
          metadata: { session_token: sessionToken },
          tenant_id: requestData.tenant_id
        }]);

      if (error) {
        console.error('Error sending message:', error);
        return false;
      }

      // Refresh messages to get the new one
      await fetchMessages();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [qrOrderId, sessionToken, fetchMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!qrOrderId) return;

    console.log('Setting up real-time subscription for order:', qrOrderId);
    
    const channel = supabase
      .channel(`guest_messages_${qrOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guest_messages',
          filter: `qr_order_id=eq.${qrOrderId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as GuestMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Initial fetch
    fetchMessages();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [qrOrderId, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refetch: fetchMessages
  };
};