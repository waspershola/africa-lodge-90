import React, { useState, useEffect } from 'react';
import { Download, Printer, Activity, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { QRCodePreview } from '@/components/owner/qr/QRCodePreview';
import type { QRCodeData } from '@/pages/owner/QRManager';
import type { BrandingSettings } from './GlobalSettingsDialog';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface QRCodeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCodeData | null;
  onUpdate: (qrCode: QRCodeData) => void;
  onDelete?: (qrCode: QRCodeData) => void;
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

export const QRCodeDrawer = ({ open, onOpenChange, qrCode, onUpdate, onDelete, branding }: QRCodeDrawerProps) => {
  const [services, setServices] = useState<string[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { toast } = useToast();

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

  const handleDownloadPNG = async () => {
    if (!qrDataUrl) {
      toast({
        title: "Error",
        description: "QR code not ready for download",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create download link
      const link = document.createElement('a');
      link.download = `${qrCode?.id || 'qr-code'}-${qrCode?.assignedTo?.replace(/\s+/g, '_') || 'code'}.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to download QR code",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    if (!qrDataUrl) {
      toast({
        title: "Error",
        description: "QR code not ready for printing",
        variant: "destructive"
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${qrCode?.assignedTo || 'Unknown'}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
                margin: 0;
              }
              .qr-container {
                max-width: 400px;
                margin: 0 auto;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 8px;
              }
              .hotel-info { margin-bottom: 20px; }
              .qr-code { margin: 20px 0; }
              .instructions { 
                font-size: 12px; 
                color: #666; 
                margin-top: 20px; 
              }
              @media print {
                body { padding: 0; }
                .qr-container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="hotel-info">
                <h2>${branding?.hotelName || 'Hotel'}</h2>
                <p>${qrCode?.assignedTo || 'Location'}</p>
                <p>Services: ${qrCode?.servicesEnabled?.join(', ') || 'None'}</p>
              </div>
              <div class="qr-code">
                <img src="${qrDataUrl}" alt="QR Code" style="max-width: 300px;" />
              </div>
              <div class="instructions">
                <p>Scan with your phone camera to access hotel services</p>
                <p>QR ID: ${qrCode?.id || 'Unknown'}</p>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      toast({
        title: "Success",
        description: "Print dialog opened",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open print dialog",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    if (qrCode && onDelete) {
      onDelete(qrCode);
      onOpenChange(false);
    }
  };

  const handleQRGenerated = (dataUrl: string) => {
    setQrDataUrl(dataUrl);
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
              <QRCodePreview 
                qrId={qrCode.id} 
                assignedTo={qrCode.assignedTo} 
                branding={branding}
                hotelName={branding?.hotelName}
                roomNumber={qrCode.assignedTo?.includes('Room') ? qrCode.assignedTo.replace('Room ', '') : undefined}
                services={qrCode.servicesEnabled}
                qrUrl={`${window.location.origin}/guest/qr/${qrCode.qr_token || qrCode.id}`}
                isActive={qrCode.status === 'Active'}
                onDelete={() => onDelete?.(qrCode)}
              />
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDownloadPNG}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button variant="outline" className="flex-1" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>

              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete QR Code
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete QR Code</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the QR code for {qrCode.assignedTo}? 
                        This action cannot be undone and guests will no longer be able to access services through this QR code.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Hotel:</span>
                  <div className="font-medium">{branding?.hotelName || 'Hotel'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{qrCode.scope}:</span>
                  <div className="font-medium">{qrCode.assignedTo}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Services:</span>
                  <div className="font-medium">{qrCode.servicesEnabled.length} enabled</div>
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
                <div>
                  <span className="text-muted-foreground">QR ID:</span>
                  <div className="font-medium font-mono text-xs">{qrCode.id}</div>
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