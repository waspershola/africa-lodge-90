import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxBreakdownCardProps {
  baseAmount: number;
  serviceChargeRate: number;
  vatRate: number;
  nights?: number;
  className?: string;
}

export function TaxBreakdownCard({ 
  baseAmount, 
  serviceChargeRate, 
  vatRate,
  nights = 1,
  className 
}: TaxBreakdownCardProps) {
  const serviceCharge = baseAmount * (serviceChargeRate / 100);
  const subtotal = baseAmount + serviceCharge;
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <Calculator className="h-4 w-4 text-primary" />
          Payment Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Base Amount {nights > 1 && `(${nights} nights)`}
          </span>
          <span className="font-medium">₦{baseAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service Charge ({serviceChargeRate}%)</span>
          <span className="font-medium">₦{serviceCharge.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">VAT ({vatRate}%)</span>
          <span className="font-medium">₦{vat.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-semibold text-base">
          <span>TOTAL DUE</span>
          <span className="text-primary">₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is the full amount guest must pay (including all taxes and charges)
        </p>
      </CardContent>
    </Card>
  );
}
