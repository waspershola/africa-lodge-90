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
        bg: 'bg-success/20 hover:bg-success/30',
        border: 'border-success/40',
        text: 'text-success-foreground',
        badge: 'bg-success text-success-foreground',
        label: 'Available'
      };
    case 'occupied':
      return {
        bg: 'bg-destructive/20 hover:bg-destructive/30',
        border: 'border-destructive/40',
        text: 'text-destructive-foreground',
        badge: 'bg-destructive text-destructive-foreground',
        label: 'Occupied'
      };
    case 'reserved':
      return {
        bg: 'bg-blue-500/20 hover:bg-blue-500/30',
        border: 'border-blue-500/40',
        text: 'text-blue-900 dark:text-blue-100',
        badge: 'bg-blue-500 text-white',
        label: 'Reserved'
      };
    case 'oos':
      return {
        bg: 'bg-orange-500/20 hover:bg-orange-500/30',
        border: 'border-orange-500/40',
        text: 'text-orange-900 dark:text-orange-100',
        badge: 'bg-orange-500 text-white',
        label: 'Out of Service'
      };
    case 'overstay':
      return {
        bg: 'bg-purple-500/20 hover:bg-purple-500/30',
        border: 'border-purple-500/40',
        text: 'text-purple-900 dark:text-purple-100',
        badge: 'bg-purple-500 text-white',
        label: 'Overstay'
      };
    default:
      return {
        bg: 'bg-muted/50 hover:bg-muted/70',
        border: 'border-muted',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
        label: 'Unknown'
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
      <CardContent className="p-2 h-full flex flex-col justify-between">
        {/* Room Number & Type */}
        <div className="text-center">
          <div className={cn("text-base font-bold leading-tight", config.text)}>
            {room.number}
          </div>
          <div className={cn("text-[10px] leading-tight truncate", config.text)} title={room.type}>
            {room.name}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center my-1">
          <Badge 
            className={cn("text-[9px] px-1 py-0", config.badge)}
            variant="secondary"
          >
            {config.label}
          </Badge>
        </div>

        {/* Guest Info */}
        {room.guest && (
          <div className="text-center min-h-[2rem]">
            <div 
              className={cn("text-[10px] font-medium leading-tight truncate", config.text)}
              title={room.guest}
            >
              {room.guest}
            </div>
            {room.checkIn && (
              <div className={cn("text-[9px] opacity-75 leading-tight", config.text)}>
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