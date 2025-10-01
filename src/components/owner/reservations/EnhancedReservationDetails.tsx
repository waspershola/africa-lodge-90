import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Phone, Mail, MapPin, Clock, CreditCard, FileText, CheckCircle, Edit, Printer, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateReservation, useCancelReservation } from '@/hooks/useReservations';
import { useReservationInvoices, useSendReservationConfirmation } from '@/hooks/useEnhancedReservations';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';

interface EnhancedReservation extends Reservation {
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
  deposit_amount?: number;
  balance_due?: number;
  payment_due_date?: string;
  invoice_number?: string;
  confirmation_sent_at?: string;
}

interface Reservation {
  id: string;
  guest_name: string;
  email: string;
  phone: string;
  room: string;
  roomType: string;
  checkIn: string | Date;
  checkOut: string | Date;
  status: 'confirmed' | 'pending' | 'checked_in' | 'checked_out' | 'cancelled';
  guests: number;
  nights: number;
  total_amount: number | null | undefined;
  source: string;
}

interface EnhancedReservationDetailsProps {
  reservation: EnhancedReservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export default function EnhancedReservationDetails({ 
  reservation, 
  open, 
  onOpenChange, 
  onEdit 
}: EnhancedReservationDetailsProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [note, setNote] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const updateReservation = useUpdateReservation();
  const cancelReservation = useCancelReservation();
  const { data: invoices = [] } = useReservationInvoices(reservation?.id);
  const sendConfirmation = useSendReservationConfirmation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  // Memoize the reservation ID to prevent unnecessary re-renders
  const reservationId = useMemo(() => reservation?.id, [reservation?.id]);

  if (!reservation) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Confirmed</Badge>;
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Checked In</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>;
      case 'checked_out':
        return <Badge variant="secondary">Checked Out</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const safeFormatDate = (date: string | Date | undefined | null, formatStr: string) => {
    if (!date) return 'Invalid Date';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, formatStr);
    } catch {
      return 'Invalid Date';
    }
  };

  const handleCheckIn = useCallback(() => {
    if (reservation.status !== 'confirmed') {
      toast({
        title: "Cannot check in",
        description: "Only confirmed reservations can be checked in",
        variant: "destructive"
      });
      return;
    }
    
    updateReservation.mutate({
      id: reservationId,
      status: 'checked_in'
    });
    onOpenChange(false);
  }, [reservation.status, reservationId, updateReservation, toast, onOpenChange]);

  const handleCheckOut = useCallback(() => {
    if (reservation.status !== 'checked_in') {
      toast({
        title: "Cannot check out",
        description: "Guest must be checked in to check out",
        variant: "destructive"
      });
      return;
    }
    
    updateReservation.mutate({
      id: reservationId,
      status: 'checked_out'
    });
    onOpenChange(false);
  }, [reservation.status, reservationId, updateReservation, toast, onOpenChange]);

  const handleConfirmReservation = useCallback(() => {
    updateReservation.mutate({
      id: reservationId,
      status: 'confirmed'
    });
    onOpenChange(false);
  }, [reservationId, updateReservation, onOpenChange]);

  const handleCancelReservation = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      cancelReservation.mutate({ 
        reservationId,
        reason: 'Manual cancellation by staff'
      });
      onOpenChange(false);
    }
  }, [reservationId, cancelReservation, onOpenChange]);

  const handleSendConfirmation = useCallback(async (type: 'confirmation' | 'invoice' | 'reminder') => {
    setSendingEmail(true);
    try {
      await sendConfirmation.mutateAsync({ reservationId, type });
    } finally {
      setSendingEmail(false);
    }
  }, [reservationId, sendConfirmation]);

  const handlePrintConfirmation = () => {
    window.print();
  };

  const handleAddNote = () => {
    if (note.trim()) {
      toast({
        title: "Note added",
        description: "Note has been added to the reservation",
      });
      setNote('');
      setShowNoteDialog(false);
    }
  };

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
    <Dialog key={reservationId} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(reservation.guest_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {reservation.guest_name}
                {getStatusBadge(reservation.status)}
                {reservation.payment_status && getPaymentStatusBadge(reservation.payment_status)}
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
                {reservation.confirmation_sent_at && (
                  <div>Confirmation Sent: <span className="text-foreground">
                    {safeFormatDate(reservation.confirmation_sent_at, 'PPp')}
                  </span></div>
                )}
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
                    {safeFormatDate(reservation.checkIn, 'PPP')} - {safeFormatDate(reservation.checkOut, 'PPP')}
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
                <div className="text-2xl font-bold">{formatPrice(reservation.total_amount || 0)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                {reservation.payment_due_date && (
                  <div className="text-xs text-orange-600">
                    Payment due: {safeFormatDate(reservation.payment_due_date, 'PPP')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          {(reservation.deposit_amount || reservation.balance_due) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>{formatPrice(reservation.total_amount || 0)}</span>
                  </div>
                  {reservation.deposit_amount && reservation.deposit_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Deposit Paid:</span>
                      <span className="text-green-600">{formatPrice(reservation.deposit_amount)}</span>
                    </div>
                  )}
                  {reservation.balance_due && reservation.balance_due > 0 && (
                    <div className="flex justify-between font-semibold">
                      <span>Balance Due:</span>
                      <span className="text-orange-600">{formatPrice(reservation.balance_due)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.invoice_type} • {safeFormatDate(invoice.created_at, 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(invoice.total_amount)}</div>
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                        {safeFormatDate(note.date, 'MMM dd, HH:mm')}
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
              <Button size="sm" onClick={handleCheckIn}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Check In
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Modify Reservation
              </Button>
            </>
          )}
          
          {reservation.status === 'checked_in' && (
            <>
              <Button size="sm" onClick={handleCheckOut}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Check Out
              </Button>
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-1" />
                Add Charges
              </Button>
            </>
          )}
          
          {reservation.status === 'pending' && (
            <>
              <Button size="sm" onClick={handleConfirmReservation}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm Reservation
              </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPaymentDialog(true)}>
            <CreditCard className="h-4 w-4 mr-1" />
            Manage Payment
          </Button>
            </>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendConfirmation('confirmation')}
            disabled={sendingEmail}
          >
            <Send className="h-4 w-4 mr-1" />
            Send Confirmation
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendConfirmation('invoice')}
            disabled={sendingEmail}
          >
            <Mail className="h-4 w-4 mr-1" />
            Send Invoice
          </Button>
          
          <Button variant="outline" size="sm" onClick={handlePrintConfirmation}>
            <Printer className="h-4 w-4 mr-1" />
            Print Confirmation
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(true)}>
            <MessageSquare className="h-4 w-4 mr-1" />
            Add Note
          </Button>
          
          {['confirmed', 'pending'].includes(reservation.status) && (
            <Button variant="destructive" size="sm" onClick={handleCancelReservation}>
              Cancel Reservation
            </Button>
          )}
        </div>

        {/* Payment Management - simplified for now */}
        {showPaymentDialog && (
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Payment Management</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p>Payment management interface coming soon...</p>
                <Button onClick={() => setShowPaymentDialog(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {showNoteDialog && (
          <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Note</DialogTitle>
                <DialogDescription>
                  Add a note to this reservation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  placeholder="Enter your note here..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote} disabled={!note.trim()}>
                    Add Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}