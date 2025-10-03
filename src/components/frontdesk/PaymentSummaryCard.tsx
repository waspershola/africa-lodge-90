import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaxBreakdownDisplay } from "./TaxBreakdownDisplay";
import { TaxBreakdownItem } from "@/lib/tax-calculator";

interface PaymentSummaryCardProps {
  totalCharges: number;
  totalPaid: number;
  balance: number;
  className?: string;
  taxBreakdown?: TaxBreakdownItem[];
  showBreakdown?: boolean;
}

export const PaymentSummaryCard = ({ 
  totalCharges, 
  totalPaid, 
  balance,
  className = "",
  taxBreakdown,
  showBreakdown = false
}: PaymentSummaryCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBalanceBadge = () => {
    // Phase 1 Fix: Proper handling of negative balances with tolerance
    if (Math.abs(balance) < 0.01) {
      return <Badge variant="default" className="bg-success text-success-foreground">Paid in Full</Badge>;
    } else if (balance > 0) {
      return <Badge variant="destructive">Outstanding</Badge>;
    } else {
      return <Badge variant="default" className="bg-success text-success-foreground">Overpaid</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showBreakdown && taxBreakdown && taxBreakdown.length > 0 ? (
          <TaxBreakdownDisplay
            breakdown={taxBreakdown}
            totalAmount={totalCharges}
            currency="NGN"
            showZeroRates={false}
            className="mb-4"
          />
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Charges:</span>
            <span className="font-medium">{formatCurrency(totalCharges)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount Paid:</span>
          <span className="font-medium text-success">{formatCurrency(totalPaid)}</span>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {balance < -0.01 ? 'Credit Available:' : 'Balance:'}
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${balance > 0.01 ? 'text-destructive' : balance < -0.01 ? 'text-success' : ''}`}>
                {formatCurrency(Math.abs(balance))}
              </span>
              {getBalanceBadge()}
            </div>
          </div>
        </div>

        {balance > 0.01 && (
          <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-warning">
              Guest has outstanding balance. Collect payment before check-out.
            </p>
          </div>
        )}

        {balance < -0.01 && (
          <div className="flex items-start gap-2 p-2 bg-success/10 border border-success/20 rounded-md">
            <DollarSign className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <p className="text-xs text-success">
              Credit balance of {formatCurrency(Math.abs(balance))} available for future use or refund.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
