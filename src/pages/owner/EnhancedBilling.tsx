import { EnhancedBillingInterface } from '@/components/owner/EnhancedBillingInterface';

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
    </div>
  );
}