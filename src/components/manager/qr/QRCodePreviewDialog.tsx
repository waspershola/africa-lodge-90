import { useState } from 'react';
import { QrCode, Download, Printer, Share, Copy, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { QRSecurity } from '@/lib/qr-security';

interface QRCodePreviewDialogProps {
  trigger: React.ReactNode;
  room: string;
  services: string[];
  pricing: string;
  scans: number;
  revenue: number;
}

export const QRCodePreviewDialog = ({ 
  trigger, 
  room, 
  services, 
  pricing, 
  scans, 
  revenue 
}: QRCodePreviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const qrUrl = QRSecurity.generateQRUrl(room);

  const handleDownload = () => {
    toast({
      title: "QR Code Downloaded",
      description: `QR code for Room ${room} has been downloaded as PNG.`,
    });
  };

  const handlePrint = () => {
    toast({
      title: "QR Code Sent to Printer",
      description: `QR code for Room ${room} has been sent to the default printer.`,
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrUrl);
    toast({
      title: "URL Copied",
      description: "QR code URL has been copied to clipboard.",
    });
  };

  const handleRegenerate = () => {
    toast({
      title: "QR Code Regenerated",
      description: `New QR code generated for Room ${room}. Previous code deactivated.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Room {room} QR Code
          </DialogTitle>
          <DialogDescription>
            Preview and manage QR code for Room {room}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-white border-2 rounded-lg flex items-center justify-center">
              <QrCode className="h-32 w-32" />
            </div>
          </div>

          {/* Room Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Room:</span>
                <div className="font-medium">Room {room}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Pricing:</span>
                <div className="font-medium">{pricing}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Scans:</span>
                <div className="font-medium">{scans}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Revenue:</span>
                <div className="font-medium text-green-600">₦{revenue.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">Available Services:</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {services.map((service, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground text-sm">QR URL:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {qrUrl}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleCopyUrl}>
              <Share className="h-4 w-4 mr-2" />
              Share URL
            </Button>
            <Button variant="outline" onClick={handleRegenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};