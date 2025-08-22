import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import ReservationContextMenu from '@/components/owner/reservations/ReservationContextMenu';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock,
  Building,
  Grip
} from 'lucide-react';
import { 
  format, 
  startOfDay,
  addDays,
  subDays,
  addHours,
  differenceInDays,
  isToday,
  isSameDay
} from 'date-fns';
import { useReservations, useRoomAvailability, useAssignRoom } from '@/hooks/useApi';

interface TimelineCalendarViewProps {
  searchTerm: string;
  statusFilter: string;
  onReservationSelect: (reservation: any) => void;
}

export default function TimelineCalendarView({ 
  searchTerm, 
  statusFilter, 
  onReservationSelect 
}: TimelineCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(7); // Default to 7 days
  const [draggedReservation, setDraggedReservation] = useState<any>(null);

  const { data: reservations = [], isLoading } = useReservations();
  const { data: roomAvailability = [] } = useRoomAvailability();
  const assignRoom = useAssignRoom();

  // Generate timeline dates
  const timelineDates = useMemo(() => {
    return Array.from({ length: viewDays }, (_, i) => addDays(currentDate, i));
  }, [currentDate, viewDays]);

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    const floors: { [key: number]: any[] } = {};
    
    roomAvailability.forEach(room => {
      if (!floors[room.floor]) {
        floors[room.floor] = [];
      }
      if (!floors[room.floor].find(r => r.roomNumber === room.roomNumber)) {
        floors[room.floor].push(room);
      }
    });
    
    return Object.keys(floors)
      .sort((a, b) => Number(a) - Number(b))
      .map(floor => ({
        floor: Number(floor),
        rooms: floors[Number(floor)].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
      }));
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

  // Get reservations that span across the timeline
  const getTimelineReservations = (roomNumber: string) => {
    return filteredReservations.filter(reservation => {
      if (reservation.room !== roomNumber) return false;
      
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      const timelineStart = startOfDay(currentDate);
      const timelineEnd = startOfDay(addDays(currentDate, viewDays));
      
      return checkIn < timelineEnd && checkOut > timelineStart;
    }).map(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      const timelineStart = startOfDay(currentDate);
      
      // Calculate position and width
      const startOffset = Math.max(0, differenceInDays(checkIn, timelineStart));
      const duration = Math.min(
        differenceInDays(checkOut, checkIn),
        viewDays - startOffset
      );
      
      return {
        ...reservation,
        startOffset,
        duration: Math.max(1, duration), // Minimum 1 day width
        leftPercent: (startOffset / viewDays) * 100,
        widthPercent: (duration / viewDays) * 100
      };
    });
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/80 border-blue-600 text-white';
      case 'checked-in': return 'bg-green-500/80 border-green-600 text-white';
      case 'pending': return 'bg-yellow-500/80 border-yellow-600 text-white';
      case 'checked-out': return 'bg-gray-500/80 border-gray-600 text-white';
      case 'cancelled': return 'bg-red-500/80 border-red-600 text-white';
      default: return 'bg-gray-500/80 border-gray-600 text-white';
    }
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, reservation: any) => {
    setDraggedReservation(reservation);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetRoom: string) => {
    e.preventDefault();
    
    if (!draggedReservation || targetRoom === draggedReservation.room) {
      setDraggedReservation(null);
      return;
    }

    // Check for conflicts
    const targetReservations = getTimelineReservations(targetRoom);
    const hasConflict = targetReservations.some(res => {
      if (res.id === draggedReservation.id) return false;
      const dragCheckIn = new Date(draggedReservation.checkIn);
      const dragCheckOut = new Date(draggedReservation.checkOut);
      const resCheckIn = new Date(res.checkIn);
      const resCheckOut = new Date(res.checkOut);
      
      return (dragCheckIn < resCheckOut) && (dragCheckOut > resCheckIn);
    });
    
    if (hasConflict) {
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

  const navigatePrevious = () => {
    setCurrentDate(subDays(currentDate, viewDays));
  };

  const navigateNext = () => {
    setCurrentDate(addDays(currentDate, viewDays));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading timeline...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline View
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* View Duration Selector */}
              <div className="flex bg-muted rounded-lg p-1">
                {[3, 7, 14, 30].map((days) => (
                  <Button
                    key={days}
                    variant={viewDays === days ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewDays(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>

              {/* Navigation */}
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-lg font-semibold min-w-[250px] text-center">
                {format(currentDate, 'MMM d')} - {format(addDays(currentDate, viewDays - 1), 'MMM d, yyyy')}
              </div>
              
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Timeline Header */}
            <div className="grid grid-cols-[200px_1fr] gap-4">
              <div className="text-sm font-medium text-muted-foreground">
                Rooms by Floor
              </div>
              <div className="relative">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${viewDays}, 1fr)` }}>
                  {timelineDates.map(date => (
                    <div key={date.toISOString()} className="text-center p-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground">
                        {format(date, 'EEE')}
                      </div>
                      <div className={`text-sm ${isToday(date) ? 'text-primary font-bold' : ''}`}>
                        {format(date, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Content */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {roomsByFloor.map(({ floor, rooms }) => (
                  <div key={floor} className="space-y-2">
                    {/* Floor Header */}
                    <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Floor {floor}</span>
                      <Badge variant="outline" className="ml-auto">
                        {rooms.length} rooms
                      </Badge>
                    </div>

                    {/* Rooms */}
                    {rooms.map(room => {
                      const roomReservations = getTimelineReservations(room.roomNumber);
                      
                      return (
                        <div key={room.roomNumber} className="grid grid-cols-[200px_1fr] gap-4">
                          {/* Room Info */}
                          <div className="p-3 border rounded-lg bg-card">
                            <div className="font-medium">Room {room.roomNumber}</div>
                            <div className="text-xs text-muted-foreground">{room.roomType}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {room.capacity} guests
                            </div>
                          </div>

                          {/* Timeline Track */}
                          <div 
                            className="relative min-h-[80px] border rounded-lg bg-muted/20"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, room.roomNumber)}
                          >
                            {/* Time Grid */}
                            <div className="absolute inset-0 grid gap-1" style={{ gridTemplateColumns: `repeat(${viewDays}, 1fr)` }}>
                              {timelineDates.map(date => (
                                <div key={date.toISOString()} className="border-l border-muted-foreground/20 first:border-l-0">
                                </div>
                              ))}
                            </div>

                            {/* Reservations */}
                            {roomReservations.map(reservation => (
                              <ReservationContextMenu
                                key={reservation.id}
                                reservation={reservation}
                                onViewDetails={onReservationSelect}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`absolute top-2 h-[calc(100%-16px)] rounded border-2 cursor-move shadow-sm transition-all hover:shadow-md ${
                                        getStatusColor(reservation.status)
                                      } ${draggedReservation?.id === reservation.id ? 'opacity-50' : ''}`}
                                      style={{
                                        left: `${reservation.leftPercent}%`,
                                        width: `${reservation.widthPercent}%`,
                                        minWidth: '80px'
                                      }}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, reservation)}
                                    >
                                      <div className="p-2 h-full flex flex-col justify-center">
                                        <div className="flex items-center gap-1 mb-1">
                                          <Grip className="h-3 w-3 opacity-70" />
                                          <div className="text-xs font-medium truncate">
                                            {reservation.guestName}
                                          </div>
                                        </div>
                                        <div className="text-xs opacity-90 truncate">
                                          #{reservation.id}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                                          <Users className="h-3 w-3" />
                                          <span>{reservation.guests}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                      <div className="font-medium">{reservation.guestName}</div>
                                      <div className="text-xs">Booking ID: {reservation.id}</div>
                                      <div className="text-xs">
                                        {format(new Date(reservation.checkIn), 'MMM d')} - {format(new Date(reservation.checkOut), 'MMM d, yyyy')}
                                      </div>
                                      <div className="text-xs">
                                        {reservation.nights} night{reservation.nights !== 1 ? 's' : ''}
                                      </div>
                                      <div className="text-xs">
                                        Total: ₦{reservation.amount.toLocaleString()}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </ReservationContextMenu>
                            ))}

                            {/* Drop Zone Indicator */}
                            {draggedReservation && (
                              <div className="absolute inset-0 border-2 border-dashed border-primary/50 bg-primary/10 rounded-lg flex items-center justify-center">
                                <div className="text-sm text-primary font-medium">
                                  Drop to assign to Room {room.roomNumber}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {roomsByFloor.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No rooms available</p>
                    <p className="text-sm">Configure your hotel rooms to start managing reservations.</p>
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/80"></div>
                <span className="text-sm text-muted-foreground">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/80"></div>
                <span className="text-sm text-muted-foreground">Checked In</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/80"></div>
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500/80"></div>
                <span className="text-sm text-muted-foreground">Checked Out</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}