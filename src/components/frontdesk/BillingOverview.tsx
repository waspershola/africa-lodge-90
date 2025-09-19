import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GuestBill, ServiceCharge } from '@/types/billing';
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
  // Group charges by service type
  const serviceGroups = bill.service_charges.reduce((acc, charge) => {
    if (!acc[charge.service_type]) {
      acc[charge.service_type] = {
        total: 0,
        pending: 0,
        charges: []
      };
    }
    acc[charge.service_type].total += charge.amount;
    if (charge.status === 'pending') {
      acc[charge.service_type].pending += charge.amount;
    }
    acc[charge.service_type].charges.push(charge);
    return acc;
  }, {} as Record<string, { total: number; pending: number; charges: ServiceCharge[] }>);

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
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>₦{bill.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (10%):</span>
            <span>₦{bill.tax_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total Amount:</span>
            <span>₦{bill.total_amount.toLocaleString()}</span>
          </div>
          {bill.pending_balance > 0 && (
            <div className="flex justify-between text-lg font-bold text-destructive">
              <span>Pending Balance:</span>
              <span>₦{bill.pending_balance.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};