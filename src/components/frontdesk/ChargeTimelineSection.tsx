import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFolioCalculation } from "@/hooks/useFolioCalculation";
import { useBillingData } from "@/hooks/data/useBillingData";
import { usePaymentHistory } from "@/hooks/data/usePaymentHistory";
import { Receipt, CreditCard, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ChargeTimelineSectionProps {
  folioId: string;
}

export function ChargeTimelineSection({ folioId }: ChargeTimelineSectionProps) {
  const { data: folioData, isLoading: folioLoading } = useFolioCalculation(folioId);
  const { useFolioCharges } = useBillingData();
  const { data: charges, isLoading: chargesLoading } = useFolioCharges(folioId);
  const { data: payments, isLoading: paymentsLoading } = usePaymentHistory(folioId);

  const isLoading = folioLoading || paymentsLoading || chargesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!folioData && !payments?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No transactions available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Combine charges and payments into a single timeline
  const timeline: Array<{
    id: string;
    type: 'charge' | 'payment';
    date: string;
    description: string;
    amount: number;
    balance?: number;
    status?: string;
  }> = [];

  // Add charges
  charges?.forEach((charge) => {
    timeline.push({
      id: charge.id,
      type: 'charge',
      date: charge.created_at,
      description: charge.description,
      amount: charge.amount,
    });
  });

  // Add payments
  payments?.forEach((payment) => {
    timeline.push({
      id: payment.id,
      type: 'payment',
      date: payment.created_at,
      description: `${payment.payment_method.replace('_', ' ')} Payment`,
      amount: payment.amount,
      status: payment.status,
    });
  });

  // Sort by date (most recent first)
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate running balance
  const initialBalance = (folioData?.balance as number) || 0;
  let runningBalance = initialBalance;
  timeline.forEach((item) => {
    if (item.type === 'payment' && item.status === 'completed') {
      runningBalance += item.amount;
      item.balance = runningBalance;
    } else if (item.type === 'charge') {
      item.balance = runningBalance;
      runningBalance -= item.amount;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transaction Timeline
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Current Balance: <span className="font-semibold text-foreground">₦{((folioData?.balance as number) || 0).toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

          {timeline.map((item, index) => (
            <div key={item.id} className="relative flex items-start gap-4 pb-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  item.type === 'charge'
                    ? 'bg-blue-50 border-blue-500'
                    : item.status === 'completed'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                {item.type === 'charge' ? (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <CreditCard className="h-4 w-4 text-green-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'charge' ? 'Charge' : 'Payment'}
                      </Badge>
                      {item.status && item.status !== 'completed' && (
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.date), 'MMM dd, yyyy • hh:mm a')}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div
                      className={`font-semibold ${
                        item.type === 'charge' ? 'text-blue-600' : 'text-green-600'
                      }`}
                    >
                      {item.type === 'charge' ? '+' : '-'}₦{item.amount.toLocaleString()}
                    </div>
                    {item.balance !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Balance: ₦{item.balance.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
