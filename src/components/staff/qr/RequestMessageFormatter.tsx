import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Star, ShoppingCart, Wrench, Home } from 'lucide-react';
import { formatRequestMessage, type QRRequest } from '@/lib/messageFormatter';

interface RequestMessageFormatterProps {
  request: {
    id: string;
    request_type: string;
    request_data: any;
    room_id: string | null;
    rooms?: { room_number: string };
    session_id: string;
    created_at: string;
    notes?: string | null;
  };
  guestSession?: {
    guest_phone?: string;
    guest_email?: string;
    qr_code_label?: string;
  };
}

export function RequestMessageFormatter({ request, guestSession }: RequestMessageFormatterProps) {
  const isLocationRequest = !request.room_id;
  
  // Use the new message formatter utility for clean formatting
  const formattedMessage = formatRequestMessage(request as any);
  
  // Format location/room info
  const locationInfo = isLocationRequest
    ? guestSession?.qr_code_label || 'Common Area'
    : `Room ${request.rooms?.room_number || 'Unknown'}`;

  // Format guest identifier
  const guestIdentifier = guestSession?.guest_phone 
    ? `Guest (${guestSession.guest_phone})`
    : guestSession?.guest_email
    ? `Guest (${guestSession.guest_email})`
    : 'Anonymous Guest';

  // Format request content based on type (keeping legacy for backwards compatibility)
  const formatRequestContent = () => {
    const data = request.request_data || {};

    switch (request.request_type.toUpperCase()) {
      case 'FEEDBACK':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
              <span className="font-medium">{data.rating || 0}/5 Stars</span>
            </div>
            {data.comment && (
              <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">
                "{data.comment}"
              </p>
            )}
          </div>
        );

      case 'ROOM_SERVICE':
      case 'DIGITAL_MENU':
        const orderDetails = data.order_details || {};
        const items = orderDetails.items || [];
        const total = orderDetails.total_amount || data.total_amount || 0;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="font-medium">Order: {items.length} item(s)</span>
            </div>
            <div className="space-y-1 pl-6 bg-muted/50 p-2 rounded">
              {items.slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="text-sm flex justify-between gap-2">
                  <span className="flex-1">{item.quantity}x {item.name}</span>
                  <span className="text-muted-foreground font-medium">₦{item.total?.toLocaleString()}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-muted-foreground italic">
                  +{items.length - 3} more items
                </p>
              )}
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">₦{total.toLocaleString()}</span>
            </div>
            {orderDetails.special_instructions && (
              <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                📝 Note: {orderDetails.special_instructions}
              </p>
            )}
          </div>
        );

      case 'HOUSEKEEPING':
        return (
          <div className="space-y-1 bg-muted/50 p-2 rounded">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <p className="font-medium">Housekeeping Request</p>
            </div>
            {data.service_type && (
              <p className="text-sm text-muted-foreground pl-6">
                Service: <span className="font-medium">{data.service_type}</span>
              </p>
            )}
            {data.notes && (
              <p className="text-sm text-muted-foreground italic pl-6">
                "{data.notes}"
              </p>
            )}
          </div>
        );

      case 'MAINTENANCE':
        return (
          <div className="space-y-2 bg-muted/50 p-2 rounded">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-500" />
              <p className="font-medium">Maintenance Request</p>
            </div>
            {data.issue_type && (
              <Badge variant="outline" className="ml-6">{data.issue_type}</Badge>
            )}
            {data.description && (
              <p className="text-sm text-muted-foreground pl-6">
                {data.description}
              </p>
            )}
          </div>
        );

      default:
        // Generic fallback for other request types
        return (
          <div className="space-y-1 bg-muted/50 p-2 rounded">
            <p className="font-medium capitalize">
              {request.request_type.replace('_', ' ')}
            </p>
            {(data.notes || request.notes) && (
              <p className="text-sm text-muted-foreground">
                {data.notes || request.notes}
              </p>
            )}
            {data.comment && (
              <p className="text-sm text-muted-foreground italic">
                "{data.comment}"
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Header: Guest & Location */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{guestIdentifier}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isLocationRequest ? 'text-orange-500' : 'text-primary'}`} />
          <span className="text-sm font-medium">{locationInfo}</span>
        </div>
      </div>

      {/* Formatted Request Content */}
      {formatRequestContent()}

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground text-right">
        {new Date(request.created_at).toLocaleString()}
      </p>
    </div>
  );
}
