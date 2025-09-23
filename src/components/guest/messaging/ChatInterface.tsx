import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Clock, CheckCircle2, Crown, Sparkles, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        return <ChefHat className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm animate-scale-in">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200/50">
        <CardTitle className="flex items-center gap-3 text-amber-900">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif">Kitchen Communication</h3>
              {orderStatus && (
                <Badge 
                  variant={orderStatus === 'completed' ? 'default' : 'secondary'}
                  className={orderStatus === 'completed' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                  }
                >
                  {orderStatus}
                </Badge>
              )}
            </div>
            <p className="text-sm text-amber-700/70 font-normal">Live chat with our culinary team</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col p-0" style={{ height: '400px' }}>
        <div className="flex-1 px-6 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-4 py-6">
            {loading && messages.length === 0 && (
              <div className="text-center text-amber-700/70 py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-amber-600 animate-pulse" />
                </div>
                <p>Loading conversation...</p>
              </div>
            )}
            
            {messages.length === 0 && !loading && (
              <div className="text-center text-amber-700/70 py-8 space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto">
                  <ChefHat className="h-8 w-8 text-amber-600" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <p className="font-serif text-lg text-amber-900">Order Received!</p>
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-sm text-amber-700/70">Our executive chef will message you with updates and any suggestions.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex animate-fade-in ${message.sender_type === 'guest' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                    message.sender_type === 'guest'
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                      : 'bg-white border border-amber-200/50 text-amber-900 shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getMessageTypeIcon(message.message_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {message.sender_type === 'staff' && (
                          <Crown className="h-4 w-4 text-amber-600" />
                        )}
                        <span className={`text-xs font-medium ${
                          message.sender_type === 'guest' ? 'text-amber-100' : 'text-amber-600'
                        }`}>
                          {message.sender_type === 'staff' ? 'Kitchen Staff' : 'You'}
                        </span>
                      </div>
                      <p className="leading-relaxed">{message.message}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="h-3 w-3 opacity-60" />
                        <span className="text-xs opacity-60">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show menu suggestions */}
                  {message.message_type === 'menu_suggestion' && message.metadata?.suggested_items && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <ChefHat className="h-4 w-4" />
                        <p className="font-medium text-sm">Chef's Recommendations:</p>
                      </div>
                      {message.metadata.suggested_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-1">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-sm font-bold">₦{item.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-amber-200/50 bg-gradient-to-r from-amber-50 to-amber-100 p-6">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message to the kitchen..."
                disabled={sending}
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 bg-white/70 backdrop-blur-sm pr-12 py-3 text-amber-900 placeholder:text-amber-600/50 rounded-full"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!messageInput.trim() || sending}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full px-6"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-amber-600/60 mt-2 text-center">
            Our culinary team is standing by to assist with your order
          </p>
        </div>
      </CardContent>
    </Card>
  );
}