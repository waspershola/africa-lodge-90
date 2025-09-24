import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface Reservation {
  id: string;
  guestName: string;
  room: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';
  guests: number;
  amount: number;
}

interface ReservationCalendarProps {
  searchTerm: string;
  statusFilter: string;
  onReservationSelect: (reservation: Reservation) => void;
}

export default function ReservationCalendar({ 
  searchTerm, 
  statusFilter, 
  onReservationSelect 
}: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock reservations data
  const mockReservations: Reservation[] = [
    {
      id: '1',
      guestName: 'John Smith',
      room: '205',
      checkIn: new Date(2024, 7, 22),
      checkOut: new Date(2024, 7, 25),
      status: 'confirmed',
      guests: 2,
      amount: 450000
    },
    {
      id: '2',
      guestName: 'Sarah Wilson',
      room: '312',
      checkIn: new Date(2024, 7, 23),
      checkOut: new Date(2024, 7, 26),
      status: 'checked-in',
      guests: 1,
      amount: 285000
    },
    {
      id: '3',
      guestName: 'Michael Chen',
      room: '108',
      checkIn: new Date(2024, 7, 24),
      checkOut: new Date(2024, 7, 27),
      status: 'pending',
      guests: 3,
      amount: 520000
    }
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getReservationsForDate = (date: Date) => {
    return mockReservations.filter(reservation => {
      const matchesSearch = searchTerm === '' || 
        reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.room.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
      
      const isInDateRange = date >= reservation.checkIn && date < reservation.checkOut;
      
      return matchesSearch && matchesStatus && isInDateRange;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked-in': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'checked-out': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reservations Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const reservationsForDay = getReservationsForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  isCurrentDay ? 'bg-primary/5 border-primary/20' : 'bg-background'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentDay ? 'text-primary' : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {reservationsForDay.slice(0, 3).map(reservation => (
                    <div
                      key={reservation.id}
                      className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${
                        getStatusColor(reservation.status)
                      }`}
                      onClick={() => onReservationSelect(reservation)}
                    >
                      <div className="font-medium truncate">{reservation.guestName}</div>
                      <div className="flex items-center gap-1">
                        <span>Room {reservation.room}</span>
                        <Users className="h-3 w-3" />
                        <span>{reservation.guests}</span>
                      </div>
                    </div>
                  ))}
                  
                  {reservationsForDay.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{reservationsForDay.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
            <span className="text-sm text-muted-foreground">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div>
            <span className="text-sm text-muted-foreground">Checked In</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300"></div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
            <span className="text-sm text-muted-foreground">Checked Out</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}