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
import { NewReservationDialog } from "./frontdesk/NewReservationDialog";
import { SearchDialog } from "./frontdesk/SearchDialog"; 
import { PaymentDialog } from "./frontdesk/PaymentDialog";
import { QuickGuestCapture } from "./frontdesk/QuickGuestCapture";
import { QRDirectoryFD } from "./frontdesk/QRDirectoryFD";
import { StaffOpsPanel } from "./frontdesk/StaffOpsPanel";
import { BillingOverviewFD } from "./frontdesk/BillingOverviewFD";
import { HandoverPanel } from "./frontdesk/HandoverPanel";
import { CheckoutDialog } from "./frontdesk/CheckoutDialog";
import { QRRequestsPanel } from "./frontdesk/QRRequestsPanel";
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import DashboardNotificationBar from '@/components/layout/DashboardNotificationBar';
import type { Room } from "./frontdesk/RoomGrid";
import { useTenantInfo } from "@/hooks/useTenantInfo";
import { useRooms } from "@/hooks/useRooms";
import { useReservations } from "@/hooks/useReservations";

export const FrontDeskDashboard = () => {
  const { data: tenant } = useTenantInfo();
  
  // Live data from Supabase
  const { data: rooms = [] } = useRooms();
  const { data: reservations = [] } = useReservations();

  // Calculate live dashboard metrics from actual data
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => room.status === 'available').length;
  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const oosRooms = rooms.filter(room => room.status === 'out_of_order').length;
  const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;
  
  const today = new Date().toISOString().split('T')[0];
  const arrivalsToday = reservations.filter(res => 
    res.check_in_date === today && res.status === 'confirmed'
  ).length;
  const departuresToday = reservations.filter(res => 
    res.check_out_date === today && res.status === 'checked_in'
  ).length;
  
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const inHouseGuests = reservations.filter(res => res.status === 'checked_in').length;
  
  // Mock values for now - these will be replaced with actual billing data
  const pendingPayments = 5;
  const dieselLevel = 75;
  const generatorRuntime = 8;

  // Live arrivals data for today
  const mockArrivals = reservations
    .filter(res => res.check_in_date === today && res.status === 'confirmed')
    .slice(0, 5)
    .map(res => ({
      name: res.guest_name,
      room: res.room_id,
      time: '14:00',
      status: 'pending' as const,
      phone: res.guest_phone || 'N/A'
    }));

  const mockDepartures = reservations
    .filter(res => res.check_out_date === today && res.status === 'checked_in')
    .slice(0, 5)
    .map(res => ({
      name: res.guest_name,
      room: res.room_id,
      time: '12:00',
      status: 'pending' as const,
      phone: res.guest_phone || 'N/A'
    }));

  const mockAlerts = [
    { id: 1, type: "payment", message: "Room 305 payment overdue", priority: "high" },
    { id: 2, type: "maintenance", message: "Room 102 AC needs repair", priority: "medium" },
    { id: 3, type: "compliance", message: "Missing ID for Room 201", priority: "high" }
  ];
  
  const [isOffline, setIsOffline] = useState(false);
  const [offlineTimeRemaining, setOfflineTimeRemaining] = useState(22);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showActionQueue, setShowActionQueue] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([
    { id: '1', type: 'payment' as const, message: 'Pending payments require collection', count: 3, priority: 'high' as const },
    { id: '2', type: 'id' as const, message: 'Missing guest ID documentation', count: 2, priority: 'high' as const },
    { id: '3', type: 'deposit' as const, message: 'Deposit payments due', count: 1, priority: 'medium' as const },
    { id: '4', type: 'maintenance' as const, message: 'Work orders pending', count: 2, priority: 'medium' as const }
  ]);

  // Dialog states
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [captureAction, setCaptureAction] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutRoomId, setCheckoutRoomId] = useState<string | null>(null);

  useRealtimeUpdates();

  const dashboardCards = [
    {
      title: "Rooms Available",
      value: availableRooms,
      subtitle: "Ready for assignment",
      icon: <BedDouble className="h-6 w-6" />,
      action: "Assign Room",
      color: "success",
      filterKey: "available"
    },
    {
      title: "Occupancy Rate", 
      value: `${occupancyRate}%`,
      subtitle: "Current occupancy",
      icon: <Users className="h-6 w-6" />,
      action: "View Room Map",
      color: "primary",
      filterKey: "occupied"
    },
    {
      title: "Arrivals Today",
      value: arrivalsToday,
      subtitle: "Expected check-ins",
      icon: <LogIn className="h-6 w-6" />,
      action: "Start Check-In",
      color: "accent",
      filterKey: "arrivals"
    },
    {
      title: "Departures Today",
      value: departuresToday,
      subtitle: "Expected check-outs",
      icon: <LogOut className="h-6 w-6" />,
      action: "Start Check-Out",
      color: "warning",
      filterKey: "departures"
    },
    {
      title: "In-House Guests",
      value: inHouseGuests,
      subtitle: "Currently staying",
      icon: <Users className="h-6 w-6" />,
      action: "Open Folio",
      color: "muted",
      filterKey: "in-house"
    },
    {
      title: "Pending Payments",
      value: pendingPayments,
      subtitle: "Requires collection",
      icon: <CreditCard className="h-6 w-6" />,
      action: "Collect Now",
      color: "danger",
      filterKey: "pending-payments"
    },
    {
      title: "OOS Rooms",
      value: oosRooms + maintenanceRooms,
      subtitle: "Out of service",
      icon: <Wrench className="h-6 w-6" />,
      action: "Create Work Order",
      color: "warning",
      filterKey: "oos"
    },
    {
      title: "Diesel Level",
      value: `${dieselLevel}%`,
      subtitle: `Gen: ${generatorRuntime}h today`,
      icon: <Battery className="h-6 w-6" />,
      action: "Open Power Panel",
      color: dieselLevel < 30 ? "danger" : "success",
      filterKey: undefined
    }
  ];

  const handleCardAction = (filterKey: string | undefined) => {
    if (filterKey) {
      setActiveFilter(activeFilter === filterKey ? undefined : filterKey);
    }
  };

  const handleViewAllAlerts = (type: string) => {
    console.log('View all alerts of type:', type);
    setActiveFilter(type === 'payment' ? 'pending-payments' : undefined);
  };

  const handleRoomAction = (room: Room, action: string) => {
    console.log(`Performing ${action} on room:`, room);
    setSelectedRoom(room);
    
    switch (action) {
      case 'check-in':
      case 'check-out':
      case 'assign':
      case 'extend-stay':
        setCaptureAction(action);
        setShowQuickCapture(true);
        break;
      case 'checkout':
        setCheckoutRoomId(room.id);
        setShowCheckout(true);
        break;
      default:
        break;
    }
  };

  const handleGuestCaptureComplete = (guestData: any) => {
    console.log('Guest capture completed:', guestData);
    setShowQuickCapture(false);
    setCaptureAction("");
  };

  return (
    <div className="space-y-6 p-6">
      <DashboardNotificationBar />
      
      {isOffline && (
      <NotificationBanner 
        message={`Operating in offline mode. ${offlineTimeRemaining} hours remaining.`}
        showWifiIcon={false}
      />
      )}

      {/* Quick Actions Bar */}
      <ActionBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-4 gap-4">
        {dashboardCards.map((card, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 p-0 h-auto font-normal text-xs"
                onClick={() => handleCardAction(card.filterKey)}
              >
                {card.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Filters */}
      <QuickFilters 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        statusCounts={{
          available: availableRooms,
          occupied: occupiedRooms,
          maintenance: maintenanceRooms,
          'out-of-service': oosRooms
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Room Grid - Main Content */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Room Status</CardTitle>
                <RoomLegend />
              </div>
            </CardHeader>
            <CardContent>
              <RoomGrid 
                searchQuery={searchQuery}
                activeFilter={activeFilter}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Guest Queue */}
          <GuestQueuePanel 
            onGuestAction={(guest, action) => console.log('Guest action:', guest, action)}
          />

          {/* QR Requests Panel */}
          <QRRequestsPanel />

          {/* Staff Operations */}
          <StaffOpsPanel />

          {/* Billing Overview */}
          <BillingOverviewFD />

          {/* Handover Panel */}
          <HandoverPanel />

          {/* QR Directory */}
          <QRDirectoryFD />
        </div>
      </div>

      {/* Action Queue Panel */}
      {showActionQueue && (
        <ActionQueue 
          isVisible={showActionQueue}
          isOnline={!isOffline}
        />
      )}

      {/* Keyboard Shortcuts Helper */}
      {showKeyboardHelp && (
        <KeyboardShortcutsHelper 
          isVisible={showKeyboardHelp}
          onClose={() => setShowKeyboardHelp(false)} 
        />
      )}

      {/* Dialogs */}
      <NewReservationDialog 
        open={showNewReservation}
        onOpenChange={setShowNewReservation}
      />
      
      <SearchDialog 
        open={showSearch}
        onOpenChange={setShowSearch}
      />
      
      <PaymentDialog 
        open={showPayment}
        onOpenChange={setShowPayment}
      />

      <QuickGuestCapture
        open={showQuickCapture && captureAction !== ""}
        onOpenChange={setShowQuickCapture}
        action={captureAction as any}
        onComplete={handleGuestCaptureComplete}
      />
      
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        roomId={checkoutRoomId}
      />
    </div>
  );
};

export default FrontDeskDashboard;