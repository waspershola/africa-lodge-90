import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Plus, Download, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeTable } from '@/components/owner/qr/QRCodeTable';
import { QRCodeDrawer } from '@/components/owner/qr/QRCodeDrawer';
import { QRCodeWizard } from '@/components/owner/qr/QRCodeWizard';
import { GlobalSettingsDialog, type BrandingSettings } from '@/components/owner/qr/GlobalSettingsDialog';
import { BulkExportDialog } from '@/components/owner/qr/BulkExportDialog';
import { SessionSettingsModal } from '@/components/qr/SessionSettingsModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { QRSecurity } from '@/lib/qr-security';
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { useShortUrl } from '@/hooks/useShortUrl';

export interface QRCodeData {
  id: string;
  qr_token?: string;
  scope: 'Room' | 'Location';
  assignedTo: string;
  servicesEnabled: string[];
  status: 'Active' | 'Inactive';
  pendingRequests: number;
  createdAt: string;
  createdBy: string;
  qr_code_url?: string;
}

export default function QRManagerPage() {
  const navigate = useNavigate();
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showSessionSettings, setShowSessionSettings] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: tenantInfo } = useTenantInfo();
  const queryClient = useQueryClient();
  const { createShortUrl } = useShortUrl();
  
  // Enable unified real-time updates for QR codes
  useUnifiedRealtime({ verbose: false });

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
          qr_requests:qr_requests!qr_code_id (id, status, request_type, created_at)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50); // Add pagination limit

      if (error) {
        console.error('QR codes fetch error:', error);
        throw error;
      }

      return (data || []).map(qr => ({
        id: qr.qr_token,
        scope: 'Room' as const,
        assignedTo: qr.rooms?.room_number ? `Room ${qr.rooms.room_number}` : (qr.label || 'Location'),
        servicesEnabled: qr.services || [],
        status: (qr.is_active ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
        pendingRequests: qr.qr_requests?.filter((req: any) => req.status === 'pending').length || 0,
        createdAt: qr.created_at || '',
        createdBy: 'System'
      }));
    },
    enabled: !!user?.tenant_id,
    staleTime: 0, // Always fresh for real-time updates
    refetchInterval: 5000 // Poll every 5 seconds for new QR codes
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
    
    // Optimistic update
    queryClient.setQueryData(['qr-codes', user.tenant_id], (old: QRCodeData[] = []) => {
      return old.map(qr => 
        qr.id === updatedQR.id 
          ? { ...qr, servicesEnabled: updatedQR.servicesEnabled, status: updatedQR.status }
          : qr
      );
    });
    
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ 
          services: updatedQR.servicesEnabled,
          is_active: updatedQR.status === 'Active'
        })
        .eq('qr_token', updatedQR.id);

      if (error) throw error;
      
      // Immediate invalidation (no staleTime blocking)
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] });
      
      toast({
        title: "QR Code Updated",
        description: `${updatedQR.assignedTo} QR code has been updated successfully`
      });
    } catch (err: any) {
      // Rollback on error
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] });
      
      toast({
        title: "Error",
        description: err.message || "Failed to update QR code",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQR = async (qrCode: QRCodeData) => {
    if (!user?.tenant_id) return;
    
    // Optimistic update - remove from list immediately
    queryClient.setQueryData(['qr-codes', user.tenant_id], (old: QRCodeData[] = []) => {
      return old.filter(qr => qr.id !== qrCode.id);
    });
    
    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('qr_token', qrCode.id)
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;
      
      // Immediate invalidation
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] });
      
      toast({
        title: "QR Code Deleted",
        description: `QR code for ${qrCode.assignedTo} has been deleted successfully`
      });
    } catch (err: any) {
      // Rollback on error
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] });
      
      toast({
        title: "Error",
        description: err.message || "Failed to delete QR code",
        variant: "destructive"
      });
    }
  };

  const handleCreateQR = async (newQRData: Omit<QRCodeData, 'id' | 'createdAt' | 'createdBy' | 'pendingRequests'>) => {
    if (!user?.tenant_id) return;
    
    // PHASE 2 FIX: Clear any stale cache first
    queryClient.removeQueries({ queryKey: ['qr-codes', user.tenant_id] });
    
    const tempId = `temp-${Date.now()}`;
    
    try {
      const qrToken = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract room number if it's a room QR code
      let roomId = null;
      if (newQRData.scope === 'Room' && newQRData.assignedTo) {
        // Try to find matching room by room number
        const roomNumber = newQRData.assignedTo.replace('Room ', '').trim();
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('tenant_id', user.tenant_id)
          .eq('room_number', roomNumber)
          .single();
        
        // PHASE 2 FIX: Validate room exists before creating QR
        if (!room || roomError) {
          console.error('Room not found:', { roomNumber, roomError });
          toast({
            title: "Room Not Found",
            description: `Room ${roomNumber} doesn't exist. Please create it in Room Management first.`,
            variant: "destructive"
          });
          return;
        }
        
        roomId = room.id;
      }
      
      // PHASE 2 FIX: Only add optimistic update after validation passes
      queryClient.setQueryData(['qr-codes', user.tenant_id], (old: QRCodeData[] = []) => {
        return [{
          id: tempId,
          scope: newQRData.scope,
          assignedTo: newQRData.assignedTo,
          servicesEnabled: newQRData.servicesEnabled,
          status: newQRData.status,
          pendingRequests: 0,
          createdAt: new Date().toISOString(),
          createdBy: 'System'
        }, ...old];
      });

      // Generate QR code URL - permanent, no expiry
      const fullQrUrl = QRSecurity.generateQRUrl(qrToken);
      
      // Try to create short URL
      let qrCodeUrl = fullQrUrl;
      try {
        const { short_url } = await createShortUrl({
          url: fullQrUrl,
          tenantId: user.tenant_id,
          sessionToken: qrToken,
          linkType: 'qr_redirect'
        });
        qrCodeUrl = short_url;
        console.log(`✅ Short URL created:`, {
          original: fullQrUrl,
          shortened: short_url,
          saved: `${fullQrUrl.length - short_url.length} chars`,
          shortCode: short_url.split('/q/')[1]
        });
      } catch (shortUrlError) {
        console.error('❌ Short URL creation failed:', {
          error: shortUrlError,
          fullUrl: fullQrUrl,
          tenantId: user.tenant_id
        });
        toast({
          title: "QR Code Created (Full URL)",
          description: "Short URL generation failed, using full URL",
          variant: "default"
        });
      }
      
      const { data: insertedData, error } = await supabase
        .from('qr_codes')
        .insert([{
          tenant_id: user.tenant_id,
          qr_token: qrToken,
          room_id: roomId,
          services: newQRData.servicesEnabled,
          is_active: newQRData.status === 'Active',
          qr_code_url: qrCodeUrl,
          label: newQRData.assignedTo,
          scan_type: newQRData.scope.toLowerCase()
        }])
        .select();

      // PHASE 2 FIX: Better error handling with detailed logging
      if (error) {
        console.error('QR creation database error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          roomId,
          qrToken
        });
        
        // Rollback optimistic update
        await queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] });
        
        // Check if it's a duplicate room constraint error
        if (error.code === '23505' && error.message.includes('unique_active_room_per_tenant')) {
          toast({
            title: "Duplicate QR Code",
            description: `QR code already exists for ${newQRData.assignedTo}. Please deactivate the existing QR code first.`,
            variant: "destructive"
          });
          return;
        }
        
        toast({
          title: "Database Error",
          description: error.message || "Failed to create QR code in database",
          variant: "destructive"
        });
        return;
      }
      
      console.log('QR code created successfully:', insertedData);
      
      // PHASE 2 FIX: Force aggressive refetch with cache reset
      await queryClient.resetQueries({ queryKey: ['qr-codes', user.tenant_id] });
      await refetch(); // Force manual refetch
      
      toast({
        title: "QR Code Created",
        description: `QR code for ${newQRData.assignedTo} has been generated successfully`
      });
    } catch (err: any) {
      // Rollback on error
      await queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] });
      
      console.error('QR creation error:', err);
      toast({
        title: "Error Creating QR Code", 
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
          <Button variant="outline" onClick={() => navigate('/owner-dashboard/qr-settings')}>
            <Settings className="h-4 w-4 mr-2" />
            QR Settings
          </Button>
          <Button variant="outline" onClick={() => setShowSessionSettings(true)}>
            <Clock className="h-4 w-4 mr-2" />
            Session Settings
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
        onDelete={handleDeleteQR}
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

      {/* Session Settings Modal */}
      <SessionSettingsModal
        open={showSessionSettings}
        onOpenChange={setShowSessionSettings}
      />
    </div>
  );
}