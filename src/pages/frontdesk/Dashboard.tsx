import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hotel, Users, Clock, LogOut, AlertTriangle, CreditCard, 
  Wrench, Zap, Bell, Search, Plus, Keyboard, 
  Bed, CheckCircle, XCircle, Calendar, DollarSign,
  Wifi, WifiOff, Timer, Play, Pause, Grid3X3, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { DataEmpty } from '@/components/ui/data-empty';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFrontDeskData, useOfflineQueue } from '@/hooks/useFrontDesk';
import OfflineBanner from '@/components/frontdesk/OfflineBanner';
import ActionQueue from '@/components/frontdesk/ActionQueue';
import QuickActionCard from '@/components/frontdesk/QuickActionCard';
import RoomGrid from '@/components/frontdesk/RoomGrid';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function FrontDeskDashboard() {
  const { hotelSlug } = useParams<{ hotelSlug: string }>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'grid' | 'dashboard'>('grid');
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  
  // Use default hotel slug if none provided (for direct /front-desk access)
  const effectiveHotelSlug = hotelSlug || 'default-hotel';
  
  const { 
    data: frontDeskData, 
    isLoading, 
    error, 
    refetch,
    isOffline,
    offlineTimeRemaining,
    isReadOnly
  } = useFrontDeskData(effectiveHotelSlug);
  
  const { queuedActions, addToQueue, retryQueue, clearQueue } = useOfflineQueue();

  // Keyboard shortcuts - MOVED BEFORE EARLY RETURNS
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (document.activeElement?.tagName === 'INPUT') return;
      if (isReadOnly) return;

      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          if (selectedRoom) {
            handleRoomAction(selectedRoom, 'assign_room');
          } else {
            handleAssignRoom();
          }
          break;
        case 'i':
          event.preventDefault();
          if (selectedRoom) {
            handleRoomAction(selectedRoom, 'check_in');
          } else {
            handleCheckIn();
          }
          break;
        case 'o':
          event.preventDefault();
          if (selectedRoom) {
            handleRoomAction(selectedRoom, 'check_out');
          } else {
            handleCheckOut();
          }
          break;
        case '/':
          event.preventDefault();
          setSearchOpen(true);
          break;
        case 'g':
          event.preventDefault();
          setCurrentView(currentView === 'grid' ? 'dashboard' : 'grid');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isReadOnly, selectedRoom, currentView]);

  const handleAssignRoom = useCallback(() => {
    const action = { type: 'assign_room', data: {}, timestamp: Date.now() };
    if (isOffline) {
      addToQueue(action);
    } else {
      // Execute action immediately
      console.log('Assigning room...');
    }
  }, [isOffline, addToQueue]);

  const handleCheckIn = useCallback(() => {
    const action = { type: 'check_in', data: {}, timestamp: Date.now() };
    if (isOffline) {
      addToQueue(action);
    } else {
      console.log('Checking in guest...');
    }
  }, [isOffline, addToQueue]);

  const handleCheckOut = useCallback(() => {
    const action = { type: 'check_out', data: {}, timestamp: Date.now() };
    if (isOffline) {
      addToQueue(action);
    } else {
      console.log('Checking out guest...');
    }
  }, [isOffline, addToQueue]);

  const handleAction = useCallback((actionType: string, data: any = {}) => {
    const action = { type: actionType, data, timestamp: Date.now() };
    if (isOffline) {
      addToQueue(action);
    } else {
      console.log(`Executing ${actionType}:`, data);
    }
  }, [isOffline, addToQueue]);

  // Simple room action handler for keyboard shortcuts (doesn't depend on dashboard data)
  const handleRoomAction = useCallback((roomId: string, actionType: string) => {
    const action = { 
      type: actionType, 
      data: { roomId }, 
      timestamp: Date.now() 
    };
    
    if (isOffline) {
      addToQueue(action);
    } else {
      console.log(`Executing ${actionType} for room ${roomId}:`, action.data);
    }
  }, [isOffline, addToQueue]);

  const handleCardClick = useCallback((filterType: string) => {
    setDashboardFilter(prev => prev === filterType ? null : filterType);
    if (currentView === 'dashboard') {
      setCurrentView('grid');
    }
  }, [currentView]);

  const cardVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  // Early returns AFTER all hooks are defined
  if (isLoading) return <LoadingState message="Loading front desk..." />;
  if (error) return <ErrorState message="Failed to load front desk data" onRetry={refetch} />;

  const dashboard = frontDeskData?.data;
  if (!dashboard) return <DataEmpty message="No front desk data available" />;

  // All callbacks that depend on dashboard data
  const handleRoomActionWithData = useCallback((roomId: string, actionType: string) => {
    const room = dashboard?.rooms?.find(r => r.id === roomId);
    const action = { 
      type: actionType, 
      data: { roomId, roomNumber: room?.number, guestName: room?.guestName }, 
      timestamp: Date.now() 
    };
    
    if (isOffline) {
      addToQueue(action);
    } else {
      console.log(`Executing ${actionType} for room ${room?.number}:`, action.data);
    }
  }, [isOffline, addToQueue, dashboard]);

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <OfflineBanner 
            timeRemaining={offlineTimeRemaining}
            isReadOnly={isReadOnly}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold display-heading text-gradient">
                  Front Desk
                </h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {effectiveHotelSlug?.replace('-', ' ')} Hotel
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <Badge variant={isOffline ? 'destructive' : 'default'} className="gap-1">
                {isOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                {isOffline ? 'Offline' : 'Online'}
              </Badge>

              {/* View Toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={currentView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('grid')}
                  className="h-7 px-2"
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
                <Button
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                  className="h-7 px-2"
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>
              </div>

              {/* Queue Status */}
              {queuedActions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQueue(true)}
                  className="gap-2"
                >
                  <Timer className="h-4 w-4" />
                  {queuedActions.length} Queued
                </Button>
              )}

              {/* Keyboard Shortcuts */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Assign Room</span>
                      <kbd className="px-2 py-1 text-xs bg-muted rounded">A</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Check-In</span>
                      <kbd className="px-2 py-1 text-xs bg-muted rounded">I</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Check-Out</span>
                      <kbd className="px-2 py-1 text-xs bg-muted rounded">O</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Toggle View</span>
                      <kbd className="px-2 py-1 text-xs bg-muted rounded">G</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Search</span>
                      <kbd className="px-2 py-1 text-xs bg-muted rounded">/</kbd>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'grid' ? (
          // Room Grid View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Room Grid - Takes 2/3 of the space */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5" />
                      Room Grid
                      {dashboardFilter && (
                        <Badge variant="secondary" className="ml-2">
                          Filtered by {dashboardFilter}
                        </Badge>
                      )}
                    </CardTitle>
                    {dashboardFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDashboardFilter(null)}
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-4rem)]">
                  <RoomGrid
                    rooms={dashboard.rooms || []}
                    selectedRoom={selectedRoom}
                    onRoomSelect={setSelectedRoom}
                    onRoomAction={handleRoomActionWithData}
                    filterBy={dashboardFilter}
                    isReadOnly={isReadOnly}
                  />
                </CardContent>
              </Card>
            </div>

            {/* KPI Cards - Takes 1/3 of the space */}
            <div className="space-y-4">
              {/* Occupancy Rate */}
              <Card className="modern-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold text-primary">
                    {dashboard.occupancyRate}%
                  </div>
                  <Progress value={dashboard.occupancyRate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {dashboard.totalRooms - dashboard.roomsAvailable} / {dashboard.totalRooms} rooms
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-3">
                <QuickActionCard
                  title="Available"
                  value={dashboard.roomsAvailable}
                  icon={Bed}
                  actionLabel="Assign Room"
                  onAction={() => handleCardClick('available')}
                  disabled={isReadOnly}
                  variant="success"
                  subtitle="Ready for guests"
                />

                <QuickActionCard
                  title="Arrivals Today"
                  value={dashboard.arrivalsToday}
                  icon={CheckCircle}
                  actionLabel="View Arrivals"
                  onAction={() => handleCardClick('arrivals')}
                  disabled={isReadOnly}
                  variant="primary"
                  subtitle={`${dashboard.pendingCheckIns} pending`}
                />

                <QuickActionCard
                  title="Departures"
                  value={dashboard.departuresToday}
                  icon={LogOut}
                  actionLabel="View Departures"
                  onAction={() => handleCardClick('departures')}
                  disabled={isReadOnly}
                  variant="warning"
                  subtitle={`${dashboard.pendingCheckOuts} pending`}
                />

                <QuickActionCard
                  title="Overstays"
                  value={dashboard.overstays}
                  icon={Clock}
                  actionLabel="View Overstays"
                  onAction={() => handleCardClick('overstays')}
                  disabled={isReadOnly}
                  variant="destructive"
                  subtitle="Need attention"
                />

                <QuickActionCard
                  title="Out of Service"
                  value={dashboard.oosRooms}
                  icon={Wrench}
                  actionLabel="View OOS"
                  onAction={() => handleCardClick('oos')}
                  disabled={isReadOnly}
                  variant="warning"
                  subtitle="Maintenance"
                />

                <QuickActionCard
                  title="Pending Payments"
                  value={`₦${dashboard.pendingPayments?.toLocaleString()}`}
                  icon={CreditCard}
                  actionLabel="View Pending"
                  onAction={() => handleCardClick('pending_payments')}
                  disabled={isReadOnly}
                  variant="destructive"
                  subtitle={`${dashboard.pendingPaymentCount} guests`}
                />
              </div>
            </div>
          </div>
        ) : (
          // Dashboard Cards View
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* Rooms Available */}
            <motion.div variants={fadeIn}>
              <QuickActionCard
                title="Rooms Available"
                value={dashboard.roomsAvailable}
                icon={Bed}
                actionLabel="Assign Room"
                onAction={handleAssignRoom}
                disabled={isReadOnly}
                variant="success"
                subtitle={`${dashboard.totalRooms - dashboard.roomsAvailable} occupied`}
              />
            </motion.div>

          {/* Occupancy Percentage */}
          <motion.div variants={fadeIn}>
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  Occupancy Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-primary">
                  {dashboard.occupancyRate}%
                </div>
                <Progress value={dashboard.occupancyRate} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {dashboard.totalRooms - dashboard.roomsAvailable} / {dashboard.totalRooms} rooms
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Arrivals Today */}
          <motion.div variants={fadeIn}>
            <QuickActionCard
              title="Arrivals Today"
              value={dashboard.arrivalsToday}
              icon={CheckCircle}
              actionLabel="Check-In"
              onAction={handleCheckIn}
              disabled={isReadOnly}
              variant="primary"
              subtitle={`${dashboard.pendingCheckIns} pending`}
            />
          </motion.div>

          {/* Departures Today */}
          <motion.div variants={fadeIn}>
            <QuickActionCard
              title="Departures Today"
              value={dashboard.departuresToday}
              icon={LogOut}
              actionLabel="Check-Out"
              onAction={handleCheckOut}
              disabled={isReadOnly}
              variant="warning"
              subtitle={`${dashboard.pendingCheckOuts} pending`}
            />
          </motion.div>

          {/* Overstays */}
          <motion.div variants={fadeIn}>
            <QuickActionCard
              title="Overstays"
              value={dashboard.overstays}
              icon={Clock}
              actionLabel="Contact Guest"
              onAction={() => handleAction('contact_guest')}
              disabled={isReadOnly}
              variant="destructive"
              subtitle="Immediate attention"
            />
          </motion.div>

          {/* In-House Guests */}
          <motion.div variants={fadeIn}>
            <QuickActionCard
              title="In-House"
              value={dashboard.inHouseGuests}
              icon={Users}
              actionLabel="Open Folio"
              onAction={() => handleAction('open_folio')}
              disabled={isReadOnly}
              variant="default"
              subtitle="Active guests"
            />
          </motion.div>

          {/* Pending Payments */}
          <motion.div variants={fadeIn}>
            <QuickActionCard
              title="Pending Payments"
              value={`₦${dashboard.pendingPayments.toLocaleString()}`}
              icon={CreditCard}
              actionLabel="Collect Payment"
              onAction={() => handleAction('collect_payment')}
              disabled={isReadOnly}
              variant="destructive"
              subtitle={`${dashboard.pendingPaymentCount} transactions`}
            />
          </motion.div>

          {/* OOS Rooms */}
          <motion.div variants={fadeIn}>
            <QuickActionCard
              title="Out of Service"
              value={dashboard.oosRooms}
              icon={Wrench}
              actionLabel="Work Order"
              onAction={() => handleAction('create_work_order')}
              disabled={isReadOnly}
              variant="warning"
              subtitle="Maintenance required"
            />
          </motion.div>

          {/* Diesel Level / Generator */}
          <motion.div variants={fadeIn}>
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4 text-primary" />
                  Power Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Diesel Level</span>
                  <span className="font-medium">{dashboard.dieselLevel}%</span>
                </div>
                <Progress value={dashboard.dieselLevel} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Runtime: {dashboard.genRuntime}h</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('open_power_panel')}
                    disabled={isReadOnly}
                    className="h-6 text-xs"
                  >
                    Power Panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerts */}
          <motion.div variants={fadeIn}>
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Bell className="h-4 w-4 text-destructive" />
                  Alerts
                  {dashboard.alerts.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {dashboard.alerts.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.alerts.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboard.alerts.slice(0, 3).map((alert, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20"
                      >
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-destructive">
                            {alert.type}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {alert.message}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {dashboard.alerts.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dashboard.alerts.length - 3} more alerts
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          </motion.div>
        )}
      </main>

      {/* Sticky Footer */}
      <motion.footer
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <Button
              className="bg-gradient-primary shadow-luxury hover:shadow-hover gap-2"
              disabled={isReadOnly}
              onClick={() => handleAction('new_reservation')}
            >
              <Plus className="h-4 w-4" />
              New Reservation
            </Button>
            
            <Button
              variant="outline"
              disabled={isReadOnly}
              onClick={() => handleAction('collect_payment')}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Collect Payment
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </motion.footer>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search guests, rooms, reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="text-sm text-muted-foreground">
              Press Enter to search or Escape to close
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Queue Dialog */}
      <ActionQueue
        open={showQueue}
        onOpenChange={setShowQueue}
        queuedActions={queuedActions}
        onRetry={retryQueue}
        onClear={clearQueue}
        isOffline={isOffline}
      />
    </div>
  );
}