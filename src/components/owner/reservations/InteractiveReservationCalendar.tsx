import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ReservationContextMenu from '@/components/owner/reservations/ReservationContextMenu';
import TimelineCalendarView from '@/components/owner/reservations/TimelineCalendarView';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  MoreHorizontal,
  Grip,
  Building,
  AlertTriangle
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addDays,
  subDays,
  addMonths, 
  subMonths, 
  isToday,
  isSameDay,
  parseISO,
  differenceInDays
} from 'date-fns';
import { useReservations, useRoomAvailability, useAssignRoom, useCheckInGuest, useCheckOutGuest } from '@/hooks/useApi';

interface InteractiveReservationCalendarProps {
  searchTerm: string;
  statusFilter: string;
  onReservationSelect: (reservation: any) => void;
}

export default function InteractiveReservationCalendar({ 
  searchTerm, 
  statusFilter, 
  onReservationSelect 
}: InteractiveReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'grid' | 'timeline'>('grid');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [draggedReservation, setDraggedReservation] = useState<any>(null);
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null);
  const [autoAssignMode, setAutoAssignMode] = useState(false);

  const { data: reservations = [], isLoading, error } = useReservations();
  const { data: roomAvailability = [] } = useRoomAvailability();
  const assignRoom = useAssignRoom();
  const checkInGuest = useCheckInGuest();
  const checkOutGuest = useCheckOutGuest();

  // Get date range based on calendar view type
  const dateRange = useMemo(() => {
    switch (calendarView) {
      case 'day':
        return [currentDate];
      case 'week':
        const startOfWeek = subDays(currentDate, currentDate.getDay());
        return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
      case 'month':
      default:
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  }, [currentDate, calendarView]);

  // Get unique rooms from availability, grouped by floor
  const roomsByFloor = useMemo(() => {
    const floors: { [key: number]: any[] } = {};
    
    roomAvailability.forEach(room => {
      if (!floors[room.floor]) {
        floors[room.floor] = [];
      }
      if (!floors[room.floor].find(r => r.roomNumber === room.roomNumber)) {
        floors[room.floor].push({
          number: room.roomNumber,
          type: room.roomType,
          floor: room.floor,
          capacity: room.capacity,
          status: room.status
        });
      }
    });
    
    return Object.keys(floors)
      .sort((a, b) => Number(a) - Number(b))
      .map(floor => ({
        floor: Number(floor),
        rooms: floors[Number(floor)].sort((a, b) => a.number.localeCompare(b.number))
      }));
  }, [roomAvailability]);

  // Flatten rooms for grid view
  const rooms = useMemo(() => {
    return roomsByFloor.flatMap(({ rooms }) => rooms);
  }, [roomsByFloor]);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      const matchesSearch = searchTerm === '' || 
        reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.room.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  // Get reservations that span multiple days
  const getReservationSpan = (reservation: any) => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = differenceInDays(checkOut, checkIn);
    
    return {
      ...reservation,
      nights,
      spans: nights > 1
    };
  };

  // Check for conflicts
  const checkRoomConflict = (roomNumber: string, checkIn: Date, checkOut: Date, excludeId?: string) => {
    return filteredReservations.some(reservation => {
      if (reservation.id === excludeId || reservation.room !== roomNumber) return false;
      
      const resCheckIn = new Date(reservation.checkIn);
      const resCheckOut = new Date(reservation.checkOut);
      
      return (checkIn < resCheckOut) && (checkOut > resCheckIn);
    });
  };

  // Auto-assign room logic
  const findBestAvailableRoom = (roomType: string, checkIn: Date, checkOut: Date) => {
    const availableRooms = rooms.filter(room => {
      const matchesType = room.type.toLowerCase().includes(roomType.toLowerCase());
      const hasNoConflict = !checkRoomConflict(room.number, checkIn, checkOut);
      const isOperational = room.status !== 'out-of-service';
      
      return matchesType && hasNoConflict && isOperational;
    });
    
    // Prioritize by floor (lower floors first) and then by room number
    return availableRooms.sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.number.localeCompare(b.number);
    })[0];
  };

  // Get reservations for a specific date and room
  const getReservationsForDateAndRoom = (date: Date, roomNumber: string) => {
    return filteredReservations.filter(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      return reservation.room === roomNumber && date >= checkIn && date < checkOut;
    });
  };

  // Get room status for a specific date
  const getRoomStatus = (date: Date, roomNumber: string) => {
    const roomData = roomAvailability.find(r => r.roomNumber === roomNumber);
    const reservations = getReservationsForDateAndRoom(date, roomNumber);
    
    if (reservations.length > 0) {
      const reservation = reservations[0];
      switch (reservation.status) {
        case 'checked-in': return 'occupied';
        case 'confirmed': return 'reserved';
        case 'pending': return 'pending';
        default: return 'available';
      }
    }
    
    return roomData?.status || 'available';
  };

  // Get status color with semantic design system colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'reserved': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'occupied': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'out-of-service': return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'checked-in': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'checked-out': return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
      case 'cancelled': return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  // Handle drag and drop with enhanced feedback
  const handleDragStart = (e: React.DragEvent, reservation: any) => {
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', reservation.id);
  };

  const handleDragOver = (e: React.DragEvent, roomNumber: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRoom(roomNumber);
  };

  const handleDragLeave = () => {
    setDragOverRoom(null);
  };

  const handleDrop = (e: React.DragEvent, targetRoom: string, targetDate: Date) => {
    e.preventDefault();
    setDragOverRoom(null);
    
    if (!draggedReservation) return;

    const checkIn = new Date(draggedReservation.checkIn);
    const checkOut = new Date(draggedReservation.checkOut);
    
    // Check for conflicts
    const hasConflict = checkRoomConflict(targetRoom, checkIn, checkOut, draggedReservation.id);
    
    if (hasConflict) {
      // Show visual conflict indicator instead of alert
      alert('Room assignment conflict detected! Please select a different room or date.');
      setDraggedReservation(null);
      return;
    }

    // Assign room
    assignRoom.mutate({
      reservationId: draggedReservation.id,
      roomNumber: targetRoom
    });

    setDraggedReservation(null);
  };

  // Handle reservation actions
  const handleReservationAction = (action: string, reservation: any) => {
    switch (action) {
      case 'check-in':
        checkInGuest.mutate(reservation.id);
        break;
      case 'check-out':
        checkOutGuest.mutate(reservation.id);
        break;
      case 'view':
        onReservationSelect(reservation);
        break;
    }
  };

  const navigatePrevious = () => {
    switch (calendarView) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subDays(currentDate, 7));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (calendarView) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  // Enhanced loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-2">
                  <Skeleton className="h-20 w-full" />
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-20 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Unable to load calendar</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the reservations calendar. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Timeline view
  if (viewType === 'timeline') {
    return (
      <TimelineCalendarView
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onReservationSelect={onReservationSelect}
      />
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Interactive Reservations Calendar
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* View Type Selector */}
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewType === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewType === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('timeline')}
                >
                  Timeline
                </Button>
              </div>

              {/* Calendar View Selector - Only for grid view */}
              <div className="flex bg-muted rounded-lg p-1">
                {(['day', 'week', 'month'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={calendarView === type ? 'default' : 'ghost'}
                    size="sm"
                    className="capitalize"
                    onClick={() => setCalendarView(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>

              {/* Auto-assignment Toggle */}
              <div className="flex items-center gap-2">
                <Select value={autoAssignMode ? 'auto' : 'manual'} onValueChange={(value) => setAutoAssignMode(value === 'auto')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="auto">Auto-assign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Navigation */}
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold min-w-[200px] text-center">
                {calendarView === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                {calendarView === 'week' && `${format(subDays(currentDate, currentDate.getDay()), 'MMM d')} - ${format(addDays(subDays(currentDate, currentDate.getDay()), 6), 'MMM d, yyyy')}`}
                {calendarView === 'month' && format(currentDate, 'MMMM yyyy')}
              </div>
              
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header Row */}
              <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(120px,1fr))] gap-1 mb-2">
                <div className="p-2 font-medium text-sm text-muted-foreground">
                  Rooms
                </div>
                {dateRange.map(date => (
                  <div key={date.toISOString()} className="p-2 text-center font-medium text-sm text-muted-foreground">
                    <div>{format(date, 'EEE')}</div>
                    <div className={isToday(date) ? 'text-primary font-bold' : ''}>
                      {format(date, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Room Rows */}
              {rooms.map(room => (
                <div key={room.number} className="grid grid-cols-[120px_repeat(auto-fit,minmax(120px,1fr))] gap-1 mb-1">
                  {/* Room Info */}
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="font-medium">Room {room.number}</div>
                    <div className="text-xs text-muted-foreground">{room.type}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </div>
                  </div>

                  {/* Date Cells */}
                  {dateRange.map(date => {
                    const status = getRoomStatus(date, room.number);
                    const reservations = getReservationsForDateAndRoom(date, room.number);
                    const reservation = reservations[0];

                    return (
                      <div
                        key={`${room.number}-${date.toISOString()}`}
                        className={`min-h-[80px] p-1 border rounded-lg transition-all duration-200 ${
                          getStatusColor(status)
                        } ${
                          draggedReservation && dragOverRoom === room.number 
                            ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' 
                            : ''
                        } ${
                          draggedReservation ? 'border-dashed border-2' : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, room.number)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, room.number, date)}
                      >
                        {reservation && (
                          <ReservationContextMenu
                            reservation={reservation}
                            onViewDetails={onReservationSelect}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-full p-2 bg-white/90 rounded border cursor-move shadow-sm transition-all hover:shadow-md hover:scale-105 ${
                                    draggedReservation?.id === reservation.id ? 'opacity-50 scale-95' : ''
                                  } ${
                                    getReservationSpan(reservation).spans ? 'border-l-4 border-l-primary' : ''
                                  }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, reservation)}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-xs font-medium truncate">
                                      {reservation.guestName}
                                    </div>
                                    <Grip className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground">
                                    #{reservation.id}
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-1 text-xs">
                                      <Users className="h-3 w-3" />
                                      <span>{reservation.guests}</span>
                                    </div>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleReservationAction('view', reservation)}>
                                          View Details
                                        </DropdownMenuItem>
                                        {reservation.status === 'confirmed' && (
                                          <DropdownMenuItem onClick={() => handleReservationAction('check-in', reservation)}>
                                            Check In
                                          </DropdownMenuItem>
                                        )}
                                        {reservation.status === 'checked-in' && (
                                          <DropdownMenuItem onClick={() => handleReservationAction('check-out', reservation)}>
                                            Check Out
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {/* Multi-day reservation indicator */}
                                  {getReservationSpan(reservation).spans && (
                                    <div className="text-xs opacity-75 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{getReservationSpan(reservation).nights}n</span>
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-medium">{reservation.guestName}</div>
                                  <div className="text-xs">Booking ID: {reservation.id}</div>
                                  <div className="text-xs">
                                    Check-in: {format(new Date(reservation.checkIn), 'MMM d, yyyy')}
                                  </div>
                                  <div className="text-xs">
                                    Check-out: {format(new Date(reservation.checkOut), 'MMM d, yyyy')}
                                  </div>
                                  <div className="text-xs">
                                    Balance: ₦{reservation.amount.toLocaleString()}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </ReservationContextMenu>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Empty states */}
            {rooms.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No rooms configured</p>
                <p className="text-sm">Configure your hotel rooms to start managing reservations.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/owner-dashboard/rooms'}>
                  Configure Rooms
                </Button>
              </div>
            )}

            {rooms.length > 0 && filteredReservations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No reservations found</p>
                <p className="text-sm">Create your first reservation or adjust your filters.</p>
              </div>
            )}
          </div>

          {/* Enhanced Status Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge className="h-4 w-4" />
              Status Legend
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-200 border border-green-300"></div>
                <span className="text-sm">🟢 Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-200 border border-blue-300"></div>
                <span className="text-sm">🔵 Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-200 border border-red-300"></div>
                <span className="text-sm">🔴 Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
                <span className="text-sm">🟠 Out of Service</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-300"></div>
                <span className="text-sm">🟡 Pending</span>
              </div>
            </div>
            
            {/* Drag and drop instructions */}
            {draggedReservation ? (
              <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded text-sm text-primary">
                <strong>Drag active:</strong> Drop on a room cell to reassign reservation
              </div>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Drag reservations between rooms to reassign. Right-click for more options.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}