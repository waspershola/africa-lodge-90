import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GuestBill, ServiceCharge } from '@/types/billing';
import { TaxBreakdownDisplay } from './TaxBreakdownDisplay';
import { TaxBreakdownItem } from '@/lib/tax-calculator';
import { 
  Bed, 
  UtensilsCrossed, 
  Sparkles, 
  Wrench, 
  PartyPopper,
  DollarSign
} from 'lucide-react';

interface BillingOverviewProps {
  bill: GuestBill;
}

const getServiceIcon = (type: ServiceCharge['service_type']) => {
  switch (type) {
    case 'room':
      return <Bed className="h-4 w-4" />;
    case 'restaurant':
      return <UtensilsCrossed className="h-4 w-4" />;
    case 'housekeeping':
      return <Sparkles className="h-4 w-4" />;
    case 'maintenance':
      return <Wrench className="h-4 w-4" />;
    case 'events':
      return <PartyPopper className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

const getServiceLabel = (type: ServiceCharge['service_type']) => {
  switch (type) {
    case 'room':
      return 'Room Charges';
    case 'restaurant':
      return 'Restaurant/POS';
    case 'housekeeping':
      return 'Housekeeping';
    case 'maintenance':
      return 'Maintenance';
    case 'events':
      return 'Events/Packages';
    default:
      return 'Other';
  }
};

export const BillingOverview = ({ bill }: BillingOverviewProps) => {
  // Group charges by service type and extract tax breakdown
  const serviceGroups = bill.service_charges.reduce((acc, charge) => {
    if (!acc[charge.service_type]) {
      acc[charge.service_type] = {
        total: 0,
        pending: 0,
        charges: [],
        baseAmount: 0,
        vatAmount: 0,
        serviceChargeAmount: 0
      };
    }
    acc[charge.service_type].total += charge.amount;
    // @ts-ignore - these properties might not exist on old charges
    const baseAmount = charge.base_amount ?? 0;
    const vatAmount = charge.vat_amount ?? 0;
    const serviceChargeAmount = charge.service_charge_amount ?? 0;
    
    // For legacy charges without breakdown, treat entire amount as base
    if (baseAmount === 0 && vatAmount === 0 && serviceChargeAmount === 0) {
      acc[charge.service_type].baseAmount += charge.amount;
    } else {
      acc[charge.service_type].baseAmount += baseAmount;
      acc[charge.service_type].vatAmount += vatAmount;
      acc[charge.service_type].serviceChargeAmount += serviceChargeAmount;
    }
    
    if (charge.status === 'pending') {
      acc[charge.service_type].pending += charge.amount;
    }
    acc[charge.service_type].charges.push(charge);
    return acc;
  }, {} as Record<string, { 
    total: number; 
    pending: number; 
    charges: ServiceCharge[];
    baseAmount: number;
    vatAmount: number;
    serviceChargeAmount: number;
  }>);

  // Build overall tax breakdown
  const totalBaseAmount = Object.values(serviceGroups).reduce((sum, group) => sum + group.baseAmount, 0);
  const totalVatAmount = Object.values(serviceGroups).reduce((sum, group) => sum + group.vatAmount, 0);
  const totalServiceChargeAmount = Object.values(serviceGroups).reduce((sum, group) => sum + group.serviceChargeAmount, 0);

  const taxBreakdown: TaxBreakdownItem[] = [
    { type: 'base', label: 'Subtotal', amount: totalBaseAmount }
  ];

  if (totalVatAmount > 0) {
    taxBreakdown.push({
      type: 'vat',
      label: 'VAT',
      amount: totalVatAmount
    });
  }

  if (totalServiceChargeAmount > 0) {
    taxBreakdown.push({
      type: 'service',
      label: 'Service Charge',
      amount: totalServiceChargeAmount
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Guest Billing Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Breakdown */}
        <div className="grid gap-3">
          {Object.entries(serviceGroups).map(([serviceType, group]) => (
            <div 
              key={serviceType}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                {getServiceIcon(serviceType as ServiceCharge['service_type'])}
                <div>
                  <p className="font-medium">
                    {getServiceLabel(serviceType as ServiceCharge['service_type'])}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {group.charges.length} item(s)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ₦{group.total.toLocaleString()}
                </p>
                {group.pending > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    ₦{group.pending.toLocaleString()} pending
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <Separator className="my-4" />
        
        <TaxBreakdownDisplay
          breakdown={taxBreakdown}
          totalAmount={bill.total_amount}
          currency="NGN"
          showZeroRates={false}
        />
        
        {/* PHASE 1: Fixed display logic for overpayment */}
        {bill.payment_status === 'overpaid' && (
          <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t mt-2">
            <span>Credit Balance:</span>
            <span>₦{Math.abs(bill.total_amount - bill.pending_balance).toLocaleString()}</span>
          </div>
        )}
        {bill.pending_balance > 0 && bill.payment_status !== 'overpaid' && (
          <div className="flex justify-between text-lg font-bold text-destructive pt-2 border-t mt-2">
            <span>Pending Balance:</span>
            <span>₦{bill.pending_balance.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};