import { useState } from 'react';
import { 
  User, 
  Calendar, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Trash2, 
  RefreshCw,
  BedDouble,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateReservation, useCancelReservation, useRefundReservation } from '@/hooks/useApi';
import { formatDistanceToNow, format } from 'date-fns';

interface ReservationDetailDrawerProps {
  reservation: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReservationDetailDrawer({ 
  reservation, 
  open, 
  onOpenChange 
}: ReservationDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(reservation?.notes || '');
  const [roomAssignment, setRoomAssignment] = useState(reservation?.room || '');

  const updateReservation = useUpdateReservation();
  const cancelReservation = useCancelReservation();
  const refundReservation = useRefundReservation();

  if (!reservation) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'checked-in': return 'bg-primary/10 text-primary border-primary/20';
      case 'checked-out': return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'cancelled': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'checked-in': return <BedDouble className="h-4 w-4" />;
      case 'checked-out': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleSaveChanges = async () => {
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        data: { notes, room: roomAssignment }
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await cancelReservation.mutateAsync(reservation.id);
        onOpenChange(false);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleRefund = async () => {
    if (confirm('Process refund for this reservation?')) {
      try {
        await refundReservation.mutateAsync(reservation.id);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const nights = Math.ceil(
    (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) 
    / (1000 * 60 * 60 * 24)
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DrawerTitle className="text-xl">
                Reservation #{reservation.id?.slice(-8)}
              </DrawerTitle>
              <Badge className={getStatusColor(reservation.status)}>
                {getStatusIcon(reservation.status)}
                <span className="ml-1 capitalize">{reservation.status}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={updateReservation.isPending}
                >
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </DrawerHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{reservation.guestName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{reservation.guestEmail || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{reservation.guestPhone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{reservation.guestAddress || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Check-in Date</Label>
                  <p className="font-medium">
                    {format(new Date(reservation.checkIn), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(reservation.checkIn), { addSuffix: true })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Check-out Date</Label>
                  <p className="font-medium">
                    {format(new Date(reservation.checkOut), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">{nights} nights</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Room Assignment</Label>
                  {isEditing ? (
                    <Select value={roomAssignment} onValueChange={setRoomAssignment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Mock available rooms */}
                        {['101', '102', '103', '201', '202', '203'].map(room => (
                          <SelectItem key={room} value={room}>
                            Room {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">Room {reservation.room}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Guests</Label>
                  <p className="font-medium">{reservation.guests || 2} guests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-bold">₦{(reservation.totalAmount || 150000).toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Paid Amount</Label>
                  <p className="text-lg font-medium text-success">
                    ₦{(reservation.paidAmount || 75000).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Balance</Label>
                  <p className="text-lg font-medium text-warning">
                    ₦{((reservation.totalAmount || 150000) - (reservation.paidAmount || 75000)).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                <p className="capitalize">{reservation.paymentMethod || 'Cash'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this reservation..."
                  className="min-h-24"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {notes || 'No notes added'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isEditing && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reassign Room
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRefund}
                  disabled={refundReservation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancel}
                  disabled={cancelReservation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}