import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle,
  AlertTriangle,
  User,
  Timer,
  ChefHat,
  Flame,
  Snowflake,
  Coffee,
  UtensilsCrossed
} from 'lucide-react';
import { usePOSApi, type KitchenTicket } from '@/hooks/usePOSApi';

export default function KDSBoard() {
  const { kitchenTickets, isLoading, claimKitchenTicket, completeKitchenTicket } = usePOSApi();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for timer calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStationIcon = (station: string) => {
    switch (station.toLowerCase()) {
      case 'grill': return <Flame className="h-5 w-5 text-red-500" />;
      case 'cold': return <Snowflake className="h-5 w-5 text-blue-500" />;
      case 'bar': return <Coffee className="h-5 w-5 text-amber-500" />;
      case 'pizza': 
      case 'oven': return <UtensilsCrossed className="h-5 w-5 text-orange-500" />;
      default: return <ChefHat className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStationColor = (station: string) => {
    switch (station.toLowerCase()) {
      case 'grill': return 'border-red-200 bg-red-50';
      case 'cold': return 'border-blue-200 bg-blue-50';
      case 'bar': return 'border-amber-200 bg-amber-50';
      case 'pizza': 
      case 'oven': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTimeElapsed = (ticket: KitchenTicket) => {
    if (!ticket.start_time) return 0;
    return Math.floor((currentTime.getTime() - new Date(ticket.start_time).getTime()) / 1000 / 60);
  };

  const getTimeRemaining = (ticket: KitchenTicket) => {
    const eta = new Date(ticket.eta);
    const remaining = Math.ceil((eta.getTime() - currentTime.getTime()) / 1000 / 60);
    return Math.max(0, remaining);
  };

  const getTicketPriority = (ticket: KitchenTicket) => {
    const timeRemaining = getTimeRemaining(ticket);
    if (timeRemaining <= 2) return 'urgent';
    if (ticket.priority === 'high' || timeRemaining <= 5) return 'high';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'orange';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'preparing': return 'blue';
      case 'ready': return 'success';
      default: return 'secondary';
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    await claimKitchenTicket(ticketId, 'Current Chef');
  };

  const handleCompleteTicket = async (ticketId: string) => {
    await completeKitchenTicket(ticketId);
  };

  // Group tickets by station
  const stationGroups = kitchenTickets.reduce((acc, ticket) => {
    if (!acc[ticket.station]) {
      acc[ticket.station] = [];
    }
    acc[ticket.station].push(ticket);
    return acc;
  }, {} as Record<string, KitchenTicket[]>);

  // Sort tickets by priority and time
  Object.keys(stationGroups).forEach(station => {
    stationGroups[station].sort((a, b) => {
      const aPriority = getTicketPriority(a);
      const bPriority = getTicketPriority(b);
      
      if (aPriority === 'urgent' && bPriority !== 'urgent') return -1;
      if (bPriority === 'urgent' && aPriority !== 'urgent') return 1;
      if (aPriority === 'high' && bPriority === 'normal') return -1;
      if (bPriority === 'high' && aPriority === 'normal') return 1;
      
      return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });
  });

  const totalTickets = kitchenTickets.length;
  const preparingTickets = kitchenTickets.filter(t => t.status === 'preparing').length;
  const urgentTickets = kitchenTickets.filter(t => getTicketPriority(t) === 'urgent').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Display System</h1>
          <p className="text-muted-foreground mt-1">
            Real-time kitchen operations and ticket management
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{currentTime.toLocaleTimeString()}</p>
          <p className="text-sm text-muted-foreground">Current Time</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tickets</p>
                <p className="text-2xl font-bold">{totalTickets}</p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{preparingTickets}</p>
              </div>
              <Timer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{urgentTickets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stations</p>
                <p className="text-2xl font-bold">{Object.keys(stationGroups).length}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(stationGroups).map(([station, tickets]) => (
          <Card key={station} className={`${getStationColor(station)} border-2 h-fit`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg capitalize">
                {getStationIcon(station)}
                {station}
                <Badge variant="outline">{tickets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {tickets.map(ticket => {
                  const priority = getTicketPriority(ticket);
                  const timeRemaining = getTimeRemaining(ticket);
                  const timeElapsed = getTimeElapsed(ticket);
                  
                  return (
                    <Card key={ticket.ticket_id} className={`border ${
                      priority === 'urgent' ? 'border-red-400 bg-red-50' :
                      priority === 'high' ? 'border-orange-400 bg-orange-50' :
                      'border-border bg-card'
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getPriorityColor(priority) as any}>
                                {priority}
                              </Badge>
                              <Badge variant={getStatusColor(ticket.status) as any}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <h4 className="font-bold">{ticket.order_number}</h4>
                            {ticket.room_id && (
                              <p className="text-sm text-muted-foreground">Room {ticket.room_id}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {timeRemaining > 0 ? `${timeRemaining}m left` : 'OVERDUE'}
                            </p>
                            {ticket.status === 'preparing' && (
                              <p className="text-xs text-muted-foreground">
                                {timeElapsed}m elapsed
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {ticket.status === 'preparing' && (
                          <div className="mb-3">
                            <Progress 
                              value={Math.min(100, (timeElapsed / 15) * 100)} 
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {ticket.items.map((item, index) => (
                            <div key={index} className="p-2 bg-muted/30 rounded border">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <span className="font-medium text-sm">{item.qty}x {item.menu_item.name}</span>
                                  {item.modifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.modifiers.map((mod, modIndex) => (
                                        <Badge key={modIndex} variant="secondary" className="text-xs h-5">
                                          {mod.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                      "{item.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          {ticket.status === 'pending' && (
                            <Button 
                              className="w-full" 
                              size="sm"
                              onClick={() => handleClaimTicket(ticket.ticket_id)}
                              disabled={isLoading}
                            >
                              <User className="h-4 w-4 mr-1" />
                              Start Prep
                            </Button>
                          )}
                          
                          {ticket.status === 'preparing' && (
                            <Button 
                              className="w-full" 
                              size="sm"
                              variant="default"
                              onClick={() => handleCompleteTicket(ticket.ticket_id)}
                              disabled={isLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Ready
                            </Button>
                          )}

                          {ticket.assigned_chef && (
                            <p className="text-xs text-muted-foreground text-center">
                              Chef: {ticket.assigned_chef}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(stationGroups).length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Tickets</h3>
            <p className="text-muted-foreground">
              Kitchen is all caught up! New orders will appear here automatically.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}