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
  Grip,
  Plus,
  AlertTriangle,
  Grid,
  BarChart3
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
import { useReservations, useRoomAvailability, useAssignRoom, useCheckInGuest, useCheckOutGuest, useCheckRoomConflicts } from '@/hooks/useApi';
import ReservationContextMenu from './ReservationContextMenu';
import QuickBookingForm from './QuickBookingForm';
import { useToast } from '@/hooks/use-toast';

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
  const [calendarView, setCalendarView] = useState<'grid' | 'timeline'>('grid');
  const [draggedReservation, setDraggedReservation] = useState<any>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [showQuickBooking, setShowQuickBooking] = useState(false);

  const { toast } = useToast();
  const { data: reservations = [], isLoading } = useReservations();
  const { data: roomAvailability = [] } = useRoomAvailability();
  const assignRoom = useAssignRoom();
  const checkInGuest = useCheckInGuest();
  const checkOutGuest = useCheckOutGuest();
  const checkConflicts = useCheckRoomConflicts();

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
        reservation.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.rooms?.room_number?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  // Get reservations for a specific date and room
  const getReservationsForDateAndRoom = (date: Date, roomNumber: string) => {
    return filteredReservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      return reservation.rooms?.room_number === roomNumber && date >= checkIn && date < checkOut;
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

  // Get status color with design system tokens
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
      case 'reserved': return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
      case 'occupied': return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100';
      case 'out-of-service': return 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100';
      case 'pending': return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100';
    }
  };

  // Enhanced drag start with visual feedback
  const handleDragStart = (e: React.DragEvent, reservation: any) => {
    console.log('Drag start:', reservation.id);
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', reservation.id);
    e.dataTransfer.setData('application/json', JSON.stringify(reservation));
  };

  // Enhanced drag over with visual feedback
  const handleDragOver = (e: React.DragEvent, roomNumber: string, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    const cellKey = `${roomNumber}-${date.toISOString()}`;
    setDragOverCell(cellKey);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're actually leaving this element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCell(null);
    }
  };

  // Enhanced drop with conflict detection
  const handleDrop = async (e: React.DragEvent, targetRoom: string, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop event triggered:', targetRoom, targetDate);
    
    setDragOverCell(null);
    
    if (!draggedReservation) {
      console.log('No dragged reservation found');
      return;
    }

    console.log('Processing drop for reservation:', draggedReservation.id, 'to room:', targetRoom);

    // If dropping to the same room, no need to reassign
    if (draggedReservation.room === targetRoom) {
      toast({
        title: 'No Change Needed',
        description: `Reservation is already in room ${targetRoom}.`,
        variant: 'default'
      });
      setDraggedReservation(null);
      return;
    }

    try {
      // Check for conflicts before moving
      const conflictResult = await checkConflicts.mutateAsync({
        roomNumber: targetRoom,
        checkIn: draggedReservation.checkIn,
        checkOut: draggedReservation.checkOut,
        reservationId: draggedReservation.id
      });

      if (conflictResult?.hasConflicts) {
        toast({
          title: 'Room Assignment Conflict',
          description: `Room ${targetRoom} has conflicts with existing reservations.`,
          variant: 'destructive'
        });
        setDraggedReservation(null);
        return;
      }

      // Assign room
      await assignRoom.mutateAsync({
        reservationId: draggedReservation.id,
        roomNumber: targetRoom
      });

      toast({
        title: 'Room Reassigned',
        description: `Reservation moved to room ${targetRoom} successfully.`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Error during room reassignment:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Unable to reassign room. Please try again.',
        variant: 'destructive'
      });
    }

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
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Loading calendar...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Sticky Quick Book Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => setShowQuickBooking(true)}
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-5 w-5 mr-2" />
            Quick Book
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Interactive Reservations Calendar
              </CardTitle>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Calendar View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={calendarView === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCalendarView('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={calendarView === 'timeline' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCalendarView('timeline')}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>

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
                <div className={`grid ${dateRange.length <= 7 ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[120px_repeat(auto-fit,minmax(120px,1fr))]'} gap-1 mb-2`}>
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
                  <div key={room.number} className={`grid ${dateRange.length <= 7 ? 'grid-cols-[120px_repeat(7,1fr)]' : 'grid-cols-[120px_repeat(auto-fit,minmax(120px,1fr))]'} gap-1 mb-1`}>
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
                      const cellKey = `${room.number}-${date.toISOString()}`;
                      const isDragOver = dragOverCell === cellKey;

                      return (
                        <div
                          key={cellKey}
                          className={`min-h-[80px] p-1 border rounded-lg transition-all duration-200 ${
                            getStatusColor(status)
                          } ${draggedReservation ? 'cursor-pointer' : ''} ${
                            isDragOver ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
                          }`}
                          onDragOver={(e) => handleDragOver(e, room.number, date)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, room.number, date)}
                        >
                          {reservation && (
                            <ReservationContextMenu
                              reservation={reservation}
                              onEdit={() => console.log('Edit reservation:', reservation.id)}
                              onViewDetails={() => onReservationSelect(reservation)}
                              onReassignRoom={() => console.log('Reassign room:', reservation.id)}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`w-full p-2 bg-white/90 backdrop-blur-sm rounded border cursor-move shadow-sm hover:shadow-md transition-all ${
                                      draggedReservation?.id === reservation.id ? 'opacity-50 scale-95' : ''
                                    }`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, reservation)}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-xs font-medium truncate">
                                        {reservation.guest_name}
                                      </div>
                                      <Grip className="h-3 w-3 text-muted-foreground opacity-60" />
                                    </div>
                                    
                                    <div className="text-xs text-muted-foreground">
                                      #{reservation.id}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center gap-1 text-xs">
                                        <Users className="h-3 w-3" />
                                        <span>{reservation.guests}</span>
                                      </div>
                                      
                                      {reservation.balanceDue > 0 && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                                          <span className="text-amber-600 font-medium">
                                            ₦{reservation.balanceDue.toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                      
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
                                <TooltipContent side="top" className="max-w-xs bg-white border shadow-lg">
                                  <div className="space-y-1 p-1">
                                    <div className="font-medium">{reservation.guest_name}</div>
                                    <div className="text-xs">Booking ID: {reservation.id}</div>
                                    <div className="text-xs">
                                      Check-in: {format(new Date(reservation.check_in_date), 'MMM d, yyyy')}
                                    </div>
                                    <div className="text-xs">
                                      Check-out: {format(new Date(reservation.check_out_date), 'MMM d, yyyy')}
                                    </div>
                                    <div className="text-xs">
                                      Total: ₦{reservation.total_amount?.toLocaleString() || '0'}
                                    </div>
                                    <div className="text-xs">
                                      Paid: ₦{(reservation.amountPaid || 0).toLocaleString()}
                                    </div>
                                    <div className={`text-xs font-medium ${
                                      reservation.balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      Balance Due: ₦{(reservation.balanceDue || 0).toLocaleString()}
                                    </div>
                                    <div className="text-xs">
                                      Payment: <span className="capitalize">{reservation.paymentMode}</span>
                                    </div>
                                    {reservation.source && (
                                      <div className="text-xs">
                                        Source: {reservation.source}
                                      </div>
                                    )}
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
            </div>

            {/* Status Legend */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300"></div>
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
                <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div>
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
                <span className="text-sm text-muted-foreground">Out of Service</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Booking Dialog */}
        {showQuickBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
              <QuickBookingForm onClose={() => setShowQuickBooking(false)} />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}