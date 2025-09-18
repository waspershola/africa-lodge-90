import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PricingControls from "@/components/owner/financials/PricingControls";
import RevenueAnalytics from "@/components/owner/financials/RevenueAnalytics";
import PaymentSettings from "@/components/owner/financials/PaymentSettings";
import CurrencyTaxSettings from "@/components/owner/financials/CurrencyTaxSettings";
import PaymentMethodsConfig from "@/components/owner/financials/PaymentMethodsConfig";
import GuestDebtTracker from "@/components/owner/billing/GuestDebtTracker";

export default function Financials() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Financials & Pricing</h1>
        <p className="text-muted-foreground">Manage room rates, revenue analytics, and payment configurations.</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="debts">Debts</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <PricingControls />
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