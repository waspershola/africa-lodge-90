import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, Printer, FileImage, FileText, CreditCard } from 'lucide-react';
import { PrintableQRCode } from './PrintableQRCode';
import type { QRCodeData } from '@/pages/owner/QRManager';
import type { BrandingSettings } from './GlobalSettingsDialog';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BulkPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQRs: QRCodeData[];
  branding?: BrandingSettings;
}

type PrintTemplate = 'classic' | 'a4-poster' | 'flyer' | 'tent-card';
type PrintSize = 'small' | 'medium' | 'large';

const templateConfigs = {
  'classic': { title: 'Classic Card', icon: CreditCard },
  'a4-poster': { title: 'A4 Poster', icon: FileText },
  'flyer': { title: 'Flyer (Landscape)', icon: FileImage },
  'tent-card': { title: 'Tent Card', icon: CreditCard }
};

export const BulkPrintDialog = ({
  open,
  onOpenChange,
  selectedQRs,
  branding
}: BulkPrintDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate>('classic');
  const [selectedSize, setSelectedSize] = useState<PrintSize>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleBulkDownload = async (format: 'png' | 'pdf') => {
    if (selectedQRs.length === 0) return;
    
    setIsGenerating(true);
    try {
      const zip = await import('jszip');
      const JSZip = zip.default;
      const zipFile = new JSZip();

      for (const qr of selectedQRs) {
        // Create a temporary container for each QR code
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-10000px';
        container.style.top = '-10000px';
        document.body.appendChild(container);

        // Render the QR code component
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(container);
        
        const qrUrl = qr.qr_code_url || `${window.location.origin}/guest/qr/${qr.qr_token || qr.id}`;
        const roomNumber = qr.assignedTo?.includes('Room') ? qr.assignedTo.replace('Room ', '') : undefined;
        
        await new Promise<void>((resolve) => {
          root.render(
            <PrintableQRCode
              qrId={qr.id}
              assignedTo={qr.assignedTo}
              hotelName={branding?.hotelName}
              roomNumber={roomNumber}
              services={qr.servicesEnabled}
              qrUrl={qrUrl}
              themeId={branding?.theme || 'classic-luxury-gold'}
            />
          );
          
          // Wait for rendering to complete
          setTimeout(async () => {
            const printableElement = container.querySelector('[data-printable]');
            if (printableElement) {
              if (format === 'png') {
                const canvas = await html2canvas(printableElement as HTMLElement, {
                  scale: 2,
                  backgroundColor: '#ffffff',
                  useCORS: true
                });
                canvas.toBlob((blob) => {
                  if (blob) {
                    zipFile.file(`qr-${qr.assignedTo}-${selectedTemplate}.png`, blob);
                  }
                });
              } else {
                // PDF generation logic would go here
              }
            }
            
            root.unmount();
            document.body.removeChild(container);
            resolve();
          }, 1000);
        });
      }

      // Download the zip file
      const content = await zipFile.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `qr-codes-bulk-${selectedTemplate}.zip`;
      link.click();

      toast({
        title: 'Success',
        description: `Downloaded ${selectedQRs.length} QR codes as ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Bulk download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate bulk download',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Print Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={(value: PrintTemplate) => setSelectedTemplate(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templateConfigs).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.title}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={selectedSize} onValueChange={(value: PrintSize) => setSelectedSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Selected: {selectedQRs.length} QR codes
            <br />
            Theme: {branding?.theme || 'Classic Luxury Gold'}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkDownload('png')}
              disabled={isGenerating || selectedQRs.length === 0}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={() => handleBulkDownload('pdf')}
              disabled={isGenerating || selectedQRs.length === 0}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};