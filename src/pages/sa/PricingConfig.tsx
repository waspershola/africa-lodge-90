import { PricingConfigManager } from '@/components/sa/PricingConfigManager';

export default function PricingConfig() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold display-heading text-gradient">Pricing Configuration</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage pricing plans and trial settings for the platform
        </p>
      </div>
      
      <PricingConfigManager />
    </div>
  );
}