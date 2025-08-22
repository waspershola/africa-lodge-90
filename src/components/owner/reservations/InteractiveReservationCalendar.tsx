import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  MoreHorizontal,
  Grip
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
  parseISO
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
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [draggedReservation, setDraggedReservation] = useState<any>(null);

  const { data: reservations = [], isLoading } = useReservations();
  const { data: roomAvailability = [] } = useRoomAvailability();
  const assignRoom = useAssignRoom();
  const checkInGuest = useCheckInGuest();
  const checkOutGuest = useCheckOutGuest();

  // Get date range based on view type
  const dateRange = useMemo(() => {
    switch (viewType) {
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
  }, [currentDate, viewType]);

  // Get unique rooms from availability
  const rooms = useMemo(() => {
    return roomAvailability.reduce((acc, room) => {
      if (!acc.find(r => r.number === room.roomNumber)) {
        acc.push({
          number: room.roomNumber,
          type: room.roomType,
          floor: room.floor,
          capacity: room.capacity
        });
      }
      return acc;
    }, [] as any[]);
  }, [roomAvailability]);

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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'out-of-service': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, reservation: any) => {
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetRoom: string, targetDate: Date) => {
    e.preventDefault();
    
    if (!draggedReservation) return;

    // Check for conflicts
    const conflicts = getReservationsForDateAndRoom(targetDate, targetRoom);
    if (conflicts.length > 0 && conflicts[0].id !== draggedReservation.id) {
      alert('Room assignment conflict detected!');
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

  // Navigation functions
  const navigatePrevious = () => {
    switch (viewType) {
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
    switch (viewType) {
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

  if (isLoading) {
    return <div className="p-6">Loading calendar...</div>;
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
                {(['day', 'week', 'month'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={viewType === type ? 'default' : 'ghost'}
                    size="sm"
                    className="capitalize"
                    onClick={() => setViewType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>

              {/* Navigation */}
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold min-w-[200px] text-center">
                {viewType === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                {viewType === 'week' && `${format(subDays(currentDate, currentDate.getDay()), 'MMM d')} - ${format(addDays(subDays(currentDate, currentDate.getDay()), 6), 'MMM d, yyyy')}`}
                {viewType === 'month' && format(currentDate, 'MMMM yyyy')}
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
                        className={`min-h-[80px] p-1 border rounded-lg transition-colors ${
                          getStatusColor(status)
                        } ${draggedReservation ? 'cursor-pointer' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, room.number, date)}
                      >
                        {reservation && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="w-full p-2 bg-white/80 rounded border cursor-move shadow-sm"
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
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Status Legend */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
              <span className="text-sm text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-200 border border-red-300"></div>
              <span className="text-sm text-muted-foreground">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300"></div>
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
              <span className="text-sm text-muted-foreground">Out of Service</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}