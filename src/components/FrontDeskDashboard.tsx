import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar, 
  LogIn, 
  LogOut, 
  BedDouble,
  AlertCircle,
  CreditCard,
  WifiOff,
  Search,
  Plus,
  Clock,
  Wrench,
  Battery,
  DollarSign,
  Filter
} from "lucide-react";
import { RoomGrid } from "./frontdesk/RoomGrid";
import { ActionQueue } from "./frontdesk/ActionQueue";
import type { Room } from "./frontdesk/RoomGrid";

// Mock data
const mockData = {
  roomsAvailable: 15,
  occupancyRate: 78,
  arrivalsToday: 12,
  departuresToday: 8,
  inHouseGuests: 45,
  pendingPayments: 3,
  oosRooms: 2,
  dieselLevel: 65,
  generatorRuntime: 4.5,
  cashVariance: -2500
};

const mockArrivals = [
  { id: 1, guest: "Adebayo Johnson", room: "201", time: "14:00", status: "pending" },
  { id: 2, guest: "Sarah Okonkwo", room: "305", time: "15:30", status: "checked-in" },
  { id: 3, guest: "Michael Eze", room: "102", time: "16:00", status: "pending" }
];

const mockDepartures = [
  { id: 1, guest: "Fatima Al-Hassan", room: "401", time: "11:00", status: "checked-out" },
  { id: 2, guest: "David Okoro", room: "203", time: "12:00", status: "pending" }
];

const mockAlerts = [
  { id: 1, type: "payment", message: "Room 305 payment overdue", priority: "high" },
  { id: 2, type: "maintenance", message: "Room 102 AC needs repair", priority: "medium" },
  { id: 3, type: "compliance", message: "Missing ID for Room 201", priority: "high" }
];

