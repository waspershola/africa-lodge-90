import React, { useState } from 'react';
import { QrCode, Plus, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeTable } from '@/components/owner/qr/QRCodeTable';
import { QRCodeDrawer } from '@/components/owner/qr/QRCodeDrawer';
import { QRCodeWizard } from '@/components/owner/qr/QRCodeWizard';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([
    {
      id: 'QR_101',
      scope: 'Room',
      assignedTo: 'Room 101',
      servicesEnabled: ['Wi-Fi', 'Room Service', 'Housekeeping', 'Maintenance', 'Menu'],
      status: 'Active',
      pendingRequests: 3,
      createdAt: '2025-09-18T22:39:00Z',
      createdBy: 'John Manager'
    },
    {
      id: 'QR_102',
      scope: 'Room',
      assignedTo: 'Room 102',
      servicesEnabled: ['Wi-Fi', 'Room Service', 'Housekeeping'],
      status: 'Active',
      pendingRequests: 0,
      createdAt: '2025-09-18T22:40:00Z',
      createdBy: 'John Manager'
    },
    {
      id: 'QR_POOL',
      scope: 'Location',
      assignedTo: 'Poolside Bar',
      servicesEnabled: ['Menu', 'Events'],
      status: 'Active',
      pendingRequests: 6,
      createdAt: '2025-09-18T22:41:00Z',
      createdBy: 'Sarah Admin'
    },
    {
      id: 'QR_LOBBY',
      scope: 'Location',
      assignedTo: 'Lobby',
      servicesEnabled: ['Wi-Fi', 'Feedback'],
      status: 'Active',
      pendingRequests: 0,
      createdAt: '2025-09-18T22:42:00Z',
      createdBy: 'John Manager'
    }
  ]);

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
    toast({
      title: "Bulk Export Started",
      description: `Generating ${qrCodes.length} QR codes as ZIP file...`
    });
  };

  const handleGlobalSettings = () => {
    toast({
      title: "Global Settings",
      description: "Opening branding and default service settings..."
    });
  };

  const handleUpdateQR = (updatedQR: QRCodeData) => {
    setQRCodes(prev => prev.map(qr => 
      qr.id === updatedQR.id ? updatedQR : qr
    ));
    toast({
      title: "QR Code Updated",
      description: `${updatedQR.assignedTo} QR code has been updated successfully`
    });
  };

  const handleCreateQR = (newQRData: Omit<QRCodeData, 'id' | 'createdAt' | 'createdBy' | 'pendingRequests'>) => {
    const newQR: QRCodeData = {
      ...newQRData,
      id: `QR_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      pendingRequests: 0
    };
    setQRCodes(prev => [...prev, newQR]);
    toast({
      title: "QR Code Created",
      description: `QR code for ${newQR.assignedTo} has been generated successfully`
    });
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
      />

      {/* QR Creation Wizard */}
      <QRCodeWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSave={handleCreateQR}
      />
    </div>
  );
}