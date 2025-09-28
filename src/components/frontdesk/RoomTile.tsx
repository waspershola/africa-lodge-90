import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  AlertTriangle, 
  CreditCard, 
  IdCard, 
  Wrench,
  Sparkles,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "./RoomGrid";

interface RoomTileProps {
  room: Room;
  isSelected?: boolean;
  onClick: () => void;
}

const getStatusConfig = (status: Room['status']) => {
  switch (status) {
    case 'available':
      return {
        bg: 'bg-room-available/20 hover:bg-room-available/30',
        border: 'border-room-available/40',
        text: 'text-foreground',
        badge: 'bg-room-available text-room-available-foreground',
        label: 'AVAILABLE'
      };
    case 'occupied':
      return {
        bg: 'bg-room-occupied/20 hover:bg-room-occupied/30',
        border: 'border-room-occupied/40',
        text: 'text-foreground',
        badge: 'bg-room-occupied text-room-occupied-foreground',
        label: 'OCCUPIED'
      };
    case 'reserved':
      return {
        bg: 'bg-room-reserved/20 hover:bg-room-reserved/30',
        border: 'border-room-reserved/40',
        text: 'text-foreground',
        badge: 'bg-room-reserved text-room-reserved-foreground',
        label: 'RESERVED'
      };
    case 'oos':
      return {
        bg: 'bg-room-oos/20 hover:bg-room-oos/30',
        border: 'border-room-oos/40',
        text: 'text-foreground',
        badge: 'bg-room-oos text-room-oos-foreground',
        label: 'OUT OF SERVICE'
      };
    case 'overstay':
      return {
        bg: 'bg-room-overstay/20 hover:bg-room-overstay/30',
        border: 'border-room-overstay/40',
        text: 'text-foreground',
        badge: 'bg-room-overstay text-room-overstay-foreground',
        label: 'OVERSTAY'
      };
    default:
      return {
        bg: 'bg-muted/50 hover:bg-muted/70',
        border: 'border-muted',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
        label: 'UNKNOWN'
      };
  }
};

export const RoomTile = ({ room, isSelected, onClick }: RoomTileProps) => {
  const config = getStatusConfig(room.status);
  
  const alerts = Object.entries(room.alerts).filter(([_, value]) => value);
  const hasAlerts = alerts.length > 0;
  
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md relative overflow-hidden",
        "h-32 w-full", // Fixed height for consistency
        config.bg,
        config.border,
        isSelected && "ring-2 ring-primary ring-offset-2 scale-105"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 h-full flex flex-col justify-between">
        {/* Room Number - Large & Bold */}
        <div className="text-center">
          <div className={cn("text-lg font-bold font-inter leading-none mb-1", config.text)}>
            {room.number}
          </div>
          <div className={cn("text-xs font-medium uppercase tracking-wide", config.text)}>
            {room.type}
          </div>
        </div>

        {/* Status Badge - Bold & Prominent */}
        <div className="flex justify-center my-2">
          <Badge 
            className={cn("text-xs font-bold px-2 py-1 tracking-wide", config.badge)}
            variant="secondary"
          >
            {config.label}
          </Badge>
        </div>

        {/* Guest Info - Regular weight, subtle */}
        {room.guest && (
          <div className="text-center min-h-[2.5rem] space-y-1">
            <div 
              className={cn("text-xs font-normal leading-tight text-muted-foreground")}
              title={room.guest}
            >
              {room.guest.length > 12 ? room.guest.substring(0, 12) + '...' : room.guest}
            </div>
            {room.checkIn && (
              <div className={cn("text-xs text-muted-foreground")}>
                {new Date(room.checkIn).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom Section - Alerts and Balance */}
        <div className="flex items-center justify-center gap-1 min-h-[1.25rem]">
          {/* Alert Icons */}
          {hasAlerts && (
            <>
              {room.alerts.cleaning && (
                <div className="h-3 w-3 rounded-full bg-blue-500 flex items-center justify-center" title="Cleaning Required">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              )}
              {room.alerts.depositPending && (
                <div className="h-3 w-3 rounded-full bg-yellow-500 flex items-center justify-center" title="Deposit Pending">
                  <CreditCard className="h-2 w-2 text-white" />
                </div>
              )}
              {room.alerts.idMissing && (
                <div className="h-3 w-3 rounded-full bg-red-500 flex items-center justify-center" title="ID Missing">
                  <IdCard className="h-2 w-2 text-white" />
                </div>
              )}
              {room.alerts.maintenance && (
                <div className="h-3 w-3 rounded-full bg-orange-500 flex items-center justify-center" title="Maintenance Required">
                  <Wrench className="h-2 w-2 text-white" />
                </div>
              )}
            </>
          )}
          
          {/* Folio Balance */}
          {room.folio && room.folio.balance > 0 && (
            <div 
              className={cn(
                "text-[9px] font-medium px-1 rounded",
                room.folio.isPaid ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}
              title={`₦${room.folio.balance.toLocaleString()}`}
            >
              ₦{room.folio.balance >= 1000 ? `${(room.folio.balance/1000).toFixed(0)}k` : room.folio.balance}
            </div>
          )}
        </div>

        {/* Overstay Indicator */}
        {room.status === 'overstay' && (
          <div className="absolute top-1 right-1">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
};