import { EnhancedBillingInterface } from '@/components/owner/EnhancedBillingInterface';
import { AddonMarketplace } from '@/components/owner/billing/AddonMarketplace';
import { SMSCreditsManager } from '@/components/owner/billing/SMSCreditsManager';

export default function EnhancedBilling() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view billing history, and upgrade your plan
        </p>
      </div>
      
      <EnhancedBillingInterface />

      {/* Add-on Marketplace */}
      <div className="mt-8">
        <AddonMarketplace />
      </div>

      {/* SMS Credits Manager */}
      <div className="mt-8">
        <SMSCreditsManager />
      </div>
    </div>
  );
}