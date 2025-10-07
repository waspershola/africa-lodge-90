import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Filter,
  Terminal,
  Home,
  TrendingUp,
  UserCheck,
  UserMinus,
  AlertTriangle,
  Fuel,
  Bell,
  FileText,
  UserPlus,
  User,
  CheckCircle
} from "lucide-react";
import { RoomGrid } from "./frontdesk/RoomGrid";
import { ActionQueue } from "./frontdesk/ActionQueue";
import { ActionBar } from "./frontdesk/ActionBar";
import { GuestQueuePanel } from "./frontdesk/GuestQueuePanel";
import { RoomLegend } from "./frontdesk/RoomLegend";

import { QuickFilters } from "./frontdesk/QuickFilters";
import { NotificationBanner } from "./frontdesk/NotificationBanner";
import { NewReservationDialog } from "./frontdesk/NewReservationDialog";
import { GuestDirectoryDialog } from "./frontdesk/GuestDirectoryDialog";
import { GroupBookingDialog } from "./frontdesk/GroupBookingDialog";
import { CorporateAccountDialog } from "./frontdesk/CorporateAccountDialog";
import { PaymentDialog } from "./frontdesk/PaymentDialog";
import { QuickGuestCapture } from "./frontdesk/QuickGuestCapture";
import { QRDirectoryFD } from "./frontdesk/QRDirectoryFD";
import { StaffOpsPanel } from "./frontdesk/StaffOpsPanel";
import { BillingOverviewFD } from "./frontdesk/BillingOverviewFD";
import { HandoverPanel } from "./frontdesk/HandoverPanel";
import { CheckoutDialog } from "./frontdesk/CheckoutDialog";
import { QRRequestsPanel } from "./frontdesk/QRRequestsPanel";
import { ReservationsDialogContent } from "./frontdesk/ReservationsDialogContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import DashboardNotificationBar from '@/components/layout/DashboardNotificationBar';
import { NetworkStatusIndicator } from '@/components/common/NetworkStatusBanner';
import { LoadingState } from '@/components/common/LoadingState';
import type { Room } from "./frontdesk/RoomGrid";
import { useTenantInfo } from "@/hooks/useTenantInfo";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { useFrontDeskDataOptimized } from "@/hooks/data/useFrontDeskDataOptimized";
import { useQueryClient } from "@tanstack/react-query";
import { useRooms } from "@/hooks/useRooms";
import { useToast } from "@/hooks/use-toast";

