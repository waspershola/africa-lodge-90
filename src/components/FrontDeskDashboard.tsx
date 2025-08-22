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
import { ActionBar } from "./frontdesk/ActionBar";
import { GuestQueuePanel } from "./frontdesk/GuestQueuePanel";
import { RoomLegend } from "./frontdesk/RoomLegend";
import { KeyboardShortcutsHelper } from "./frontdesk/KeyboardShortcutsHelper";
import { QuickFilters } from "./frontdesk/QuickFilters";
import { NotificationBanner } from "./frontdesk/NotificationBanner";
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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([
    { id: '1', type: 'payment' as const, message: 'Pending payments require collection', count: 3, priority: 'high' as const },
    { id: '2', type: 'id' as const, message: 'Missing guest ID documentation', count: 2, priority: 'high' as const },
    { id: '3', type: 'deposit' as const, message: 'Deposit payments due', count: 1, priority: 'medium' as const },
    { id: '4', type: 'maintenance' as const, message: 'Work orders pending', count: 2, priority: 'medium' as const },
  ]);

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

  const handleAction = (action: string) => {
    console.log('Front desk action:', action);
    // Handle various front desk actions here
  };

  const handleGuestAction = (guest: any, action: string) => {
    console.log('Guest action:', action, guest);
    // Handle guest-specific actions here
  };

  const handleDismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleViewAllAlerts = (type: string) => {
    console.log('View all alerts of type:', type);
    // Filter room grid or open alerts modal
    setActiveFilter(type === 'payment' ? 'pending-payments' : undefined);
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

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Action Queue (when offline) */}
        {showActionQueue && (
          <ActionQueue isVisible={showActionQueue} isOnline={!isOffline} />
        )}

        {/* Room Status Overview - Priority #1 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Room Status Overview</h2>
          <RoomGrid 
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            onRoomSelect={setSelectedRoom}
          />
        </div>

        {/* Notification Alerts - Under Room Overview */}
        <NotificationBanner 
          alerts={activeAlerts}
          onDismiss={handleDismissAlert}
          onViewAll={handleViewAllAlerts}
        />

        {/* Quick KPIs - Horizontal row under Room Status Overview */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Quick KPIs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {dashboardCards.map((card, index) => (
              <Card 
                key={index} 
                className={`luxury-card cursor-pointer transition-all duration-200 hover:shadow-md ${
                  activeFilter === card.filterKey ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => card.filterKey && handleCardClick(card.filterKey)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    card.color === 'success' ? 'bg-success/10 text-success' :
                    card.color === 'primary' ? 'bg-primary/10 text-primary' :
                    card.color === 'accent' ? 'bg-accent/10 text-accent-foreground' :
                    card.color === 'warning' ? 'bg-warning/10 text-warning-foreground' :
                    card.color === 'danger' ? 'bg-danger/10 text-danger' :
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    {card.icon}
                  </div>
                  <div className="text-lg font-bold">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.title}</div>
                  {activeFilter === card.filterKey && (
                    <Badge variant="default" className="mt-2 text-xs">
                      <Filter className="h-2 w-2 mr-1" />
                      Active
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Bar - Always visible under KPIs */}
        <ActionBar 
          onAction={handleAction}
          showKeyboardHelp={showKeyboardHelp}
          onToggleKeyboardHelp={() => setShowKeyboardHelp(!showKeyboardHelp)}
        />

        {/* Guest Queue Panel */}
        <GuestQueuePanel onGuestAction={handleGuestAction} />

        {/* Room Legend */}
        <RoomLegend />
      </div>

      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcutsHelper 
        isVisible={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
};

export default FrontDeskDashboard;