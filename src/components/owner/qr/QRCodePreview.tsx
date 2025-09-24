import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Printer } from 'lucide-react';
import type { BrandingSettings } from './GlobalSettingsDialog';
import QRCode from 'qrcode';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { PrintableQRCode } from './PrintableQRCode';

interface QRCodePreviewProps {
  qrId: string;
  assignedTo: string;
  size?: number;
  branding?: BrandingSettings;
  hotelName?: string;
  roomNumber?: string;
  services?: string[];
  qrUrl?: string;
  isActive?: boolean;
  onQRGenerated?: (qrDataUrl: string) => void;
  onDelete?: () => void;
}

export const QRCodePreview = ({ 
  qrId, 
  assignedTo, 
  size = 200, 
  branding, 
  hotelName, 
  roomNumber, 
  services, 
  qrUrl, 
  isActive = true,
  onQRGenerated,
  onDelete 
}: QRCodePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showPrintable, setShowPrintable] = useState(false);
  const { data: tenantInfo } = useTenantInfo();

  useEffect(() => {
    const generateRealQRCode = async () => {
      if (!qrUrl || !canvasRef.current) return;
      
      try {
        // Generate QR code with branding colors
        const qrOptions = {
          width: size,
          margin: 2,
          color: {
            dark: branding?.primaryColor || '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M' as const
        };
        
        await QRCode.toCanvas(canvasRef.current, qrUrl, qrOptions);
        
        // Convert to data URL for download functionality
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setQrDataUrl(dataUrl);
        onQRGenerated?.(dataUrl);
      } catch (error) {
        console.error('QR Code generation error:', error);
      }
    };

    generateRealQRCode();
  }, [qrUrl, size, onQRGenerated, branding?.primaryColor]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${roomNumber || assignedTo}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (showPrintable) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Printable QR Code</h3>
          <Button 
            variant="outline" 
            onClick={() => setShowPrintable(false)}
          >
            Back to Preview
          </Button>
        </div>
        <PrintableQRCode
          qrId={qrId}
          assignedTo={assignedTo}
          hotelName={hotelName || tenantInfo?.hotel_name}
          roomNumber={roomNumber}
          services={services}
          qrUrl={qrUrl}
          themeId={branding?.theme || 'classic-luxury-gold'}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center space-y-4">
      <Card className="p-4">
        <CardContent className="p-0 flex flex-col items-center space-y-3">
          {/* Hotel Branding */}
          <div className="text-center">
            {(branding?.showLogo || tenantInfo?.logo_url) && (
              <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                {tenantInfo?.logo_url ? (
                  <img 
                    src={tenantInfo.logo_url} 
                    alt="Hotel Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-primary font-bold text-xl">🏨</span>
                )}
              </div>
            )}
            <h3 className="font-semibold text-lg" style={{ 
              color: branding?.primaryColor || '#000' 
            }}>
              {hotelName || tenantInfo?.hotel_name || branding?.hotelName || 'Grand Hotel'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {roomNumber ? `Room ${roomNumber}` : assignedTo}
            </p>
            {services && services.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Services: {services.slice(0, 3).join(', ')}{services.length > 3 ? '...' : ''}
              </p>
            )}
            {!isActive && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                  Inactive
                </span>
              </div>
            )}
          </div>
          
          {/* Real QR Code */}
          <div className="border-2 border-gray-300 p-2 bg-white rounded-lg">
            <canvas 
              ref={canvasRef}
              className="block"
              style={{ width: size, height: size }}
            />
          </div>
          
          {/* Instructions */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Scan to access hotel services
            </p>
            {qrUrl && (
              <p className="text-xs text-muted-foreground mt-1 break-all">
                URL: {qrUrl}
              </p>
            )}
            <p className="text-xs font-mono text-muted-foreground mt-1">
              ID: {qrId}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownload}
          disabled={!qrDataUrl}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowPrintable(true)}
          disabled={!qrDataUrl}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        {onDelete && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};