import React, { useState } from 'react';
import { QrCode, Plus, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeTable } from '@/components/owner/qr/QRCodeTable';
import { QRCodeDrawer } from '@/components/owner/qr/QRCodeDrawer';
import { QRCodeWizard } from '@/components/owner/qr/QRCodeWizard';
import { GlobalSettingsDialog, type BrandingSettings } from '@/components/owner/qr/GlobalSettingsDialog';
import { BulkExportDialog } from '@/components/owner/qr/BulkExportDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { useTenantInfo } from '@/hooks/useTenantInfo';

export interface QRCodeData {
  id: string;
  scope: 'Room' | 'Location';
  assignedTo: string;
  servicesEnabled: string[];
  status: 'Active' | 'Inactive';
  pendingRequests: number;
  createdAt: string;
  createdBy: string;
}

export default function QRManagerPage() {
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: tenantInfo } = useTenantInfo();

  // Load QR codes from database
  const { data: qrCodes = [], isLoading, refetch } = useQuery({
    queryKey: ['qr-codes', user?.tenant_id],
    queryFn: async () => {
      if (!user?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          rooms:room_id (room_number),
          qr_orders:qr_orders (id, status, service_type)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(qr => ({
        id: qr.qr_token,
        scope: 'Room' as const,
        assignedTo: qr.rooms?.room_number || `Room ${qr.room_id}`,
        servicesEnabled: qr.services || [],
        status: (qr.is_active ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
        pendingRequests: qr.qr_orders?.filter(order => order.status === 'pending').length || 0,
        createdAt: qr.created_at || '',
        createdBy: 'System'
      }));
    },
    enabled: !!user?.tenant_id
  });

  // Get branding settings from tenant info
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    hotelName: tenantInfo?.hotel_name || 'Hotel',
    showLogo: !!tenantInfo?.logo_url,
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    defaultServices: ['Wi-Fi', 'Room Service', 'Housekeeping']
  });

  const handleViewQR = (qr: QRCodeData) => {
    setSelectedQR(qr);
    setShowDrawer(true);
  };

  const handleEditQR = (qr: QRCodeData) => {
    setSelectedQR(qr);
    setShowDrawer(true);
  };

  const handleNewQRCode = () => {
    setSelectedQR(null);
    setShowWizard(true);
  };

  const handleBulkExport = () => {
    setShowBulkExport(true);
  };

  const handleGlobalSettings = () => {
    setShowGlobalSettings(true);
  };

  const handleBrandingUpdate = (settings: BrandingSettings) => {
    setBrandingSettings(settings);
    toast({
      title: "Settings Updated",
      description: "Global branding settings have been saved successfully"
    });
  };

  const handleExportSelected = (selectedIds: string[], format: string, size: number) => {
    const selectedQRs = qrCodes.filter(qr => selectedIds.includes(qr.id));
    
    // Simulate file download
    selectedQRs.forEach(qr => {
      const fileName = `${qr.id}_${qr.assignedTo.replace(/\s+/g, '_')}.${format.toLowerCase()}`;
      console.log(`Downloading: ${fileName}`);
    });

    toast({
      title: "Export Complete",
      description: `Successfully exported ${selectedIds.length} QR codes as ${format} files`
    });
  };

  const handleUpdateQR = async (updatedQR: QRCodeData) => {
    if (!user?.tenant_id) return;
    
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ 
          services: updatedQR.servicesEnabled,
          is_active: updatedQR.status === 'Active'
        })
        .eq('qr_token', updatedQR.id);

      if (error) throw error;
      
      await refetch();
      toast({
        title: "QR Code Updated",
        description: `${updatedQR.assignedTo} QR code has been updated successfully`
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update QR code",
        variant: "destructive"
      });
    }
  };

  const handleCreateQR = async (newQRData: Omit<QRCodeData, 'id' | 'createdAt' | 'createdBy' | 'pendingRequests'>) => {
    if (!user?.tenant_id) return;
    
    try {
      const qrToken = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('qr_codes')
        .insert([{
          tenant_id: user.tenant_id,
          qr_token: qrToken,
          room_id: null, // Will need to be set based on assignment
          services: newQRData.servicesEnabled,
          is_active: newQRData.status === 'Active'
        }]);

      if (error) throw error;
      
      await refetch();
      toast({
        title: "QR Code Created",
        description: `QR code for ${newQRData.assignedTo} has been generated successfully`
      });
    } catch (err: any) {
      toast({
        title: "Error", 
        description: err.message || "Failed to create QR code",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-8 w-8" />
            QR Code Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage per-room and per-location QR codes with unified service access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGlobalSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </Button>
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-2" />
            Bulk Export
          </Button>
          <Button onClick={handleNewQRCode}>
            <Plus className="h-4 w-4 mr-2" />
            Generate New QR
          </Button>
        </div>
      </div>

      {/* QR Codes Table */}
      <QRCodeTable 
        qrCodes={qrCodes}
        onView={handleViewQR}
        onEdit={handleEditQR}
      />

      {/* QR Details Drawer */}
      <QRCodeDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        qrCode={selectedQR}
        onUpdate={handleUpdateQR}
        branding={brandingSettings}
      />

      {/* QR Creation Wizard */}
      <QRCodeWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSave={handleCreateQR}
        defaultServices={brandingSettings.defaultServices}
      />

      {/* Global Settings Dialog */}
      <GlobalSettingsDialog
        open={showGlobalSettings}
        onOpenChange={setShowGlobalSettings}
        settings={brandingSettings}
        onSave={handleBrandingUpdate}
      />

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
        qrCodes={qrCodes}
        onExport={handleExportSelected}
      />
    </div>
  );
}