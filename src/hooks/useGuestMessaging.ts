import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GuestMessage {
  id: string;
  qr_request_id: string; // Updated from qr_order_id to support all request types
  sender_type: 'guest' | 'staff';
  sender_id?: string;
  message: string;
  message_type: 'text' | 'menu_suggestion' | 'order_confirmation' | 'order_modification';
  metadata: any;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
}

interface UseGuestMessagingProps {
  qrRequestId: string | null; // Updated from qrOrderId to support all request types
  qrToken: string;
  sessionToken: string;
}

export const useGuestMessaging = ({ qrRequestId, qrToken, sessionToken }: UseGuestMessagingProps) => {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch messages for any request type (not just orders)
  const fetchMessages = useCallback(async () => {
    if (!qrRequestId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guest_messages')
        .select('*')
        .eq('qr_request_id', qrRequestId)
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
  }, [qrRequestId]);

  // Send message for any request type
  const sendMessage = useCallback(async (message: string) => {
    if (!qrRequestId || !message.trim()) return false;
    
    setSending(true);
    try {
      // Get the tenant_id from the qr_request
      const { data: requestData } = await supabase
        .from('qr_requests')
        .select('tenant_id')
        .eq('id', qrRequestId)
        .single();

      if (!requestData) {
        console.error('Could not find request to get tenant_id');
        return false;
      }

      const { error } = await supabase
        .from('guest_messages')
        .insert([{
          qr_request_id: qrRequestId,
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
  }, [qrRequestId, sessionToken, fetchMessages]);

  // Set up real-time subscription for all request types
  useEffect(() => {
    if (!qrRequestId) return;

    console.log('Setting up real-time subscription for request:', qrRequestId);
    
    const channel = supabase
      .channel(`guest_messages_${qrRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guest_messages',
          filter: `qr_request_id=eq.${qrRequestId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as GuestMessage;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guest_messages',
          filter: `qr_request_id=eq.${qrRequestId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = payload.new as GuestMessage;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        }
      )
      .subscribe();

    // Initial fetch
    fetchMessages();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [qrRequestId, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refetch: fetchMessages
  };
};