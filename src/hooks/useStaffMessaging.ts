import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffMessage {
  id: string;
  qr_request_id: string;
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

interface UseStaffMessagingProps {
  qrRequestId: string | null;
  tenantId: string;
}

export const useStaffMessaging = ({ qrRequestId, tenantId }: UseStaffMessagingProps) => {
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Fetch messages for staff view
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
        toast({
          title: "Error loading messages",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setMessages((data as StaffMessage[]) || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [qrRequestId, toast]);

  // Send message from staff
  const sendMessage = useCallback(async (
    message: string,
    messageType: 'text' | 'menu_suggestion' | 'order_confirmation' = 'text',
    metadata: any = {}
  ) => {
    if (!qrRequestId || !message.trim()) return false;
    
    setSending(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('guest_messages')
        .insert([{
          qr_request_id: qrRequestId,
          sender_type: 'staff' as const,
          sender_id: user.id,
          message: message,
          message_type: messageType,
          metadata: metadata,
          tenant_id: tenantId
        }]);

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Refresh messages to get the new one
      await fetchMessages();
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the guest",
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [qrRequestId, tenantId, fetchMessages, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('guest_messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('sender_type', 'guest'); // Only mark guest messages as read

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!qrRequestId) return;

    console.log('Setting up staff real-time subscription for request:', qrRequestId);
    
    const channel = supabase
      .channel(`staff_messages_${qrRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guest_messages',
          filter: `qr_request_id=eq.${qrRequestId}`
        },
        (payload) => {
          console.log('New message received (staff view):', payload);
          const newMessage = payload.new as StaffMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Initial fetch
    fetchMessages();

    return () => {
      console.log('Cleaning up staff real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [qrRequestId, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refetch: fetchMessages
  };
};
