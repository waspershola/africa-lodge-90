import { useConfiguration } from '@/hooks/useConfiguration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandingIdentity } from './owner/config/BrandingIdentity';
import EmailSettings from './owner/settings/EmailSettings';
import { Loader2 } from 'lucide-react';

export function ConfigurationCenter() {
  const { configuration, loading, error, updateConfiguration } = useConfiguration();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading configuration: {error}</p>
      </div>
    );
  }

  if (!configuration) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No configuration found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hotel Configuration</h1>
        <p className="text-muted-foreground">
          Configure your hotel settings, branding, and preferences
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="branding">Branding & Identity</TabsTrigger>
          <TabsTrigger value="email">Email Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <BrandingIdentity
            config={configuration.branding}
            onUpdate={async (updates) => {
              await updateConfiguration('branding', updates);
              return true;
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}