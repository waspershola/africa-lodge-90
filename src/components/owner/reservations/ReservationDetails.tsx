import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Phone, Mail, MapPin, Clock, CreditCard, FileText } from 'lucide-react';
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

interface ReservationDetailsProps {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReservationDetails({ reservation, open, onOpenChange }: ReservationDetailsProps) {
  if (!reservation) return null;

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

  const mockPaymentHistory = [
    {
      date: new Date(2024, 6, 15),
      amount: 150000,
      method: 'Credit Card',
      status: 'Completed',
      type: 'Deposit'
    },
    {
      date: new Date(2024, 7, 22),
      amount: 300000,
      method: 'Bank Transfer',
      status: 'Pending',
      type: 'Balance'
    }
  ];

  const mockNotes = [
    {
      date: new Date(2024, 6, 15),
      author: 'Front Desk',
      note: 'Guest requested early check-in. Confirmed for 12:00 PM.'
    },
    {
      date: new Date(2024, 6, 18),
      author: 'Housekeeping',
      note: 'Room preparation completed. Extra towels provided as requested.'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(reservation.guestName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {reservation.guestName}
                {getStatusBadge(reservation.status)}
              </div>
              <div className="text-sm text-muted-foreground font-normal">
                Reservation #{reservation.id}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.email}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.phone}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.guests} guest{reservation.guests !== 1 ? 's' : ''}</span>
              </div>

              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <div>Booking Source: <span className="text-foreground">{reservation.source}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Stay Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stay Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Room {reservation.room}</div>
                  <div className="text-sm text-muted-foreground">{reservation.roomType}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(reservation.checkIn, 'PPP')} - {format(reservation.checkOut, 'PPP')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reservation.nights} night{reservation.nights !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Check-in: 3:00 PM</div>
                  <div className="text-sm text-muted-foreground">Check-out: 12:00 PM</div>
                </div>
              </div>

              <Separator />

              <div className="text-right">
                <div className="text-2xl font-bold">₦{reservation.amount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPaymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{payment.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(payment.date, 'MMM dd, yyyy')} • {payment.method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₦{payment.amount.toLocaleString()}</div>
                      <Badge 
                        variant={payment.status === 'Completed' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes & History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes & History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockNotes.map((note, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(note.date, 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {reservation.status === 'confirmed' && (
            <>
              <Button size="sm">Check In</Button>
              <Button variant="outline" size="sm">Modify Reservation</Button>
            </>
          )}
          
          {reservation.status === 'checked-in' && (
            <>
              <Button size="sm">Check Out</Button>
              <Button variant="outline" size="sm">Add Charges</Button>
            </>
          )}
          
          {reservation.status === 'pending' && (
            <>
              <Button size="sm">Confirm Reservation</Button>
              <Button variant="outline" size="sm">Request Payment</Button>
            </>
          )}

          <Button variant="outline" size="sm">Send Email</Button>
          <Button variant="outline" size="sm">Print Confirmation</Button>
          <Button variant="outline" size="sm">Add Note</Button>
          
          {['confirmed', 'pending'].includes(reservation.status) && (
            <Button variant="destructive" size="sm">Cancel Reservation</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}