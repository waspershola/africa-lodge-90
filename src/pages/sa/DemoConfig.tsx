import { DemoConfigManager } from '@/components/sa/DemoConfigManager';

export default function DemoConfig() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold display-heading text-gradient">Demo Configuration</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage the demo video section displayed on the homepage
        </p>
      </div>
      
      <DemoConfigManager />
    </div>
  );
}