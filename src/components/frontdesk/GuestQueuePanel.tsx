import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LogIn, 
  LogOut, 
  Clock, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

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

const mockArrivals: Guest[] = [
  { id: '1', name: 'Adebayo Johnson', room: '201', time: '14:00', status: 'pending', priority: 'high' },
  { id: '2', name: 'Sarah Okonkwo', room: '305', time: '15:30', status: 'checked-in' },
  { id: '3', name: 'Michael Eze', room: '102', time: '16:00', status: 'pending' },
  { id: '4', name: 'Fatima Al-Hassan', room: '401', time: '17:00', status: 'pending', priority: 'medium' },
];

const mockDepartures: Guest[] = [
  { id: '5', name: 'David Okoro', room: '203', time: '11:00', status: 'pending', priority: 'high' },
  { id: '6', name: 'Grace Nwankwo', room: '304', time: '12:00', status: 'checked-out' },
  { id: '7', name: 'Ahmed Yusuf', room: '502', time: '13:00', status: 'pending' },
];

const mockOverstays: Guest[] = [
  { id: '8', name: 'Jennifer Okafor', room: '301', time: '11:00', status: 'overstay', priority: 'high' },
  { id: '9', name: 'Charles Ebuka', room: '205', time: '12:00', status: 'overstay', priority: 'medium' },
];

export const GuestQueuePanel = ({ onGuestAction }: GuestQueuePanelProps) => {
  const renderGuestList = (guests: Guest[], type: 'arrivals' | 'departures' | 'overstays') => {
    const getActionButton = (guest: Guest) => {
      switch (type) {
        case 'arrivals':
          return guest.status === 'pending' ? (
            <Button 
              size="sm" 
              onClick={() => onGuestAction(guest, 'check-in')}
              className="bg-success hover:bg-success/90"
            >
              <LogIn className="h-3 w-3 mr-1" />
              Check In
            </Button>
          ) : (
            <Badge variant="default" className="bg-success text-success-foreground">
              Checked In
            </Badge>
          );
        case 'departures':
          return guest.status === 'pending' ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onGuestAction(guest, 'check-out')}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Check Out
            </Button>
          ) : (
            <Badge variant="default" className="bg-success text-success-foreground">
              Checked Out
            </Badge>
          );
        case 'overstays':
          return (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onGuestAction(guest, 'handle-overstay')}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Action Required
            </Button>
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
              {getActionButton(guest)}
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
              {mockArrivals.filter(g => g.status === 'pending').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderGuestList(mockArrivals, 'arrivals')}
        </CardContent>
      </Card>

      {/* Departures Today */}
      <Card className="luxury-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-4 w-4 text-warning" />
            Departures Today
            <Badge variant="secondary" className="ml-auto">
              {mockDepartures.filter(g => g.status === 'pending').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderGuestList(mockDepartures, 'departures')}
        </CardContent>
      </Card>

      {/* Overstays */}
      <Card className="luxury-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Overstays
            <Badge variant="destructive" className="ml-auto">
              {mockOverstays.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderGuestList(mockOverstays, 'overstays')}
        </CardContent>
      </Card>
    </div>
  );
};