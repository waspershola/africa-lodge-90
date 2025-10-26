import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, Eye, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface GuestBookingHistoryProps {
  guestId: string;
  onViewReservation?: (reservationId: string) => void;
  onViewBill?: (billId: string) => void;
}

export default function GuestBookingHistory({ guestId, onViewReservation, onViewBill }: GuestBookingHistoryProps) {
  const { tenant } = useAuth();
  
  // Fetch real booking history from reservations
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['guest-reservations', guestId],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_number,
          check_in_date,
          check_out_date,
          total_amount,
          status,
          room:rooms (
            room_number,
            room_type:room_types (
              name
            )
          ),
          folio:folios (
            id,
            balance
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('guest_id', guestId)
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.tenant_id && !!guestId,
  });

  const bookingHistory = reservations.map((res: any) => {
    const checkIn = new Date(res.check_in_date);
    const checkOut = new Date(res.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const balance = res.folio?.[0]?.balance || 0;
    
    return {
      id: res.id,
      roomNumber: res.room?.room_number || 'N/A',
      roomType: res.room?.room_type?.name || 'Unknown',
      checkIn,
      checkOut,
      nights,
      totalAmount: res.total_amount || 0,
      status: res.status,
      billId: res.folio?.[0]?.id,
      billStatus: balance === 0 ? 'paid' : balance > 0 ? 'outstanding' : 'paid',
    };
  });

  if (isLoading) {
    return (
      <Card className="luxury-card">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading booking history...</div>
        </CardContent>
      </Card>
    );
  }

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