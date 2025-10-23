import { Clock, CheckCircle2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: string;
  sender: 'guest' | 'staff';
  timestamp: string;
  isRead?: boolean;
  senderName?: string;
  attachment?: {
    url: string;
    type: string;
  };
}

export function ChatBubble({
  message,
  sender,
  timestamp,
  isRead,
  senderName,
  attachment
}: ChatBubbleProps) {
  const isGuest = sender === 'guest';

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={cn(
        'flex animate-fade-in',
        isGuest ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl p-3 shadow-sm',
          isGuest
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted border border-border'
        )}
      >
        {/* Sender info */}
        <div className="flex items-center gap-2 mb-1">
          {!isGuest && <CheckCircle2 className="h-3 w-3 text-primary" />}
          {isGuest && <User className="h-3 w-3 opacity-70" />}
          <span className="text-xs font-medium opacity-70">
            {senderName || (isGuest ? 'You' : 'Staff')}
          </span>
        </div>

        {/* Message content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>

        {/* Attachment */}
        {attachment && (
          <div className="mt-2">
            {attachment.type.startsWith('image/') ? (
              <img
                src={attachment.url}
                alt="Attachment"
                className="max-w-full rounded-lg"
              />
            ) : (
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                View attachment
              </a>
            )}
          </div>
        )}

        {/* Timestamp and read status */}
        <div className="flex items-center gap-1 mt-2">
          <Clock className="h-3 w-3 opacity-50" />
          <span className="text-xs opacity-50">{formatTime(timestamp)}</span>
          {isGuest && isRead && (
            <CheckCircle2 className="h-3 w-3 ml-1 opacity-50" />
          )}
        </div>
      </div>
    </div>
  );
}
