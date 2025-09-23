import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Remove ScrollArea import as it's not available
import { useGuestMessaging } from '@/hooks/useGuestMessaging';

interface ChatInterfaceProps {
  qrOrderId: string;
  qrToken: string;
  sessionToken: string;
  orderStatus?: string;
}

export default function ChatInterface({ qrOrderId, qrToken, sessionToken, orderStatus }: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sending, sendMessage } = useGuestMessaging({ 
    qrOrderId, 
    qrToken, 
    sessionToken 
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const success = await sendMessage(messageInput);
    if (success) {
      setMessageInput('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'order_confirmation':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'menu_suggestion':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with Kitchen Staff
          {orderStatus && (
            <Badge variant={orderStatus === 'completed' ? 'default' : 'secondary'}>
              {orderStatus}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 px-6 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-3 pb-4">
            {loading && messages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Loading messages...
              </div>
            )}
            
            {messages.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-4">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Your order has been received!</p>
                <p className="text-sm">Kitchen staff will message you with updates.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'guest' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender_type === 'guest'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getMessageTypeIcon(message.message_type)}
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
                  
                  {/* Show menu suggestions or modifications */}
                  {message.message_type === 'menu_suggestion' && message.metadata?.suggested_items && (
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

        {/* Message input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!messageInput.trim() || sending}
              size="sm"
            >
              {sending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}