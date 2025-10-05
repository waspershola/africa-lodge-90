import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGuestWallet } from '@/hooks/useGuestWallet';
import { format } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WalletTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestId: string;
  guestName: string;
}

export function WalletTransactionsDialog({
  open,
  onOpenChange,
  guestId,
  guestName
}: WalletTransactionsDialogProps) {
  const { transactions, transactionsLoading } = useGuestWallet(guestId);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'payment':
      case 'withdrawal':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-green-600';
      case 'payment':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Wallet Transactions - {guestName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {transactionsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">
                      {transaction.transaction_type}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {transaction.description}
                    </p>
                    {transaction.payment_method && (
                      <p className="text-xs text-muted-foreground mt-1">
                        via {transaction.payment_method}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(transaction.created_at), 'PPp')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${getAmountColor(transaction.transaction_type)}`}>
                      {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Balance: ₦{transaction.balance_after.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
