import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useCurrency } from '@/hooks/useCurrency';
import { useToast } from '@/hooks/use-toast';

interface PaymentStatusDialogProps {
  open: boolean;
  onClose: () => void;
  reservation: {
    id: string;
    guest_name: string;
    total_amount: number;
    deposit_amount?: number;
    balance_due?: number;
    payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
  };
}

export default function PaymentStatusDialog({ open, onClose, reservation }: PaymentStatusDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  
  const { enabledMethods, getMethodIcon } = usePaymentMethods();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please enter payment amount and method",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would update the payment record
    toast({
      title: "Payment Recorded",
      description: `Payment of ${formatPrice(Number(paymentAmount))} recorded successfully`,
    });
    
    onClose();
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management - {reservation.guest_name}
          </DialogTitle>
          <DialogDescription>
            Record payments and manage payment status for this reservation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getStatusIcon(reservation.payment_status)}
                Payment Summary
                {getStatusBadge(reservation.payment_status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-xl font-bold">{formatPrice(reservation.total_amount)}</div>
              </div>
              
              {reservation.deposit_amount && (
                <div>
                  <div className="text-sm text-muted-foreground">Deposit Required</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatPrice(reservation.deposit_amount)}
                  </div>
                </div>
              )}
              
              {reservation.balance_due && (
                <div>
                  <div className="text-sm text-muted-foreground">Balance Due</div>
                  <div className="text-xl font-bold text-orange-600">
                    {formatPrice(reservation.balance_due)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Record Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Record New Payment</CardTitle>
              <CardDescription>
                Add a payment received for this reservation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(method.icon)}
                            {method.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference/Transaction ID</Label>
                <Input
                  id="reference"
                  placeholder="Transaction reference or receipt number"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional payment notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock payment history - in real implementation, fetch from API */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Deposit Payment</div>
                    <div className="text-sm text-muted-foreground">
                      Jan 15, 2024 • Credit Card
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(150000)}</div>
                    <Badge className="text-xs bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground py-4">
                  No additional payments recorded
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRecordPayment}>
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}