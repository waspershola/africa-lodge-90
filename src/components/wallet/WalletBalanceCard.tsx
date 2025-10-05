import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, History } from 'lucide-react';
import { useState } from 'react';
import { WalletDepositDialog } from './WalletDepositDialog';
import { WalletTransactionsDialog } from './WalletTransactionsDialog';
import { useGuestWallet } from '@/hooks/useGuestWallet';

interface WalletBalanceCardProps {
  guestId: string;
  guestName: string;
}

export function WalletBalanceCard({ guestId, guestName }: WalletBalanceCardProps) {
  const { wallet, walletLoading } = useGuestWallet(guestId);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);

  if (walletLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Guest Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-3xl font-bold">
              ₦{wallet?.balance.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setDepositDialogOpen(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Deposit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTransactionsDialogOpen(true)}
              className="flex-1"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>
        </CardContent>
      </Card>

      <WalletDepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        guestId={guestId}
        guestName={guestName}
      />

      <WalletTransactionsDialog
        open={transactionsDialogOpen}
        onOpenChange={setTransactionsDialogOpen}
        guestId={guestId}
        guestName={guestName}
      />
    </>
  );
}
