import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, Phone, Mail, MapPin, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  room: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  status: 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled';
  guests: number;
  nights: number;
  amount: number;
  source: string;
}

interface ReservationListProps {
  searchTerm: string;
  statusFilter: string;
  onReservationSelect: (reservation: Reservation) => void;
}

export default function ReservationList({ 
  searchTerm, 
  statusFilter, 
  onReservationSelect 
}: ReservationListProps) {
  // Mock reservations data
  const mockReservations: Reservation[] = [
    {
      id: 'RES001',
      guestName: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+234 801 234 5678',
      room: '205',
      roomType: 'Deluxe King',
      checkIn: new Date(2024, 7, 22),
      checkOut: new Date(2024, 7, 25),
      status: 'confirmed',
      guests: 2,
      nights: 3,
      amount: 450000,
      source: 'Direct Booking'
    },
    {
      id: 'RES002',
      guestName: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+234 802 345 6789',
      room: '312',
      roomType: 'Standard Twin',
      checkIn: new Date(2024, 7, 23),
      checkOut: new Date(2024, 7, 26),
      status: 'checked-in',
      guests: 1,
      nights: 3,
      amount: 285000,
      source: 'Booking.com'
    },
    {
      id: 'RES003',
      guestName: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+234 803 456 7890',
      room: '108',
      roomType: 'Family Suite',
      checkIn: new Date(2024, 7, 24),
      checkOut: new Date(2024, 7, 27),
      status: 'pending',
      guests: 3,
      nights: 3,
      amount: 520000,
      source: 'Phone Booking'
    },
    {
      id: 'RES004',
      guestName: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+234 804 567 8901',
      room: '201',
      roomType: 'Presidential Suite',
      checkIn: new Date(2024, 7, 20),
      checkOut: new Date(2024, 7, 22),
      status: 'checked-out',
      guests: 2,
      nights: 2,
      amount: 680000,
      source: 'Direct Booking'
    },
    {
      id: 'RES005',
      guestName: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+234 805 678 9012',
      room: '415',
      roomType: 'Deluxe King',
      checkIn: new Date(2024, 7, 25),
      checkOut: new Date(2024, 7, 28),
      status: 'cancelled',
      guests: 2,
      nights: 3,
      amount: 450000,
      source: 'Expedia'
    }
  ];

  const filteredReservations = mockReservations.filter(reservation => {
    const matchesSearch = searchTerm === '' || 
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.room.includes(searchTerm) ||
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Confirmed</Badge>;
      case 'checked-in':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Checked In</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>;
      case 'checked-out':
        return <Badge variant="secondary">Checked Out</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reservations List</span>
          <Badge variant="outline">
            {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredReservations.map(reservation => (
            <Card key={reservation.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(reservation.guestName)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 
                            className="font-semibold text-lg hover:text-primary cursor-pointer"
                            onClick={() => onReservationSelect(reservation)}
                          >
                            {reservation.guestName}
                          </h3>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">#{reservation.id}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ₦{reservation.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reservation.nights} night{reservation.nights !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Room {reservation.room}</div>
                          <div className="text-muted-foreground">{reservation.roomType}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(reservation.checkIn, 'MMM dd')} - {format(reservation.checkOut, 'MMM dd')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(reservation.checkIn, 'yyyy')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {reservation.guests} guest{reservation.guests !== 1 ? 's' : ''}
                          </div>
                          <div className="text-muted-foreground">{reservation.source}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{reservation.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{reservation.phone}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onReservationSelect(reservation)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Reservation</DropdownMenuItem>
                          <DropdownMenuItem>Send Confirmation</DropdownMenuItem>
                          {reservation.status === 'confirmed' && (
                            <DropdownMenuItem>Check In</DropdownMenuItem>
                          )}
                          {reservation.status === 'checked-in' && (
                            <DropdownMenuItem>Check Out</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            Cancel Reservation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReservations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reservations found matching your criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}