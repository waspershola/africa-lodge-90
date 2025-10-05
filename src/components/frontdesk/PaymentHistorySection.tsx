import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentHistory } from "@/hooks/data/usePaymentHistory";
import { CheckCircle, Clock, XCircle, CreditCard, MapPin, Monitor } from "lucide-react";
import { format } from "date-fns";

interface PaymentHistorySectionProps {
  folioId: string;
}

export function PaymentHistorySection({ folioId }: PaymentHistorySectionProps) {
  const { data: payments, isLoading, error } = usePaymentHistory(folioId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load payment history</p>
        </CardContent>
      </Card>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Total Paid: <span className="font-semibold text-foreground">₦{totalPaid.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                {payment.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : payment.status === 'pending' ? (
                  <Clock className="h-4 w-4 text-warning" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-medium">
                  {payment.payment_method.replace('_', ' ').toUpperCase()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {payment.status}
                </Badge>
                {payment.is_verified && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  {format(new Date(payment.created_at), 'MMM dd, yyyy • hh:mm a')}
                </div>
                {payment.processor_name && (
                  <div className="flex items-center gap-1">
                    Processed by: {payment.processor_name}
                  </div>
                )}
                {payment.department_name && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {payment.department_name}
                  </div>
                )}
                {payment.terminal_name && (
                  <div className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    {payment.terminal_name}
                  </div>
                )}
                {payment.reference && (
                  <div className="text-xs font-mono">
                    Ref: {payment.reference}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-semibold text-lg">
                ₦{payment.amount.toLocaleString()}
              </div>
              {payment.fee_amount > 0 && (
                <div className="text-xs text-muted-foreground">
                  Fee: ₦{payment.fee_amount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
