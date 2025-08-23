import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, Eye, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface GuestBookingHistoryProps {
  guestId: string;
  onViewReservation?: (reservationId: string) => void;
  onViewBill?: (billId: string) => void;
}

export default function GuestBookingHistory({ guestId, onViewReservation, onViewBill }: GuestBookingHistoryProps) {
  // Mock booking history data
  const bookingHistory = [
    {
      id: 'res-001',
      roomNumber: '301',
      roomType: 'Deluxe Suite',
      checkIn: new Date('2024-01-15'),
      checkOut: new Date('2024-01-18'),
      nights: 3,
      totalAmount: 450000,
      status: 'completed',
      billId: 'bill-001',
      billStatus: 'paid'
    },
    {
      id: 'res-002',
      roomNumber: '205',
      roomType: 'Standard Room',
      checkIn: new Date('2023-11-10'),
      checkOut: new Date('2023-11-12'),
      nights: 2,
      totalAmount: 180000,
      status: 'completed',
      billId: 'bill-002',
      billStatus: 'paid'
    },
    {
      id: 'res-003',
      roomNumber: '401',
      roomType: 'Presidential Suite',
      checkIn: new Date('2023-08-20'),
      checkOut: new Date('2023-08-25'),
      nights: 5,
      totalAmount: 1250000,
      status: 'completed',
      billId: 'bill-003',
      billStatus: 'paid'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'checked-in': return 'bg-primary/10 text-primary border-primary/20';
      case 'confirmed': return 'bg-accent/10 text-accent-foreground border-accent/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/10 text-success border-success/20';
      case 'partial': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'outstanding': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="luxury-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Booking History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookingHistory.map((booking) => (
          <div key={booking.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Room {booking.roomNumber} - {booking.roomType}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(booking.checkIn, 'MMM dd, yyyy')} - {format(booking.checkOut, 'MMM dd, yyyy')}
                  <span className="ml-2">({booking.nights} nights)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">₦{booking.totalAmount.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(booking.status)} variant="outline">
                  {booking.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <Badge className={getBillStatusColor(booking.billStatus)} variant="outline">
                  Bill: {booking.billStatus.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewReservation?.(booking.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Reservation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewBill?.(booking.billId)}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  View Bill
                </Button>
              </div>
            </div>
          </div>
        ))}

        {bookingHistory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">No booking history</div>
            <div className="text-sm">This guest hasn't made any reservations yet</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}