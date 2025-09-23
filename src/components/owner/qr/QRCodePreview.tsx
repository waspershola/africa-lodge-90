import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { BrandingSettings } from './GlobalSettingsDialog';
import QRCode from 'qrcode';

interface QRCodePreviewProps {
  qrId: string;
  assignedTo: string;
  size?: number;
  branding?: BrandingSettings;
  hotelName?: string;
  roomNumber?: string;
  services?: string[];
  qrUrl?: string;
  onQRGenerated?: (qrDataUrl: string) => void;
}

export const QRCodePreview = ({ qrId, assignedTo, size = 200, branding, hotelName, roomNumber, services, qrUrl, onQRGenerated }: QRCodePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateRealQRCode = async () => {
      if (!qrUrl || !canvasRef.current) return;
      
      try {
        // Generate QR code with proper options for phone scanning
        const qrOptions = {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
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
  }, [qrUrl, size, onQRGenerated]);

  return (
    <div ref={containerRef} className="flex flex-col items-center space-y-4">
      <Card className="p-4">
        <CardContent className="p-0 flex flex-col items-center space-y-3">
          {/* Hotel Branding */}
          <div className="text-center">
            {branding?.showLogo && (
              <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xl">🏨</span>
              </div>
            )}
            <h3 className="font-semibold text-lg" style={{ color: branding?.primaryColor || '#000' }}>
              {hotelName || branding?.hotelName || 'Grand Hotel'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {roomNumber ? `Room ${roomNumber}` : assignedTo}
            </p>
            {services && services.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Services: {services.slice(0, 3).join(', ')}{services.length > 3 ? '...' : ''}
              </p>
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
    </div>
  );
};