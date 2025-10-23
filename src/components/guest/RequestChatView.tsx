import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGuestMessaging } from '@/hooks/useGuestMessaging';
import { formatRequestMessage, formatRelativeTime, getStatusColor } from '@/lib/messageFormatter';

interface RequestChatViewProps {
  request: {
    id: string;
    request_type: string;
    request_data: any;
    status: string;
    created_at: string;
    room?: { room_number: string };
    formatted_summary?: string;
  };
  qrToken: string;
  sessionToken: string;
  onClose?: () => void;
}

export function RequestChatView({ request, qrToken, sessionToken }: RequestChatViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sending, sendMessage } = useGuestMessaging({
    qrRequestId: request.id,
    qrToken,
    sessionToken
  });

  const formatted = formatRequestMessage(request);

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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Request Summary Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{formatted.emoji}</div>
              <div>
                <CardTitle className="text-base">{formatted.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(request.created_at)}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-700`}
            >
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {formatted.items.length > 0 && (
            <div className="space-y-1 text-sm">
              {formatted.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item.replace(/\*\*/g, '')}</span>
                </div>
              ))}
            </div>
          )}
          {formatted.notes && (
            <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
              <p className="text-muted-foreground">{formatted.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4" ref={scrollRef}>
        <div className="space-y-4">
          {loading && messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading messages...</p>
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="text-center text-muted-foreground py-8 space-y-2">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <User className="h-6 w-6" />
              </div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Our staff will respond to your request shortly</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-fade-in ${
                message.sender_type === 'guest' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                  message.sender_type === 'guest'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender_type === 'staff' && (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  )}
                  <span className="text-xs font-medium opacity-70">
                    {message.sender_type === 'staff' ? 'Staff' : 'You'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{message.message}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3 opacity-50" />
                  <span className="text-xs opacity-50">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t pt-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || request.status === 'completed'}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!messageInput.trim() || sending || request.status === 'completed'}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        {request.status === 'completed' && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            This request has been completed
          </p>
        )}
      </div>
    </div>
  );
}
