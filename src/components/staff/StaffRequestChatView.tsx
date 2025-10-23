import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStaffMessaging } from '@/hooks/useStaffMessaging';
import { ChatBubble } from '@/components/messaging/ChatBubble';
import { QuickReplyBar } from '@/components/messaging/QuickReplyBar';
import { formatRequestMessage, formatRelativeTime, getStatusColor } from '@/lib/messageFormatter';

interface StaffRequestChatViewProps {
  request: {
    id: string;
    request_type: string;
    request_data: any;
    status: string;
    priority?: string;
    created_at: string;
    room?: { room_number: string };
    formatted_summary?: string;
    guest_name?: string;
  };
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StaffRequestChatView({ 
  request, 
  tenantId,
  isOpen, 
  onClose 
}: StaffRequestChatViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading, sending, sendMessage, markAsRead } = useStaffMessaging({
    qrRequestId: request.id,
    tenantId
  });

  const formatted = formatRequestMessage(request);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark guest messages as read when opened
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const unreadGuestMessages = messages
        .filter(m => m.sender_type === 'guest' && !m.is_read)
        .map(m => m.id);
      
      if (unreadGuestMessages.length > 0) {
        markAsRead(unreadGuestMessages);
      }
    }
  }, [isOpen, messages, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const success = await sendMessage(messageInput);
    if (success) {
      setMessageInput('');
    }
  };

  const handleQuickReply = (templateText: string) => {
    setMessageInput(templateText);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <span className="text-2xl">{formatted.emoji}</span>
                {formatted.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {request.guest_name || 'Guest'} • Room {request.room?.room_number || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(request.created_at)}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`bg-${getStatusColor(request.status)}-100 text-${getStatusColor(request.status)}-700`}
            >
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </SheetHeader>

        {/* Request Details */}
        <div className="px-6 py-4 border-b bg-muted/30">
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
            <div className="mt-3 p-2 bg-background rounded text-xs">
              <p className="text-muted-foreground">{formatted.notes}</p>
            </div>
          )}
        </div>

        {/* Quick Reply Bar */}
        <QuickReplyBar
          requestType={request.request_type}
          onSelectTemplate={handleQuickReply}
          tenantId={tenantId}
        />

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef}>
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
                  <Send className="h-6 w-6" />
                </div>
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start a conversation with the guest</p>
              </div>
            )}

            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message.message}
                sender={message.sender_type}
                timestamp={message.created_at}
                isRead={message.is_read}
                senderName={message.sender_type === 'staff' ? 'Staff' : request.guest_name || 'Guest'}
                attachment={
                  message.attachment_url
                    ? {
                        url: message.attachment_url,
                        type: message.attachment_type || 'unknown'
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message to the guest..."
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
      </SheetContent>
    </Sheet>
  );
}
