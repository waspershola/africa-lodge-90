// Phase 4: Guest Wallet Tab for Guest Profile
import { WalletBalanceCard } from './WalletBalanceCard';
import { WalletTransactionsDialog } from './WalletTransactionsDialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';

interface GuestWalletTabProps {
  guestId: string;
  guestName: string;
}

export function GuestWalletTab({ guestId, guestName }: GuestWalletTabProps) {
  const [showTransactions, setShowTransactions] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Guest Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Manage {guestName}'s wallet balance and transaction history
        </p>
      </div>

      <WalletBalanceCard guestId={guestId} guestName={guestName} />

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowTransactions(true)}
      >
        <History className="h-4 w-4 mr-2" />
        View Full Transaction History
      </Button>

      <WalletTransactionsDialog
        open={showTransactions}
        onOpenChange={setShowTransactions}
        guestId={guestId}
        guestName={guestName}
      />
    </div>
  );
}
