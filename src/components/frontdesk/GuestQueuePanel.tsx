import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  LogIn, 
  LogOut, 
  Clock, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useTodayArrivals, useTodayDepartures } from "@/hooks/data/useReservationsData";
import { format } from "date-fns";

interface Guest {
  id: string;
  name: string;
  room: string;
  time: string;
  status: 'pending' | 'checked-in' | 'checked-out' | 'overstay';
  priority?: 'high' | 'medium' | 'low';
}

interface GuestQueuePanelProps {
  onGuestAction: (guest: Guest, action: string) => void;
}

export const GuestQueuePanel = ({ onGuestAction }: GuestQueuePanelProps) => {
  const { data: arrivalReservations = [], isLoading: arrivalsLoading } = useTodayArrivals();
  const { data: departureReservations = [], isLoading: departuresLoading } = useTodayDepartures();

  // Transform reservations to Guest format
  const arrivals: Guest[] = arrivalReservations.map((res: any) => ({
    id: res.id,
    name: res.guest_name,
    room: res.room?.room_number || 'TBA',
    time: format(new Date(res.check_in_date), 'HH:mm'),
    status: res.status === 'checked_in' ? 'checked-in' : 'pending',
    priority: res.status === 'confirmed' ? 'high' : 'medium',
  }));

  const departures: Guest[] = departureReservations.map((res: any) => ({
    id: res.id,
    name: res.guest_name,
    room: res.room?.room_number || 'N/A',
    time: format(new Date(res.check_out_date), 'HH:mm'),
    status: res.status === 'checked_out' ? 'checked-out' : 'pending',
    priority: res.status === 'checked_in' ? 'high' : 'medium',
  }));

  // Check for overstays (checked-in reservations past checkout date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overstays: Guest[] = departureReservations
    .filter((res: any) => {
      const checkoutDate = new Date(res.check_out_date);
      checkoutDate.setHours(0, 0, 0, 0);
      return res.status === 'checked_in' && checkoutDate < today;
    })
    .map((res: any) => ({
      id: res.id,
      name: res.guest_name,
      room: res.room?.room_number || 'N/A',
      time: format(new Date(res.check_out_date), 'HH:mm'),
      status: 'overstay' as const,
      priority: 'high' as const,
    }));

  if (arrivalsLoading || departuresLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="luxury-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const renderGuestList = (guests: Guest[], type: 'arrivals' | 'departures' | 'overstays') => {
    const getStatusBadge = (guest: Guest) => {
      switch (type) {
        case 'arrivals':
          return guest.status === 'checked-in' ? (
            <Badge variant="default" className="bg-success text-success-foreground">
              Checked In
            </Badge>
          ) : (
            <Badge variant="secondary">
              Pending
            </Badge>
          );
        case 'departures':
          return guest.status === 'checked-out' ? (
            <Badge variant="default" className="bg-success text-success-foreground">
              Checked Out
            </Badge>
          ) : (
            <Badge variant="secondary">
              Pending
            </Badge>
          );
        case 'overstays':
          return (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overstay
            </Badge>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-2">
        {guests.slice(0, 4).map((guest, index) => (
          <motion.div
            key={guest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onGuestAction(guest, 'view-details')}
          >
            <div className="flex items-center gap-3 flex-1">
              {guest.priority === 'high' && (
                <div className="h-2 w-2 rounded-full bg-danger animate-pulse" />
              )}
              {guest.priority === 'medium' && (
                <div className="h-2 w-2 rounded-full bg-warning" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" title={guest.name}>
                  {guest.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Room {guest.room}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {guest.time}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(guest)}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Arrivals Today */}
      <Card className="luxury-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LogIn className="h-4 w-4 text-success" />
            Arrivals Today
            <Badge variant="secondary" className="ml-auto">
              {arrivals.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderGuestList(arrivals, 'arrivals')}
        </CardContent>
      </Card>

      {/* Departures Today */}
      <Card className="luxury-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-4 w-4 text-warning" />
            Departures Today
            <Badge variant="secondary" className="ml-auto">
              {departures.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderGuestList(departures, 'departures')}
        </CardContent>
      </Card>

      {/* Overstays */}
      <Card className="luxury-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Overstays
            <Badge variant="destructive" className="ml-auto">
              {overstays.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderGuestList(overstays, 'overstays')}
        </CardContent>
      </Card>
    </div>
  );
};