const FrontDeskDashboard = () => {
  const { data: tenantInfo } = useTenantInfo();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: roomsData } = useRooms();
  
  // Consolidated real-time data from unified hook (OPTIMIZED)
  const {
    overview,
    arrivals: todayArrivals,
    departures: todayDepartures,
    pendingPayments,
    alerts: realAlerts,
    groupedAlerts,
    isLoading: dataLoading,
  } = useFrontDeskDataOptimized();
  
  // Enable unified real-time updates with role-based filtering
  useUnifiedRealtime({ verbose: false });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showActionQueue, setShowActionQueue] = useState(false);
  
  // Dialog states
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [showReservations, setShowReservations] = useState(false);
  const [showGuestDirectory, setShowGuestDirectory] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showGroupBooking, setShowGroupBooking] = useState(false);
  const [showCorporateAccounts, setShowCorporateAccounts] = useState(false);
  const [checkoutRoomId, setCheckoutRoomId] = useState<string | undefined>(undefined);
  const [captureAction, setCaptureAction] = useState<"assign" | "walkin" | "check-in" | "check-out" | "assign-room" | "extend-stay" | "transfer-room" | "add-service" | "work-order" | "housekeeping" | "">("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activePanel, setActivePanel] = useState<'overview' | 'qr-requests' | 'staff-ops' | 'billing' | 'handover' | 'qr-manager'>('overview');
  const [recentCheckout, setRecentCheckout] = useState<string | null>(null);


  const handleCardClick = (filterKey: string) => {
    setActiveFilter(activeFilter === filterKey ? undefined : filterKey);
  };

  const handleAction = (action: string) => {
    console.log('Front desk action:', action);
    
    switch (action) {
      case 'new-reservation':
        setShowNewReservation(true);
        break;
      case 'group-booking':
        setShowGroupBooking(true);
        break;
      case 'reservations':
        setShowReservations(true);
        break;
      case 'collect-payment':
        setShowPayment(true);
        break;
      case 'guest-directory':
        setShowGuestDirectory(true);
        break;
      case 'extend-stay':
      case 'transfer-room':
      case 'add-service':
      case 'work-order':
      case 'housekeeping':
        setCaptureAction(action);
        setShowQuickCapture(true);
        break;
      default:
        console.log('Unhandled action:', action);
    }
  };

  const handleRoomUpdate = (updatedRoom: Room) => {
    setRooms(prev => prev.map(room => 
      room.number === updatedRoom.number ? updatedRoom : room
    ));
  };

  const handleGuestCaptureComplete = (guestData: any) => {
    console.log('Guest capture completed:', { action: captureAction, guestData });
    setShowQuickCapture(false);
    setCaptureAction("");
  };

  const handleGuestAction = (guest: any, action: string) => {
    console.log('Guest action:', action, guest);
    // Handle guest-specific actions here
  };

  const handleDismissAlert = (alertId: string) => {
    // Alerts are now managed by the backend - this is a UI-only dismiss
    // In production, this would call an API to mark alert as acknowledged
    console.log('Alert dismissed:', alertId);
  };

  const handleViewAllAlerts = (type: string) => {
    console.log('View all alerts of type:', type);
    // Filter room grid or open alerts modal
    setActiveFilter(type === 'payment' ? 'pending-payments' : undefined);
  };

  const handleLogout = async () => {
    // Prevent double-clicks
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // PHASE 6: Manual refresh function
  const handleManualRefresh = async () => {
    toast({
      title: "Refreshing data...",
      description: "Fetching latest updates from server",
    });
    
    await queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0] as string;
        return ['rooms', 'today-arrivals', 'today-departures', 'overstays', 'front-desk', 'reservations'].some(k => key.includes(k));
      }
    });
    
    toast({
      title: "Data refreshed",
      description: "All dashboard data updated successfully",
    });
  };

  // PHASE 6: Data validation checks
  const dataValidation = {
    roomStatusMismatch: 0,
    missingFolios: 0,
    inconsistentData: [] as string[],
  };

  // Check room status vs reservation status consistency
  if (roomsData?.rooms) {
    roomsData.rooms.forEach(room => {
      const hasActiveReservation = room.current_reservation?.status === 'checked_in' || room.current_reservation?.status === 'confirmed';
      
      // Validation 1: Occupied room should have active reservation
      if (room.status === 'occupied' && !hasActiveReservation) {
        dataValidation.roomStatusMismatch++;
        dataValidation.inconsistentData.push(`Room ${room.room_number}: Marked occupied but no active reservation`);
      }
      
      // Validation 2: Active reservation should have room marked as occupied/reserved
      if (hasActiveReservation && room.status === 'available') {
        dataValidation.roomStatusMismatch++;
        dataValidation.inconsistentData.push(`Room ${room.room_number}: Has active reservation but marked available`);
      }
      
      // Validation 3: Check for missing folios on checked-in reservations
      if (room.current_reservation?.status === 'checked_in' && !room.folio) {
        dataValidation.missingFolios++;
        dataValidation.inconsistentData.push(`Room ${room.room_number}: Checked-in guest missing folio`);
      }
    });
  }

  const hasDataIssues = dataValidation.roomStatusMismatch > 0 || dataValidation.missingFolios > 0;

  // Dashboard cards with real data from unified hook
  const dashboardCards = [
    {
      title: "Rooms Available",
      value: dataLoading ? "..." : overview.roomsAvailable,
      subtitle: "Ready for assignment",
      icon: <BedDouble className="h-6 w-6" />,
      action: "Assign Room",
      color: "success",
      filterKey: "available"
    },
    {
      title: "Occupancy Rate",
      value: dataLoading ? "..." : `${overview.occupancyRate}%`,
      subtitle: "Current occupancy",
      icon: <Users className="h-6 w-6" />,
      action: "View Room Map",
      color: "primary",
      filterKey: "occupied"
    },
    {
      title: "Arrivals Today",
      value: dataLoading ? "..." : overview.arrivalsToday,
      subtitle: "Expected check-ins",
      icon: <LogIn className="h-6 w-6" />,
      action: "Start Check-In",
      color: "accent",
      filterKey: "arrivals"
    },
    {
      title: "Departures Today",
      value: dataLoading ? "..." : overview.departuresToday,
      subtitle: "Expected check-outs",
      icon: <LogOut className="h-6 w-6" />,
      action: "Start Check-Out",
      color: "warning",
      filterKey: "departures"
    },
    {
      title: "In-House Guests",
      value: dataLoading ? "..." : overview.inHouseGuests,
      subtitle: "Currently staying",
      icon: <Users className="h-6 w-6" />,
      action: "Open Folio",
      color: "muted",
      filterKey: "in-house"
    },
    {
      title: "Pending Payments",
      value: dataLoading ? "..." : overview.pendingPayments,
      subtitle: "Requires collection",
      icon: <CreditCard className="h-6 w-6" />,
      action: "Collect Now",
      color: "danger",
      filterKey: "pending-payments"
    },
    {
      title: "OOS Rooms",
      value: dataLoading ? "..." : overview.oosRooms,
      subtitle: "Out of service",
      icon: <Wrench className="h-6 w-6" />,
      action: "Create Work Order",
      color: "warning",
      filterKey: "oos"
    },
    {
      title: "Diesel Level",
      value: dataLoading ? "..." : `${overview.dieselLevel}%`,
      subtitle: `Gen: ${overview.generatorRuntime.toFixed(1)}h runtime`,
      icon: <Battery className="h-6 w-6" />,
      action: "Open Power Panel",
      color: overview.dieselLevel < 30 ? "danger" : "success",
      filterKey: undefined
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-gradient">
                Front Desk Dashboard
              </h1>
              <p className="text-muted-foreground">
                {tenantInfo?.hotel_name || "Loading..."} • {new Date().toLocaleDateString('en-US', { 
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
              
              {/* PHASE 6: Manual Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                title="Refresh all data"
                className="relative"
              >
                <TrendingUp className="h-4 w-4" />
                {hasDataIssues && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </Button>
              
              <DashboardNotificationBar />
              <NetworkStatusIndicator />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Loading State */}
        {dataLoading && <LoadingState message="Loading front desk data..." />}
        
        {/* Main Dashboard Content */}
        {!dataLoading && (
          <>
        {/* PHASE 6: Data Validation Warning Banner */}
        {hasDataIssues && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-700 dark:text-yellow-400 mb-2">
                    Data Consistency Issues Detected
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-500 space-y-1">
                    {dataValidation.roomStatusMismatch > 0 && (
                      <div>• {dataValidation.roomStatusMismatch} room(s) with status mismatch</div>
                    )}
                    {dataValidation.missingFolios > 0 && (
                      <div>• {dataValidation.missingFolios} checked-in guest(s) missing folios</div>
                    )}
                    <div className="mt-2 text-xs max-h-32 overflow-y-auto space-y-1">
                      {dataValidation.inconsistentData.slice(0, 5).map((issue, i) => (
                        <div key={i} className="opacity-80">⚠ {issue}</div>
                      ))}
                      {dataValidation.inconsistentData.length > 5 && (
                        <div className="italic">...and {dataValidation.inconsistentData.length - 5} more issues</div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    className="mt-3 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  >
                    <TrendingUp className="h-3 w-3 mr-2" />
                    Refresh to Sync
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Banner */}
        {recentCheckout && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  ✓ Room checkout completed successfully
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Queue */}
        {showActionQueue && (
          <ActionQueue isVisible={showActionQueue} isOnline={true} />
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

        {/* Action Bar - Under Quick KPIs */}
        <ActionBar 
          onAction={handleAction}
        />

        {/* Panel Navigation */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={activePanel === 'overview' ? 'default' : 'outline'}
            onClick={() => setActivePanel('overview')}
            size="sm"
          >
            Overview
          </Button>
          <Button 
            variant={activePanel === 'qr-requests' ? 'default' : 'outline'}
            onClick={() => setActivePanel('qr-requests')}
            size="sm"
          >
            QR Requests
          </Button>
          <Button 
            variant={activePanel === 'staff-ops' ? 'default' : 'outline'}
            onClick={() => setActivePanel('staff-ops')}
            size="sm"
          >
            Staff Operations
          </Button>
          <Button 
            variant={activePanel === 'billing' ? 'default' : 'outline'}
            onClick={() => setActivePanel('billing')}
            size="sm"
          >
            Billing Overview
          </Button>
          <Button 
            variant={activePanel === 'handover' ? 'default' : 'outline'}
            onClick={() => setActivePanel('handover')}
            size="sm"
          >
            Shift Handover
          </Button>
          <Button 
            variant={activePanel === 'qr-manager' ? 'default' : 'outline'}
            onClick={() => setActivePanel('qr-manager')}
            size="sm"
          >
            QR Directory
          </Button>
          <Link to="/shift-terminal">
            <Button 
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Terminal className="h-4 w-4" />
              Shift Terminal
            </Button>
          </Link>
        </div>

        {/* Dynamic Panel Content */}
        {activePanel === 'overview' && (
          <>
            {/* Notification Alerts - Now using real data */}
            <NotificationBanner 
              alerts={groupedAlerts}
              onDismiss={handleDismissAlert}
              onViewAll={handleViewAllAlerts}
            />

            {/* Guest Queue Panel */}
            <GuestQueuePanel onGuestAction={handleGuestAction} />

            {/* Room Legend */}
            <RoomLegend />
          </>
        )}

        {activePanel === 'qr-requests' && (
          <QRRequestsPanel />
        )}

        {activePanel === 'staff-ops' && (
          <StaffOpsPanel />
        )}

        {activePanel === 'billing' && (
          <BillingOverviewFD />
        )}

        {activePanel === 'handover' && (
          <HandoverPanel />
        )}

        {activePanel === 'qr-manager' && (
          <QRDirectoryFD />
        )}
        </>
        )}
      </div>


      {/* Action Dialogs */}
      <NewReservationDialog 
        open={showNewReservation}
        onOpenChange={setShowNewReservation}
      />
      
      <Dialog open={showGuestDirectory} onOpenChange={setShowGuestDirectory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guest Directory</DialogTitle>
          </DialogHeader>
          <GuestDirectoryDialog />
        </DialogContent>
      </Dialog>
      
      <PaymentDialog 
        open={showPayment}
        onOpenChange={setShowPayment}
      />

      <Dialog open={showGroupBooking} onOpenChange={setShowGroupBooking}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Group Booking Management</DialogTitle>
          </DialogHeader>
          <GroupBookingDialog />
        </DialogContent>
      </Dialog>

      <Dialog open={showCorporateAccounts} onOpenChange={setShowCorporateAccounts}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Corporate Account Management</DialogTitle>
          </DialogHeader>
          <CorporateAccountDialog />
        </DialogContent>
      </Dialog>

      <QuickGuestCapture
        open={showQuickCapture && captureAction !== ""}
        onOpenChange={setShowQuickCapture}
        action={captureAction as any}
        onComplete={handleGuestCaptureComplete}
      />
      
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={(open) => {
          setShowCheckout(open);
          if (!open) {
            // Reset states when dialog closes
            const wasCheckout = checkoutRoomId;
            setCheckoutRoomId(undefined);
            setSelectedRoom(null);
            
            // Show brief success message if checkout was successful
            if (wasCheckout) {
              setRecentCheckout(wasCheckout);
              setTimeout(() => setRecentCheckout(null), 3000);
            }
          }
        }}
        roomId={checkoutRoomId}
      />

      <Dialog open={showReservations} onOpenChange={setShowReservations}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Reservations</DialogTitle>
          </DialogHeader>
          <ReservationsDialogContent />
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="p-4 flex justify-end">
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default FrontDeskDashboard;