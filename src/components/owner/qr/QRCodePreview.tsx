import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { BrandingSettings } from './GlobalSettingsDialog';

interface QRCodePreviewProps {
  qrId: string;
  assignedTo: string;
  size?: number;
  branding?: BrandingSettings;
  hotelName?: string;
  roomNumber?: string;
  services?: string[];
  qrUrl?: string;
}

export const QRCodePreview = ({ qrId, assignedTo, size = 200, branding, hotelName, roomNumber, services, qrUrl }: QRCodePreviewProps) => {
  // Generate a visual representation of QR code (placeholder)
  const generateQRPattern = (id: string) => {
    const patterns = [];
    const gridSize = 21; // Standard QR code grid
    
    // Create a deterministic but random-looking pattern based on ID
    for (let i = 0; i < gridSize; i++) {
      const row = [];
      for (let j = 0; j < gridSize; j++) {
        // Use ID hash to determine if cell should be filled
        const hash = (id.charCodeAt(i % id.length) + i * j) % 100;
        row.push(hash > 50);
      }
      patterns.push(row);
    }
    
    return patterns;
  };

  const pattern = generateQRPattern(qrId);
  const cellSize = size / 21;

  return (
    <div className="flex flex-col items-center space-y-4">
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
          
          {/* QR Code Pattern */}
          <div 
            className="border-2 border-gray-300 p-2 bg-white"
            style={{ width: size + 16, height: size + 16 }}
          >
            <svg width={size} height={size} viewBox={`0 0 21 21`}>
              {pattern.map((row, i) =>
                row.map((filled, j) => (
                  <rect
                    key={`${i}-${j}`}
                    x={j}
                    y={i}
                    width={1}
                    height={1}
                    fill={filled ? '#000' : '#fff'}
                  />
                ))
              )}
              
              {/* Corner squares (standard QR code markers) */}
              {/* Top-left */}
              <rect x="0" y="0" width="7" height="7" fill="#000" />
              <rect x="1" y="1" width="5" height="5" fill="#fff" />
              <rect x="2" y="2" width="3" height="3" fill="#000" />
              
              {/* Top-right */}
              <rect x="14" y="0" width="7" height="7" fill="#000" />
              <rect x="15" y="1" width="5" height="5" fill="#fff" />
              <rect x="16" y="2" width="3" height="3" fill="#000" />
              
              {/* Bottom-left */}
              <rect x="0" y="14" width="7" height="7" fill="#000" />
              <rect x="1" y="15" width="5" height="5" fill="#fff" />
              <rect x="2" y="16" width="3" height="3" fill="#000" />
            </svg>
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