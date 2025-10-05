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
import { useBillingData } from '@/hooks/data/useBillingData';

interface RecordPaymentDialogProps {
  bill: any;
  onClose: () => void;
}

export default function RecordPaymentDialog({ bill, onClose }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const { recordPayment } = useBillingData();
  const [paymentData, setPaymentData] = useState({
    amount: bill.balance || bill.balancedue || 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.paymentMethod || paymentData.amount <= 0) {
      toast({
        title: 'Invalid Payment',
        description: 'Please select a payment method and enter a valid amount.',
        variant: 'destructive'
      });
      return;
    }

    const balance = bill.balance || bill.balancedue || 0;
    const isOverpayment = paymentData.amount > balance;
    
    if (isOverpayment && !confirm(`This payment of ₦${paymentData.amount.toLocaleString()} exceeds the balance due of ₦${balance.toLocaleString()}. Continue?`)) {
      return;
    }

    try {
      await recordPayment.mutateAsync({
        folioId: bill.id,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
      });

      onClose();
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const generateReference = () => {
    const method = paymentData.paymentMethod.toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const ref = `${method}${timestamp}`;
    setPaymentData({...paymentData, reference: ref});
  };

  const calculateNewBalance = () => {
    const balance = bill.balance || bill.balancedue || 0;
    return Math.max(0, balance - paymentData.amount);
  };

  const calculateCreditAmount = () => {
    const balance = bill.balance || bill.balancedue || 0;
    return Math.max(0, paymentData.amount - balance);
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
                <span className="font-medium">{bill.guest_name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-medium">{bill.room_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Charges:</span>
                <span className="font-medium">₦{(bill.total_charges || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium text-success">₦{(bill.total_payments || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Balance Due:</span>
                <span className="text-danger">₦{Math.abs(bill.balance || 0).toLocaleString()}</span>
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
                  onClick={() => setPaymentData({...paymentData, amount: bill.balance || bill.balancedue || 0})}
                >
                  Full
                </Button>
              </div>
              {paymentData.amount > (bill.balance || bill.balancedue || 0) && (
                <div className="flex items-center gap-2 text-warning text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Overpayment of ₦{calculateCreditAmount().toLocaleString()}
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
              <Button 
                type="submit" 
                className="flex-1"
                disabled={recordPayment.isPending}
              >
                {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}