import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { useGuestWallet } from '@/hooks/useGuestWallet';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface WalletDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestId: string;
  guestName: string;
}

export function WalletDepositDialog({ 
  open, 
  onOpenChange, 
  guestId,
  guestName 
}: WalletDepositDialogProps) {
  const { enabledMethods } = usePaymentMethodsContext();
  const { wallet, depositToWallet } = useGuestWallet(guestId);
  
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filter out credit payment methods for deposits
  const depositMethods = enabledMethods.filter(m => 
    m.type !== 'credit'
  );

  const handleDeposit = async () => {
    if (!amount || !selectedMethodId) {
      toast.error('Please enter amount and select payment method');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const method = depositMethods.find(m => m.id === selectedMethodId);
    if (!method) {
      toast.error('Invalid payment method');
      return;
    }

    setProcessing(true);
    try {
      await depositToWallet({
        amount: amountNum,
        paymentMethod: method.name,
        paymentMethodId: method.id,
        description: `Wallet deposit for ${guestName} via ${method.name}`
      });
      
      toast.success(`₦${amountNum.toFixed(2)} deposited to wallet`);
      setAmount('');
      setSelectedMethodId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Deposit to Wallet - {guestName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {wallet && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">₦{wallet.balance.toFixed(2)}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {depositMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={processing || !amount || !selectedMethodId}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Deposit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
