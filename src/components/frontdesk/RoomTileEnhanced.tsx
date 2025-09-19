import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BedDouble, 
  User, 
  Phone,
  CreditCard,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  WifiOff
} from "lucide-react";
import type { Room } from "./RoomGrid";

interface RoomTileEnhancedProps {
  room: Room;
  isSelected?: boolean;
  onClick?: () => void;
}

export const RoomTileEnhanced = ({ room, isSelected, onClick }: RoomTileEnhancedProps) => {
  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'bg-room-available text-room-available-foreground';
      case 'occupied': return 'bg-room-occupied text-room-occupied-foreground';
      case 'reserved': return 'bg-room-reserved text-room-reserved-foreground';
      case 'oos': return 'bg-room-oos text-room-oos-foreground';
      case 'overstay': return 'bg-room-overstay text-room-overstay-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getBillingStatusColor = (status?: string) => {
    switch (status) {
      case 'up-to-date': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
      case 'pay-later': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const getQRStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-400';
      case 'disabled': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const hasAlerts = Object.values(room.alerts).some(Boolean);
  const hasQRRequests = room.qrCode && room.qrCode.pendingRequests > 0;

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md luxury-card
        ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}
        ${hasAlerts ? 'border-warning' : ''}
        ${hasQRRequests ? 'ring-1 ring-blue-200' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Room Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg">{room.number}</span>
          </div>
          <Badge className={getStatusColor(room.status)}>
            {room.status.toUpperCase()}
          </Badge>
        </div>

        {/* Room Type */}
        <div className="text-xs text-muted-foreground">{room.type}</div>

        {/* Guest Information */}
        {room.guest ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <User className="h-3 w-3" />
              <span className="font-medium truncate">{room.guest.name}</span>
            </div>
            {room.guest.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="truncate">{room.guest.phone}</span>
              </div>
            )}
            {room.guest.bookingSource && (
              <div className="text-xs text-muted-foreground">
                via {room.guest.bookingSource}
              </div>
            )}
            {room.guest.stayDuration && (
              <div className="text-xs text-muted-foreground">
                {room.guest.stayDuration} night{room.guest.stayDuration > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">Available</div>
        )}

        {/* Billing Status */}
        {room.folio && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span className={getBillingStatusColor(room.folio.status)}>
                ₦{room.folio.balance.toLocaleString()}
              </span>
            </div>
            {room.folio.qrCharges && room.folio.qrCharges > 0 && (
              <div className="text-blue-600">
                +₦{room.folio.qrCharges.toLocaleString()} QR
              </div>
            )}
          </div>
        )}

        {/* QR Code Status */}
        {room.qrCode && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <QrCode className={`h-3 w-3 ${getQRStatusColor(room.qrCode.status)}`} />
              <span className={getQRStatusColor(room.qrCode.status)}>
                {room.qrCode.status.toUpperCase()}
              </span>
            </div>
            {room.qrCode.pendingRequests > 0 && (
              <Badge variant="destructive" className="text-xs">
                {room.qrCode.pendingRequests} req
              </Badge>
            )}
          </div>
        )}

        {/* Services Enabled Count */}
        {room.qrCode && room.qrCode.servicesEnabled.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {room.qrCode.servicesEnabled.length} service{room.qrCode.servicesEnabled.length > 1 ? 's' : ''} enabled
          </div>
        )}

        {/* Alerts */}
        {hasAlerts && (
          <div className="flex flex-wrap gap-1">
            {room.alerts.cleaning && (
              <Badge variant="secondary" className="text-xs">
                🧹 Clean
              </Badge>
            )}
            {room.alerts.depositPending && (
              <Badge variant="secondary" className="text-xs">
                💳 Deposit
              </Badge>
            )}
            {room.alerts.idMissing && (
              <Badge variant="destructive" className="text-xs">
                🆔 ID
              </Badge>
            )}
            {room.alerts.maintenance && (
              <Badge variant="secondary" className="text-xs">
                🔧 Maint
              </Badge>
            )}
          </div>
        )}

        {/* Last QR Scan */}
        {room.qrCode?.lastScanned && room.qrCode.status === 'active' && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last scan: {new Date(room.qrCode.lastScanned).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};