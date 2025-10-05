import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useConfiguration } from '@/hooks/useConfiguration';
import { ConfigurationErrorBoundary } from './ErrorBoundary';
import { ConfirmationDialog } from './ConfirmationDialog';
import { GeneralSettings } from './GeneralSettings';
import { CurrencyFinancials } from './CurrencyFinancials';
import { TaxServiceChargeSettings } from './TaxServiceChargeSettings';
import { BrandingIdentity } from './BrandingIdentity';
import { ReceiptDocuments } from './ReceiptDocuments';
import { GuestExperience } from './GuestExperience';
import { StaffPermissions } from './StaffPermissions';
import { AuditLogs } from './AuditLogs';
import { DatabaseCleanup } from './DatabaseCleanup';
import EmailSettings from '../settings/EmailSettings';
import { 
  Settings, 
  DollarSign,
  Percent,
  Palette, 
  FileText, 
  Users, 
  Shield, 
  History,
  Mail,
  Database,
  RotateCcw,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const ConfigurationCenter = () => {
  const { configuration, loading, error, updateConfiguration, resetToDefaults } = useConfiguration();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // In production, this would validate and save all sections
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast({
        title: "Configuration Saved",
        description: "All settings have been saved successfully.",
        action: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Saved</span>
          </div>
        ),
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    setResetting(true);
    try {
      const success = await resetToDefaults();
      if (success) {
        toast({
          title: "Configuration Reset",
          description: "All settings have been reset to defaults.",
        });
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset configuration.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (hasUnsavedChanges) {
      // In production, you might want to show a warning dialog here
    }
    setActiveTab(value);
  };

  // Show error boundary if configuration is not available
  if (!configuration && !loading) {
    throw new Error('Failed to load configuration data');
  }

  if (loading && !configuration) {
    return (
      <div className="flex flex-col justify-center items-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <ConfigurationErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Configuration Center</h1>
            <p className="text-muted-foreground">
              Manage hotel-wide settings and preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="text-sm text-amber-600 font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Unsaved changes
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(true)}
              disabled={saving || resetting}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset All</span>
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={saving || resetting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">
                {saving ? 'Saving...' : 'Save All Changes'}
              </span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-destructive font-medium">Configuration Error</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Configuration Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="border-b">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 h-auto p-1">
                  <TabsTrigger value="general" className="flex items-center gap-2 py-3 px-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">General</span>
                  </TabsTrigger>
                  <TabsTrigger value="currency" className="flex items-center gap-2 py-3 px-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Currency</span>
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="flex items-center gap-2 py-3 px-2">
                    <Percent className="h-4 w-4" />
                    <span className="hidden sm:inline">Tax & Service</span>
                  </TabsTrigger>
                  <TabsTrigger value="branding" className="flex items-center gap-2 py-3 px-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Branding</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2 py-3 px-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Documents</span>
                  </TabsTrigger>
                  <TabsTrigger value="guest" className="flex items-center gap-2 py-3 px-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Guest</span>
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="flex items-center gap-2 py-3 px-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Permissions</span>
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="flex items-center gap-2 py-3 px-2">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Audit</span>
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2 py-3 px-2">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="cleanup" className="flex items-center gap-2 py-3 px-2">
                    <Database className="h-4 w-4" />
                    <span className="hidden sm:inline">Cleanup</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                <TabsContent value="general" className="mt-0">
                  <GeneralSettings
                    config={configuration.general}
                    onUpdate={async (updates) => {
                      await updateConfiguration('general', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="currency" className="mt-0">
                  <CurrencyFinancials
                    currencyConfig={configuration.currency}
                    taxConfig={configuration.tax}
                    onUpdateCurrency={async (updates) => {
                      await updateConfiguration('currency', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    onUpdateTax={async (updates) => {
                      await updateConfiguration('tax', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="tax" className="mt-0">
                  <TaxServiceChargeSettings
                    config={configuration}
                    onUpdate={async (section, updates) => {
                      await updateConfiguration(section, updates);
                      setHasUnsavedChanges(true);
                    }}
                  />
                </TabsContent>

                <TabsContent value="branding" className="mt-0">
                  <BrandingIdentity
                    config={configuration.branding}
                    onUpdate={async (updates) => {
                      await updateConfiguration('branding', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <ReceiptDocuments
                    config={configuration.documents}
                    onUpdate={async (updates) => {
                      await updateConfiguration('documents', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="guest" className="mt-0">
                  <GuestExperience
                    config={configuration.guest_experience}
                    onUpdate={async (updates) => {
                      await updateConfiguration('guest_experience', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="mt-0">
                  <StaffPermissions
                    config={configuration.permissions}
                    onUpdate={async (updates) => {
                      await updateConfiguration('permissions', updates);
                      setHasUnsavedChanges(true);
                      return true;
                    }}
                    loading={loading}
                  />
                </TabsContent>

                <TabsContent value="audit" className="mt-0">
                  <AuditLogs />
                </TabsContent>

                <TabsContent value="email" className="mt-0">
                  <EmailSettings />
                </TabsContent>

                <TabsContent value="cleanup" className="mt-0">
                  <DatabaseCleanup />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
          title="Reset All Configuration"
          description="Are you sure you want to reset all configuration settings to their default values? This action cannot be undone."
          confirmText="Reset All"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleResetAll}
        />
      </div>
    </ConfigurationErrorBoundary>
  );
};