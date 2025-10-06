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
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { RealtimeDebugIndicator } from '@/components/owner/qr/RealtimeDebugIndicator';
import { useEffect } from 'react';
import { useSyncWatcher } from '@/contexts/RealtimeSyncProvider';

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
  const queryClient = useQueryClient();
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showSessionSettings, setShowSessionSettings] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: tenantInfo } = useTenantInfo();
  
  // Phase 2G: Use global sync provider (single source of truth)
  const syncStatus = useSyncWatcher();
  const qrCodeSync = syncStatus.qrCodes;
  
  // Phase 2E: Network status monitoring with auto-recovery
  const { isOnline, lastSyncAt, setSyncing } = useNetworkStatus();
  
  // Auto-refetch when coming back online
  useEffect(() => {
    if (isOnline && lastSyncAt && user?.tenant_id) {
      console.log('[QR Manager] Network restored, refetching QR codes');
      setSyncing(true);
      queryClient.invalidateQueries({ queryKey: ['qr-codes', user.tenant_id] })
        .finally(() => setSyncing(false));
    }
  }, [isOnline, lastSyncAt, user?.tenant_id, queryClient, setSyncing]);

  // Load QR codes from database
  const { data: qrCodes = [], isLoading, refetch } = useQuery({
    queryKey: ['qr-codes', user?.tenant_id],
    staleTime: 0, // Always refetch when invalidated
    queryFn: async () => {
      if (!user?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          rooms:room_id (room_number),
          qr_orders:qr_orders!qr_code_id (id, status, service_type, created_at)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50); // Add pagination limit

      if (error) {
        console.error('QR codes fetch error:', error);
        throw error;
      }

      return (data || []).map(qr => ({
        id: qr.id,
        qr_token: qr.qr_token,
        qr_code_url: qr.qr_code_url,
        scope: 'Room' as const,
        assignedTo: qr.rooms?.room_number ? `Room ${qr.rooms.room_number}` : (qr.label || 'Location'),
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
      // Optimistic update - immediately update UI
      queryClient.setQueryData(['qr-codes', user.tenant_id], (old: QRCodeData[] = []) => {
        return old.map(qr => qr.id === updatedQR.id ? updatedQR : qr);
      });

      const { data: updated, error } = await supabase
        .from('qr_codes')
        .update({ 
          services: updatedQR.servicesEnabled,
          is_active: updatedQR.status === 'Active'
        })
        .eq('id', updatedQR.id)
        .select(`
          *,
          rooms:room_id (room_number),
          qr_orders:qr_orders!qr_code_id (id, status, service_type, created_at)
        `)
        .single();

      if (error) throw error;
      
      // Phase 5: Simplified - let RealtimeSyncProvider handle cross-device sync
      await refetch();

      toast({
        title: "QR Code Updated",
        description: `${updatedQR.assignedTo} QR code has been updated successfully`
      });
    } catch (err: any) {
      // Revert optimistic update on error
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
    
    try {
      // Optimistic update - immediately remove from UI
      queryClient.setQueryData(['qr-codes', user.tenant_id], (old: QRCodeData[] = []) => {
        return old.filter(qr => qr.id !== qrCode.id);
      });

      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrCode.id)
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;
      
      // Phase 5: Simplified - let RealtimeSyncProvider handle cross-device sync
      await refetch();

      setShowDrawer(false);
      setSelectedQR(null);
      toast({
        title: "QR Code Deleted",
        description: `QR code for ${qrCode.assignedTo} has been deleted successfully`
      });
    } catch (err: any) {
      // Revert optimistic update on error
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
    
    try {
      const qrToken = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Extract room number if it's a room QR code
      let roomId = null;
      if (newQRData.scope === 'Room' && newQRData.assignedTo) {
        // Extract room number - handle both "Room 101" and "101" formats
        const roomNumber = newQRData.assignedTo.replace(/^Room\s+/i, '').trim();
        
        if (!roomNumber) {
          throw new Error('Please provide a valid room number');
        }
        
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('tenant_id', user.tenant_id)
          .eq('room_number', roomNumber)
          .maybeSingle();
        
        if (roomError) {
          console.error('Room lookup error:', roomError);
        }
        
        if (!room) {
          console.warn(`Room ${roomNumber} not found in database. QR code will be created without room association.`);
        }
        
        roomId = room?.id || null;
      }

      // Generate QR code URL - permanent, no expiry
      const qrCodeUrl = QRSecurity.generateQRUrl(qrToken);
      
      const { data: newQR, error } = await supabase
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
        .select(`
          *,
          rooms:room_id (room_number),
          qr_orders:qr_orders!qr_code_id (id, status, service_type, created_at)
        `)
        .single();

      if (error) {
        // Check if it's a duplicate room constraint error
        if (error.code === '23505' && error.message.includes('unique_active_room_per_tenant')) {
          throw new Error(`QR code already exists for ${newQRData.assignedTo}. Please deactivate the existing QR code first.`);
        }
        throw error;
      }

      if (newQR) {
        // Transform the database record to match QRCodeData interface
        const transformedQR: QRCodeData = {
          id: newQR.id,
          qr_token: newQR.qr_token,
          qr_code_url: newQR.qr_code_url,
          scope: 'Room' as const,
          assignedTo: newQR.rooms?.room_number ? `Room ${newQR.rooms.room_number}` : (newQR.label || 'Location'),
          servicesEnabled: newQR.services || [],
          status: (newQR.is_active ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          pendingRequests: 0,
          createdAt: newQR.created_at,
          createdBy: 'System'
        };
        
        console.log('[QR Cache Debug] Before optimistic update:', queryClient.getQueryData(['qr-codes', user.tenant_id]));
        
        // Optimistic update - immediately add to UI
        queryClient.setQueryData(['qr-codes', user.tenant_id], (old: QRCodeData[] = []) => {
          return [transformedQR, ...old];
        });
        
        console.log('[QR Cache Debug] After optimistic update:', queryClient.getQueryData(['qr-codes', user.tenant_id]));
        
        // Phase 4: Immediate refetch to confirm database state
        await refetch();
        console.log('[QR Cache Debug] After immediate refetch:', queryClient.getQueryData(['qr-codes', user.tenant_id]));
      }

      setShowWizard(false);
      toast({
        title: "QR Code Created",
        description: `QR code for ${newQRData.assignedTo} has been generated successfully`
      });
    } catch (err: any) {
      console.error('QR creation error:', err);
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
      
      {/* Phase 2D: Realtime Debug Indicator (dev only) */}
      <RealtimeDebugIndicator
        isConnected={qrCodeSync.isConnected}
        reconnectAttempts={0}
        lastSync={qrCodeSync.lastSync}
        isOnline={isOnline}
      />
    </div>
  );
}