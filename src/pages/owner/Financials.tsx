import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PricingControls from "@/components/owner/financials/PricingControls";
import RevenueAnalytics from "@/components/owner/financials/RevenueAnalytics";
import PaymentSettings from "@/components/owner/financials/PaymentSettings";

export default function Financials() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Financials & Pricing</h1>
        <p className="text-muted-foreground">Manage room rates, revenue analytics, and payment configurations.</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">Pricing Controls</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payment Settings</TabsTrigger>
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
      </Tabs>
    </div>
  );
}