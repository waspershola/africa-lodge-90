import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface OverdueReservation {
  id: string;
  reservation_number: string;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  total_amount: number;
  payment_status: string;
  days_overdue: number;
}

export function PaymentReminderSystem() {
  const [overdueReservations, setOverdueReservations] = useState<OverdueReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchOverdueReservations();
    // Set up interval to check for overdue payments every hour
    const interval = setInterval(fetchOverdueReservations, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverdueReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('payment_status', 'overdue')
        .gte('check_in_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const overdueWithDays = data.map(reservation => ({
        ...reservation,
        days_overdue: Math.floor(
          (new Date().getTime() - new Date(reservation.check_in_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        )
      }));

      setOverdueReservations(overdueWithDays);
    } catch (error) {
      console.error('Error fetching overdue reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentReminder = async (reservationId: string) => {
    setSendingReminders(prev => [...prev, reservationId]);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-reservation-email', {
        body: {
          reservationId: reservationId,
          type: 'reminder'
        }
      });

      if (error) throw error;

      // Email sent successfully - no need to update reservation

      toast({
        title: "Reminder Sent",
        description: "Payment reminder email has been sent successfully"
      });

      // Refresh the list
      fetchOverdueReservations();

    } catch (error) {
      console.error('Error sending payment reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send payment reminder",
        variant: "destructive"
      });
    } finally {
      setSendingReminders(prev => prev.filter(id => id !== reservationId));
    }
  };

  const sendBulkReminders = async () => {
    const elegibleReservations = overdueReservations.filter(
      res => res.days_overdue > 1 // Only send if more than 1 day overdue
    );

    for (const reservation of elegibleReservations) {
      await sendPaymentReminder(reservation.id);
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading overdue payments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payment Reminders
            {overdueReservations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {overdueReservations.length}
              </Badge>
            )}
          </CardTitle>
          
          {overdueReservations.length > 0 && (
            <Button onClick={sendBulkReminders} size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Send All Reminders
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {overdueReservations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No overdue payments at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {overdueReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{reservation.guest_name}</h4>
                    <Badge variant="outline">
                      {reservation.reservation_number}
                    </Badge>
                    {reservation.days_overdue > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {reservation.days_overdue} days overdue
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Check-in: {new Date(reservation.check_in_date).toLocaleDateString()}</p>
                    <p>Amount: {reservation.total_amount}</p>
                    <p>Email: {reservation.guest_email}</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => sendPaymentReminder(reservation.id)}
                  disabled={sendingReminders.includes(reservation.id)}
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendingReminders.includes(reservation.id) ? 'Sending...' : 'Send Reminder'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}