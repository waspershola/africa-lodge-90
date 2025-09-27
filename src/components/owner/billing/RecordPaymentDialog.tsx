import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calculator, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecordPaymentDialogProps {
  bill: any;
  onClose: () => void;
}

export default function RecordPaymentDialog({ bill, onClose }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState({
    amount: bill.balancedue,
    paymentMethod: '',
    reference: '',
    notes: ''
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'pos', label: 'POS Terminal', icon: '📱' },
    { value: 'wallet', label: 'Digital Wallet', icon: '📲' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.paymentMethod || paymentData.amount <= 0) {
      toast({
        title: 'Invalid Payment',
        description: 'Please select a payment method and enter a valid amount.',
        variant: 'destructive'
      });
      return;
    }

    // Check for overpayment
    const isOverpayment = paymentData.amount > bill.balancedue;
    
    if (isOverpayment && !confirm(`This payment of ₦${paymentData.amount.toLocaleString()} exceeds the balance due of ₦${bill.balancedue.toLocaleString()}. The overpayment of ₦${(paymentData.amount - bill.balancedue).toLocaleString()} will be added to the guest's credit balance. Continue?`)) {
      return;
    }

    // Here you would normally process the payment in your backend
    console.log('Recording payment:', {
      billId: bill.id,
      payment: paymentData,
      isOverpayment,
      creditAmount: isOverpayment ? paymentData.amount - bill.balancedue : 0
    });

    toast({
      title: 'Payment Recorded',
      description: `Payment of ₦${paymentData.amount.toLocaleString()} recorded successfully${
        isOverpayment ? ` with ₦${(paymentData.amount - bill.balancedue).toLocaleString()} credit added to guest profile.` : '.'
      }`,
      variant: 'default'
    });

    onClose();
  };

  const generateReference = () => {
    const method = paymentData.paymentMethod.toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const ref = `${method}${timestamp}`;
    setPaymentData({...paymentData, reference: ref});
  };

  const calculateNewBalance = () => {
    return Math.max(0, bill.balancedue - paymentData.amount);
  };

  const calculateCreditAmount = () => {
    return Math.max(0, paymentData.amount - bill.balancedue);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Record Payment - {bill.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Guest:</span>
                <span className="font-medium">{bill.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-medium">{bill.room}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">₦{bill.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium text-success">₦{bill.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Balance Due:</span>
                <span className="text-danger">₦{bill.balancedue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (₦) *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                  onClick={() => setPaymentData({...paymentData, amount: bill.balancedue})}
                >
                  Full
                </Button>
              </div>
              {paymentData.amount > bill.balancedue && (
                <div className="flex items-center gap-2 text-warning text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Overpayment of ₦{calculateCreditAmount().toLocaleString()} will be credited to guest
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select 
                value={paymentData.paymentMethod} 
                onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      <span className="flex items-center gap-2">
                        <span>{method.icon}</span>
                        {method.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference</Label>
              <div className="flex gap-2">
                <Input
                  id="reference"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                  placeholder="Transaction ID, check number, etc."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateReference}
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                placeholder="Additional notes about this payment..."
                rows={2}
              />
            </div>

            {/* Payment Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Payment Summary:
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-medium">₦{paymentData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Balance:</span>
                  <span className={`font-medium ${
                    calculateNewBalance() === 0 ? 'text-success' : 'text-warning'
                  }`}>
                    ₦{calculateNewBalance().toLocaleString()}
                  </span>
                </div>
                {calculateCreditAmount() > 0 && (
                  <div className="flex justify-between">
                    <span>Credit to Guest:</span>
                    <span className="font-medium text-success">₦{calculateCreditAmount().toLocaleString()}</span>
                  </div>
                )}
              </div>
              {calculateNewBalance() === 0 && (
                <Badge className="mt-2 bg-success text-success-foreground">
                  Bill will be marked as PAID
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Record Payment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}