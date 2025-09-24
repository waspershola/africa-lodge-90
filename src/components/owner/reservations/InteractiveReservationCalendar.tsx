import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReservations } from '@/hooks/useRooms';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface InteractiveReservationCalendarProps {
  currentDate?: Date;
  view?: 'month' | 'week' | 'day';
  onDateChange?: (date: Date) => void;
  onReservationSelect?: (reservation: any) => void;
  selectedReservation?: any;
}

export default function InteractiveReservationCalendar({
  currentDate = new Date(),
  view = 'month',
  onDateChange,
  onReservationSelect,
  selectedReservation
}: InteractiveReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const { toast } = useToast();
  const { data: reservations = [], isLoading: loading, error } = useReservations();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Get reservations for a specific date
  const getReservationsForDate = (date: Date) => {
    return reservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      return date >= checkIn && date <= checkOut;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Reservation Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayReservations = getReservationsForDate(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                    isToday ? 'bg-primary/5 border-primary' : 'border-border'
                  }`}
                  onClick={() => {
                    setSelectedDate(day);
                    onDateChange?.(day);
                  }}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayReservations.slice(0, 2).map(reservation => (
                      <div
                        key={reservation.id}
                        className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(reservation.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReservationSelect?.(reservation);
                        }}
                      >
                        <div className="truncate font-medium">
                          {reservation.guest_name}
                        </div>
                      </div>
                    ))}
                    {dayReservations.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayReservations.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-3">
                Reservations for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h4>
              {getReservationsForDate(selectedDate).length === 0 ? (
                <p className="text-muted-foreground">No reservations for this date</p>
              ) : (
                <div className="space-y-2">
                  {getReservationsForDate(selectedDate).map(reservation => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-background rounded border">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{reservation.guest_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Room {reservation.room_id} • {reservation.adults} adults
                            {reservation.children > 0 && `, ${reservation.children} children`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(reservation.status)}>
                          {reservation.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReservationSelect?.(reservation)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}