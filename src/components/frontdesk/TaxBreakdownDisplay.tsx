import { Card, CardContent } from "@/components/ui/card";
import { TaxBreakdownItem, formatCurrency } from "@/lib/tax-calculator";
import { Separator } from "@/components/ui/separator";

interface TaxBreakdownDisplayProps {
  breakdown: TaxBreakdownItem[];
  totalAmount: number;
  currency?: string;
  showZeroRates?: boolean;
  className?: string;
}

export function TaxBreakdownDisplay({
  breakdown,
  totalAmount,
  currency = 'NGN',
  showZeroRates = false,
  className = ""
}: TaxBreakdownDisplayProps) {
  // Filter out zero amounts if showZeroRates is false
  const displayItems = showZeroRates 
    ? breakdown 
    : breakdown.filter(item => item.amount > 0);

  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-3">
        {displayItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className={item.type === 'base' ? 'font-medium' : 'text-muted-foreground text-sm'}>
              {item.label}
            </span>
            <span className={item.type === 'base' ? 'font-medium' : 'text-sm'}>
              {formatCurrency(item.amount, currency)}
            </span>
          </div>
        ))}
        
        {displayItems.length > 1 && (
          <>
            <Separator className="my-2" />
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
