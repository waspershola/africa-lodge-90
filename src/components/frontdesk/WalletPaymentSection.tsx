import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { useGuestWallet } from '@/hooks/useGuestWallet';
import { useState } from 'react';

interface WalletPaymentSectionProps {
  guestId: string;
  amount: number;
  onPaymentSuccess: () => void;
  folioId: string;
  reservationId?: string;
}

export function WalletPaymentSection({
  guestId,
  amount,
  onPaymentSuccess,
  folioId,
  reservationId
}: WalletPaymentSectionProps) {
  const { wallet, walletLoading, payFromWallet } = useGuestWallet(guestId);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasInsufficientFunds = wallet ? wallet.balance < amount : true;

  const handleWalletPayment = async () => {
    if (!wallet || hasInsufficientFunds) return;

    setIsProcessing(true);
    try {
      await payFromWallet({
        amount,
        description: `Payment for folio ${folioId}`,
        referenceType: 'folio',
        referenceId: folioId
      });
      onPaymentSuccess();
    } catch (error) {
      console.error('Wallet payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (walletLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="font-medium">Guest Wallet</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="font-bold text-lg">
              ₦{wallet?.balance.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {hasInsufficientFunds ? (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Insufficient Funds</p>
              <p className="text-muted-foreground">
                Guest needs ₦{(amount - (wallet?.balance || 0)).toFixed(2)} more in their wallet
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-success mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-success">Sufficient Balance</p>
              <p className="text-muted-foreground">
                ₦{(wallet.balance - amount).toFixed(2)} will remain after payment
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleWalletPayment}
          disabled={hasInsufficientFunds || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : `Pay ₦${amount.toFixed(2)} from Wallet`}
        </Button>
      </CardContent>
    </Card>
  );
}
