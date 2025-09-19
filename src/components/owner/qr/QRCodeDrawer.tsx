import React, { useState, useEffect } from 'react';
import { Download, Printer, Activity } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QRCodePreview } from '@/components/owner/qr/QRCodePreview';
import type { QRCodeData } from '@/pages/owner/QRManager';
import type { BrandingSettings } from './GlobalSettingsDialog';

interface QRCodeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCodeData | null;
  onUpdate: (qrCode: QRCodeData) => void;
  branding?: BrandingSettings;
}

const availableServices = [
  'Wi-Fi',
  'Room Service', 
  'Housekeeping',
  'Maintenance',
  'Digital Menu',
  'Events & Packages',
  'Feedback'
];

const mockAuditLogs = [
  {
    id: '1',
    service: 'Room Service',
    action: '📱 Guest Ordered',
    user: 'Guest (Room 101)',
    timestamp: '2025-09-19T05:39:00Z',
    details: 'Extra Towels'
  },
  {
    id: '2',
    service: 'Housekeeping',
    action: '✔️ Fulfilled',
    user: 'Staff A',
    timestamp: '2025-09-19T06:00:00Z',
    details: 'Delivered towels'
  },
  {
    id: '3',
    service: 'QR Code',
    action: '➕ Created',
    user: 'John Manager',
    timestamp: '2025-09-18T22:39:00Z',
    details: 'Services enabled: Wi-Fi, Room Service'
  }
];

export const QRCodeDrawer = ({ open, onOpenChange, qrCode, onUpdate, branding }: QRCodeDrawerProps) => {
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    if (qrCode) {
      setServices(qrCode.servicesEnabled);
    }
  }, [qrCode]);

  const handleServiceToggle = (service: string) => {
    const updatedServices = services.includes(service)
      ? services.filter(s => s !== service)
      : [...services, service];
    
    setServices(updatedServices);
    
    if (qrCode) {
      const updatedQR = { ...qrCode, servicesEnabled: updatedServices };
      onUpdate(updatedQR);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!qrCode) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>QR Code Details - {qrCode.assignedTo}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* QR Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QRCodePreview qrId={qrCode.id} assignedTo={qrCode.assignedTo} branding={branding} />
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">QR ID:</span>
                  <div className="font-medium">{qrCode.id}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Scope:</span>
                  <Badge variant="outline" className="ml-2">{qrCode.scope}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={qrCode.status === 'Active' ? 'default' : 'secondary'} 
                    className="ml-2"
                  >
                    {qrCode.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Pending Requests:</span>
                  <div className="font-medium">{qrCode.pendingRequests}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableServices.map((service) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{service}</span>
                    {services.includes(service) && (
                      <Badge variant="secondary" className="text-xs">Enabled</Badge>
                    )}
                  </div>
                  <Switch
                    checked={services.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Audit & Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Audit & Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User/Staff</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.service}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};