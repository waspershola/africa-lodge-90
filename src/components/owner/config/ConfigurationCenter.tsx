import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useConfiguration } from '@/hooks/useConfiguration';
import { GeneralSettings } from './GeneralSettings';
import { CurrencyFinancials } from './CurrencyFinancials';
import { BrandingIdentity } from './BrandingIdentity';
import { ReceiptDocuments } from './ReceiptDocuments';
import { GuestExperience } from './GuestExperience';
import { StaffPermissions } from './StaffPermissions';
import { AuditLogs } from './AuditLogs';
import { 
  Settings, 
  DollarSign, 
  Palette, 
  FileText, 
  Users, 
  Shield, 
  History,
  RotateCcw,
  Save
} from 'lucide-react';

export const ConfigurationCenter = () => {
  const { configuration, loading, error, updateConfiguration, resetToDefaults } = useConfiguration();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSaveAll = async () => {
    try {
      // In a real implementation, this would save all pending changes
      toast({
        title: "Configuration Saved",
        description: "All settings have been saved successfully.",
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetAll = async () => {
    const success = await resetToDefaults();
    if (success) {
      toast({
        title: "Configuration Reset",
        description: "All settings have been reset to defaults.",
      });
      setHasUnsavedChanges(false);
    }
  };

  if (loading && !configuration) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuration Center</h1>
          <p className="text-muted-foreground">
            Manage hotel-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="text-sm text-amber-600 font-medium">
              Unsaved changes
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleResetAll}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
          <Button
            onClick={handleSaveAll}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-7 h-auto p-1">
                <TabsTrigger value="general" className="flex items-center gap-2 py-3">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="currency" className="flex items-center gap-2 py-3">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Currency</span>
                </TabsTrigger>
                <TabsTrigger value="branding" className="flex items-center gap-2 py-3">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Branding</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2 py-3">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="guest" className="flex items-center gap-2 py-3">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Guest</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2 py-3">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Permissions</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2 py-3">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Audit</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="general" className="mt-0">
                <GeneralSettings
                  config={configuration.general}
                  onUpdate={(updates) => updateConfiguration('general', updates)}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="currency" className="mt-0">
                <CurrencyFinancials
                  currencyConfig={configuration.currency}
                  taxConfig={configuration.tax}
                  onUpdateCurrency={(updates) => updateConfiguration('currency', updates)}
                  onUpdateTax={(updates) => updateConfiguration('tax', updates)}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                <BrandingIdentity
                  config={configuration.branding}
                  onUpdate={(updates) => updateConfiguration('branding', updates)}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <ReceiptDocuments
                  config={configuration.documents}
                  onUpdate={(updates) => updateConfiguration('documents', updates)}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="guest" className="mt-0">
                <GuestExperience
                  config={configuration.guest_experience}
                  onUpdate={(updates) => updateConfiguration('guest_experience', updates)}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="permissions" className="mt-0">
                <StaffPermissions
                  config={configuration.permissions}
                  onUpdate={(updates) => updateConfiguration('permissions', updates)}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="audit" className="mt-0">
                <AuditLogs />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};