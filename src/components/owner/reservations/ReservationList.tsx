import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, Phone, Mail, MapPin, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useReservations } from '@/hooks/useApi';

interface ReservationListProps {
  searchTerm: string;
  statusFilter: string;
  onReservationSelect: (reservation: any) => void;
}

export default function ReservationList({ 
  searchTerm, 
  statusFilter, 
  onReservationSelect 
}: ReservationListProps) {
  const { data: reservations = [], isLoading } = useReservations();

  const filteredReservations = reservations.filter(reservation => {
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

  if (isLoading) {
    return <div className="p-6">Loading reservations...</div>;
  }

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