const FrontDeskDashboard = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [offlineTimeRemaining, setOfflineTimeRemaining] = useState(22); // hours
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showActionQueue, setShowActionQueue] = useState(false);

  // Simulate online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show action queue when offline
  useEffect(() => {
    setShowActionQueue(isOffline);
  }, [isOffline]);

  const handleCardClick = (filterKey: string) => {
    setActiveFilter(activeFilter === filterKey ? undefined : filterKey);
  };

  const dashboardCards = [
    {
      title: "Rooms Available",
      value: mockData.roomsAvailable,
      subtitle: "Ready for assignment",
      icon: <BedDouble className="h-6 w-6" />,
      action: "Assign Room",
      color: "success",
      filterKey: "available"
    },
    {
      title: "Occupancy Rate",
      value: `${mockData.occupancyRate}%`,
      subtitle: "Current occupancy",
      icon: <Users className="h-6 w-6" />,
      action: "View Room Map",
      color: "primary",
      filterKey: "occupied"
    },
    {
      title: "Arrivals Today",
      value: mockData.arrivalsToday,
      subtitle: "Expected check-ins",
      icon: <LogIn className="h-6 w-6" />,
      action: "Start Check-In",
      color: "accent",
      filterKey: "arrivals"
    },
    {
      title: "Departures Today",
      value: mockData.departuresToday,
      subtitle: "Expected check-outs",
      icon: <LogOut className="h-6 w-6" />,
      action: "Start Check-Out",
      color: "warning",
      filterKey: "departures"
    },
    {
      title: "In-House Guests",
      value: mockData.inHouseGuests,
      subtitle: "Currently staying",
      icon: <Users className="h-6 w-6" />,
      action: "Open Folio",
      color: "muted",
      filterKey: "in-house"
    },
    {
      title: "Pending Payments",
      value: mockData.pendingPayments,
      subtitle: "Requires collection",
      icon: <CreditCard className="h-6 w-6" />,
      action: "Collect Now",
      color: "danger",
      filterKey: "pending-payments"
    },
    {
      title: "OOS Rooms",
      value: mockData.oosRooms,
      subtitle: "Out of service",
      icon: <Wrench className="h-6 w-6" />,
      action: "Create Work Order",
      color: "warning",
      filterKey: "oos"
    },
    {
      title: "Diesel Level",
      value: `${mockData.dieselLevel}%`,
      subtitle: `Gen: ${mockData.generatorRuntime}h today`,
      icon: <Battery className="h-6 w-6" />,
      action: "Open Power Panel",
      color: mockData.dieselLevel < 30 ? "danger" : "success",
      filterKey: undefined
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Banner */}
      {isOffline && (
        <div className="offline-banner p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">
              Offline Mode Active - {offlineTimeRemaining}h remaining
            </span>
          </div>
          <p className="text-sm mt-1">
            All actions are queued and will sync when connection is restored
          </p>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-gradient">
                Front Desk Dashboard
              </h1>
              <p className="text-muted-foreground">
                Lagos Grand Hotel • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search guests, rooms, folios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => setIsOffline(!isOffline)}
              >
                {isOffline ? 'Go Online' : 'Simulate Offline'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="p-6 space-y-6">
        {/* Action Queue (when offline) */}
        {showActionQueue && (
          <ActionQueue isVisible={showActionQueue} isOnline={!isOffline} />
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Panel - Room Grid (3/4 width) */}
          <div className="lg:col-span-3">
            <RoomGrid 
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              onRoomSelect={setSelectedRoom}
            />
          </div>

          {/* Right Panel - Dashboard Cards (1/4 width) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Quick KPIs</h3>
              <div className="space-y-3">
                {dashboardCards.map((card, index) => (
                  <Card 
                    key={index} 
                    className={`luxury-card cursor-pointer transition-all duration-200 hover:shadow-md ${
                      activeFilter === card.filterKey ? 'ring-2 ring-primary shadow-lg' : ''
                    }`}
                    onClick={() => card.filterKey && handleCardClick(card.filterKey)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          card.color === 'success' ? 'bg-success/10 text-success' :
                          card.color === 'primary' ? 'bg-primary/10 text-primary' :
                          card.color === 'accent' ? 'bg-accent/10 text-accent-foreground' :
                          card.color === 'warning' ? 'bg-warning/10 text-warning-foreground' :
                          card.color === 'danger' ? 'bg-danger/10 text-danger' :
                          'bg-muted/50 text-muted-foreground'
                        }`}>
                          {card.icon}
                        </div>
                        <div>
                          <div className="text-xl font-bold">{card.value}</div>
                          <div className="text-xs text-muted-foreground">{card.title}</div>
                        </div>
                      </div>
                      
                      {card.filterKey ? (
                        <Button 
                          variant={activeFilter === card.filterKey ? "default" : "outline"}
                          size="sm" 
                          className="w-full text-xs"
                        >
                          {activeFilter === card.filterKey ? (
                            <>
                              <Filter className="h-3 w-3 mr-1" />
                              Filtering
                            </>
                          ) : (
                            'Filter Rooms'
                          )}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                        >
                          {card.action}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Activity Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {/* Today's Arrivals */}
          <Card className="luxury-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <LogIn className="h-4 w-4 text-success" />
                Today's Arrivals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockArrivals.slice(0, 3).map(arrival => (
                <div key={arrival.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{arrival.guest}</span>
                  <Badge 
                    variant={arrival.status === 'checked-in' ? 'default' : 'secondary'}
                    className={arrival.status === 'checked-in' ? 'bg-success text-success-foreground' : ''}
                  >
                    {arrival.status === 'checked-in' ? '✓' : '⏱'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Today's Departures */}
          <Card className="luxury-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <LogOut className="h-4 w-4 text-warning" />
                Today's Departures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockDepartures.slice(0, 3).map(departure => (
                <div key={departure.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{departure.guest}</span>
                  <Badge 
                    variant={departure.status === 'checked-out' ? 'default' : 'secondary'}
                    className={departure.status === 'checked-out' ? 'bg-success text-success-foreground' : ''}
                  >
                    {departure.status === 'checked-out' ? '✓' : '⏱'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="luxury-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-danger" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${
                    alert.priority === 'high' ? 'bg-danger' : 'bg-warning'
                  }`} />
                  <span className="truncate flex-1">{alert.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 justify-center">
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Collect Payment
          </Button>
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Quick Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FrontDeskDashboard;