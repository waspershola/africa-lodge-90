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

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!qrOrderId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/messages?qr_order_id=${qrOrderId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [qrOrderId]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!qrOrderId || !message.trim()) return false;
    
    setSending(true);
    try {
      const response = await fetch(
        `https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qr_order_id: qrOrderId,
            message: message,
            guest_session_id: sessionToken
          })
        }
      );

      if (response.ok) {
        // Refresh messages to get the new one
        await fetchMessages();
        return true;
      }
      return false;
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