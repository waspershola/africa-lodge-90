import { AddonCatalogManager } from '@/components/sa/AddonCatalogManager';

export default function AddonCatalog() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold display-heading text-gradient">Add-on Catalog</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage available add-ons and extensions for hotel subscriptions
        </p>
      </div>
      
      <AddonCatalogManager />
    </div>
  );
}