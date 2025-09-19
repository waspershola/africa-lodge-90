import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PricingControls from "@/components/owner/financials/PricingControls";
import PricingApprovalQueue from "@/components/owner/financials/PricingApprovalQueue";
import RevenueAnalytics from "@/components/owner/financials/RevenueAnalytics";
import PaymentSettings from "@/components/owner/financials/PaymentSettings";
import CurrencyTaxSettings from "@/components/owner/financials/CurrencyTaxSettings";
import PaymentMethodsConfig from "@/components/owner/financials/PaymentMethodsConfig";
import GuestDebtTracker from "@/components/owner/billing/GuestDebtTracker";
import { PricingChange, DelegationRule } from "@/types/pricing";
import { toast } from "@/components/ui/use-toast";

export default function Financials() {
  // Mock data for pricing changes from managers
  const mockPendingChanges: PricingChange[] = [
    {
      id: '1',
      serviceType: 'room-service',
      itemName: 'Premium Steak Dinner',
      currentPrice: 12000,
      proposedPrice: 14500,
      changePercentage: 20.8,
      changeAmount: 2500,
      reason: 'Increased cost of imported beef and seasonal demand surge',
      requestedBy: 'Manager Ahmed',
      requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      status: 'pending',
      effectiveDate: '2024-01-16',
      hotelId: 'hotel1'
    },
    {
      id: '2',
      serviceType: 'housekeeping',
      itemName: 'Express Laundry Service',
      currentPrice: 2500,
      proposedPrice: 3000,
      changePercentage: 20,
      changeAmount: 500,
      reason: 'Equipment maintenance costs and increased demand',
      requestedBy: 'Manager Sarah',
      requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      status: 'pending',
      effectiveDate: '2024-01-15',
      hotelId: 'hotel1'
    }
  ];

  const mockDelegationRules: DelegationRule[] = [];

  const handleApprove = (changeId: string) => {
    toast({
      title: "Price Change Approved",
      description: "The pricing change has been approved and will take effect immediately.",
    });
  };

  const handleReject = (changeId: string, reason: string) => {
    toast({
      title: "Price Change Rejected",
      description: "The manager has been notified of the rejection.",
    });
  };

  const handleUpdateDelegationRules = (rules: DelegationRule[]) => {
    toast({
      title: "Delegation Rules Updated",
      description: "Manager pricing authorities have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Financials & Pricing</h1>
        <p className="text-muted-foreground">Manage room rates, revenue analytics, and payment configurations.</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="approvals">Manager Approvals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <PricingControls />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <PricingApprovalQueue
            pendingChanges={mockPendingChanges}
            delegationRules={mockDelegationRules}
            onApprove={handleApprove}
            onReject={handleReject}
            onUpdateDelegationRules={handleUpdateDelegationRules}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <RevenueAnalytics />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <PaymentMethodsConfig />
        </TabsContent>

        <TabsContent value="debts" className="space-y-6">
          <GuestDebtTracker />
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <CurrencyTaxSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}