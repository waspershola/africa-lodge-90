import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface StaffOrderChatProps {
  orderId: string;
  orderDetails?: any;
  onStatusChange?: (status: string) => void;
}

interface Message {
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

export default function StaffOrderChat({ orderId, orderDetails, onStatusChange }: StaffOrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('guest_messages')
        .select('*')
        .eq('qr_request_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((messagesData || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (messageType: 'text' | 'menu_suggestion' = 'text') => {
    if (!messageInput.trim() && messageType === 'text') return;
    
    setSending(true);
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      const messageData = {
        tenant_id: orderDetails?.tenant_id,
        qr_request_id: orderId,
        sender_type: 'staff' as const,
        sender_id: user?.id,
        message: messageInput || 'Menu suggestion sent',
        message_type: messageType,
        metadata: messageType === 'menu_suggestion' ? { suggested_items: suggestedItems } : {}
      };

      const { error } = await supabase
        .from('guest_messages')
        .insert([messageData]);

      if (error) throw error;

      setMessageInput('');
      setSuggestedItems([]);
      setShowSuggestions(false);
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`staff_messages_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guest_messages',
          filter: `qr_request_id=eq.${orderId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeIcon = (type: string, senderType: string) => {
    if (senderType === 'guest') {
      return <User className="h-4 w-4 text-blue-600" />;
    }
    
    switch (type) {
      case 'menu_suggestion':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'order_confirmation':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const addSuggestedItem = () => {
    setSuggestedItems([...suggestedItems, { name: '', price: '' }]);
  };

  const updateSuggestedItem = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...suggestedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSuggestedItems(updated);
  };

  const removeSuggestedItem = (index: number) => {
    setSuggestedItems(suggestedItems.filter((_, i) => i !== index));
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Guest Communication
          <Badge variant="secondary">Kitchen Staff</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 px-6 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-3 pb-4">
            {loading && (
              <div className="text-center text-muted-foreground py-4">
                Loading messages...
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'staff' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender_type === 'staff'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getMessageTypeIcon(message.message_type, message.sender_type)}
                    <div className="flex-1">
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 opacity-60" />
                        <span className="text-xs opacity-60">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show suggested items */}
                  {message.message_type === 'menu_suggestion' && message.metadata?.suggested_items?.length > 0 && (
                    <div className="mt-2 p-2 bg-background/10 rounded text-xs">
                      <p className="font-medium mb-1">Suggested alternatives:</p>
                      {message.metadata.suggested_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.name}</span>
                          <span>₦{item.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestion builder */}
        {showSuggestions && (
          <div className="border-t border-b p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Menu Suggestions</h4>
                <Button size="sm" variant="outline" onClick={addSuggestedItem}>
                  Add Item
                </Button>
              </div>
              
              {suggestedItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateSuggestedItem(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    value={item.price}
                    onChange={(e) => updateSuggestedItem(index, 'price', e.target.value)}
                    className="w-24"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeSuggestedItem(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="border-t p-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showSuggestions ? "default" : "outline"}
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                Menu Suggestions
              </Button>
              {showSuggestions && suggestedItems.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => sendMessage('menu_suggestion')}
                  disabled={sending}
                >
                  Send Suggestions
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message to the guest..."
                disabled={sending}
                className="flex-1 min-h-[60px]"
                rows={2}
              />
              <Button 
                onClick={() => sendMessage('text')} 
                disabled={!messageInput.trim() || sending}
                size="sm"
                className="self-end"
              >
                {sending ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}