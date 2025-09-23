import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, Palette } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTenantInfo } from '@/hooks/useTenantInfo';

interface PrintableQRCodeProps {
  qrId: string;
  assignedTo: string;
  hotelName?: string;
  roomNumber?: string;
  services?: string[];
  qrUrl?: string;
}

type PrintSize = 'small' | 'medium' | 'large' | 'poster' | 'a4';

const sizeConfigs = {
  small: { width: 300, height: 400, qrSize: 150, title: 'Small (3x4 inch)' },
  medium: { width: 400, height: 500, qrSize: 200, title: 'Medium (4x5 inch)' },
  large: { width: 600, height: 800, qrSize: 300, title: 'Large (6x8 inch)' },
  poster: { width: 800, height: 1200, qrSize: 400, title: 'Poster (8x12 inch)' },
  a4: { width: 595, height: 842, qrSize: 250, title: 'A4 Paper' }
};

export const PrintableQRCode = ({ 
  qrId, 
  assignedTo, 
  hotelName, 
  roomNumber, 
  services, 
  qrUrl 
}: PrintableQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<PrintSize>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: tenantInfo } = useTenantInfo();

  const config = sizeConfigs[selectedSize];

  useEffect(() => {
    const generateQRCode = async () => {
      if (!qrUrl || !canvasRef.current) return;
      
      try {
        const qrOptions = {
          width: config.qrSize,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M' as const
        };
        
        await QRCode.toCanvas(canvasRef.current, qrUrl, qrOptions);
        
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('QR Code generation error:', error);
      }
    };

    generateQRCode();
  }, [qrUrl, config.qrSize]);

  const handleDownloadPNG = async () => {
    if (!printableRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `qr-code-${roomNumber || assignedTo}-${selectedSize}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('PNG generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printableRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: config.height > config.width ? 'portrait' : 'landscape',
        unit: 'px',
        format: [config.width, config.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, config.width, config.height);
      pdf.save(`qr-code-${roomNumber || assignedTo}-${selectedSize}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!printableRef.current) return;
    
    const content = printableRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${roomNumber || assignedTo}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: 'Inter', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .printable-content { 
                width: ${config.width}px;
                height: ${config.height}px;
              }
              @media print {
                body { padding: 0; }
                .printable-content { 
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="printable-content">${content}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const primaryColor = '#2563eb';
  const secondaryColor = '#64748b';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedSize} onValueChange={(value: PrintSize) => setSelectedSize(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sizeConfigs).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleDownloadPNG}
            disabled={isGenerating}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={isGenerating}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div 
          ref={printableRef}
          className="bg-white border rounded-lg shadow-lg overflow-hidden"
          style={{ 
            width: config.width,
            height: config.height,
            maxWidth: '100%',
            transform: 'scale(0.8)',
            transformOrigin: 'top center'
          }}
        >
          <div 
            className="h-full flex flex-col justify-between p-8 text-center relative"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
              borderTop: `4px solid ${primaryColor}`
            }}
          >
            {/* Header */}
            <div className="space-y-4">
              {tenantInfo?.logo_url && (
                <div className="flex justify-center">
                  <img 
                    src={tenantInfo.logo_url} 
                    alt="Hotel Logo" 
                    className="h-16 object-contain"
                  />
                </div>
              )}
              
              <div>
                <h1 
                  className="text-2xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  {hotelName || tenantInfo?.hotel_name || 'Hotel'}
                </h1>
                {roomNumber && (
                  <p className="text-xl font-semibold text-gray-700">
                    Room {roomNumber}
                  </p>
                )}
                {!roomNumber && assignedTo && (
                  <p className="text-lg text-gray-600">
                    {assignedTo}
                  </p>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="bg-white p-6 rounded-xl shadow-lg border-2"
                style={{ borderColor: primaryColor }}
              >
                <canvas 
                  ref={canvasRef}
                  className="block"
                  style={{ width: config.qrSize, height: config.qrSize }}
                />
              </div>
            </div>

            {/* Services */}
            {services && services.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Available Services
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {services.slice(0, 6).map((service) => (
                    <span 
                      key={service}
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      {service}
                    </span>
                  ))}
                  {services.length > 6 && (
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: primaryColor + '20',
                        color: primaryColor
                      }}
                    >
                      +{services.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-2 text-gray-600">
              <p className="text-lg font-medium">
                📱 Scan with your phone camera
              </p>
              <p className="text-sm">
                Access hotel services instantly
              </p>
              {qrUrl && (
                <p className="text-xs text-gray-500 break-words">
                  {qrUrl}
                </p>
              )}
              <p className="text-xs font-mono text-gray-400">
                ID: {qrId}
              </p>
            </div>

            {/* Decorative Elements */}
            <div 
              className="absolute top-0 right-0 w-32 h-32 opacity-5"
              style={{
                background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`
              }}
            />
            <div 
              className="absolute bottom-0 left-0 w-24 h-24 opacity-5"
              style={{
                background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)`
              }}
            />
          </div>
        </div>
      </div>

      {isGenerating && (
        <div className="text-center text-sm text-muted-foreground">
          Generating file...
        </div>
      )}
    </div>
  );
};