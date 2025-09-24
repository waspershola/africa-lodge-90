import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, Palette, FileImage, FileText, CreditCard } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { getThemeInfo, getThemeClassName, getDefaultTheme } from '@/utils/themeUtils';
import { A4PosterTemplate } from './templates/A4PosterTemplate';
import { FlyerTemplate } from './templates/FlyerTemplate';
import { TentCardTemplate } from './templates/TentCardTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';

interface PrintableQRCodeProps {
  qrId: string;
  assignedTo: string;
  hotelName?: string;
  roomNumber?: string;
  services?: string[];
  qrUrl?: string;
  themeId?: string;
}

type PrintTemplate = 'classic' | 'a4-poster' | 'flyer' | 'tent-card';
type PrintSize = 'small' | 'medium' | 'large' | 'poster' | 'a4';

const templateConfigs = {
  'classic': { width: 400, height: 500, qrSize: 320, title: 'Classic Card', icon: CreditCard },
  'a4-poster': { width: 595, height: 842, qrSize: 480, title: 'A4 Poster', icon: FileText },
  'flyer': { width: 600, height: 400, qrSize: 280, title: 'Flyer (Landscape)', icon: FileImage },
  'tent-card': { width: 350, height: 250, qrSize: 220, title: 'Tent Card', icon: CreditCard }
};

const sizeConfigs = {
  small: { scale: 0.7, title: 'Small' },
  medium: { scale: 1.0, title: 'Medium' },
  large: { scale: 1.3, title: 'Large' },
  poster: { scale: 1.6, title: 'Poster' },
  a4: { scale: 1.4, title: 'A4 Size' }
};

export const PrintableQRCode = ({ 
  qrId, 
  assignedTo, 
  hotelName, 
  roomNumber, 
  services, 
  qrUrl,
  themeId 
}: PrintableQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate>('classic');
  const [selectedSize, setSelectedSize] = useState<PrintSize>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: tenantInfo } = useTenantInfo();

  const currentThemeId = themeId || getDefaultTheme();
  const themeInfo = getThemeInfo(currentThemeId);
  const templateConfig = templateConfigs[selectedTemplate];
  const sizeConfig = sizeConfigs[selectedSize];

  useEffect(() => {
    const generateQRCode = async () => {
      if (!qrUrl || !canvasRef.current) {
        console.log('QR generation skipped:', { qrUrl, hasCanvas: !!canvasRef.current });
        return;
      }
      
      try {
        console.log('Generating QR code for:', qrUrl);
        
        // Theme-aware QR code colors
        const isDarkTheme = themeInfo?.colors.background === '#000000' || themeInfo?.colors.background === '#1A1A1A' || themeInfo?.colors.background === '#0F4C3A';
        
        const qrOptions = {
          width: Math.floor(templateConfig.qrSize * sizeConfig.scale),
          margin: 2,
          color: {
            dark: themeInfo?.colors.primary || '#000000',
            light: isDarkTheme ? themeInfo?.colors.background || '#FFFFFF' : '#FFFFFF'
          },
          errorCorrectionLevel: 'M' as const
        };
        
        console.log('QR options:', qrOptions);
        
        await QRCode.toCanvas(canvasRef.current, qrUrl, qrOptions);
        
        const dataUrl = canvasRef.current.toDataURL('image/png');
        console.log('QR data URL generated:', dataUrl.length > 0 ? 'Success' : 'Failed');
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('QR Code generation error:', error);
      }
    };

    generateQRCode();
  }, [qrUrl, templateConfig.qrSize, sizeConfig.scale, themeInfo, currentThemeId]);

  const handleDownloadPNG = async () => {
    if (!printableRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 3,
        backgroundColor: themeInfo?.colors.background || '#ffffff',
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true
      });
      
      const link = document.createElement('a');
      link.download = `qr-${selectedTemplate}-${roomNumber || assignedTo}-${currentThemeId}.png`;
      link.href = canvas.toDataURL('image/png', 0.95);
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
        scale: 3,
        backgroundColor: themeInfo?.colors.background || '#ffffff',
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true
      });
      
      const imgData = canvas.toDataURL('image/png', 0.95);
      const finalWidth = Math.floor(templateConfig.width * sizeConfig.scale);
      const finalHeight = Math.floor(templateConfig.height * sizeConfig.scale);
      
      const pdf = new jsPDF({
        orientation: finalHeight > finalWidth ? 'portrait' : 'landscape',
        unit: 'px',
        format: [finalWidth, finalHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      pdf.save(`qr-${selectedTemplate}-${roomNumber || assignedTo}-${currentThemeId}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!printableRef.current) return;
    
    const content = printableRef.current.innerHTML;
    const finalWidth = Math.floor(templateConfig.width * sizeConfig.scale);
    const finalHeight = Math.floor(templateConfig.height * sizeConfig.scale);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR ${selectedTemplate} - ${roomNumber || assignedTo}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: '${themeInfo?.fontBody || 'Inter'}', sans-serif;
                background: ${themeInfo?.colors.background || '#ffffff'};
                color: ${themeInfo?.colors.primary || '#000000'};
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .printable-content { 
                width: ${finalWidth}px;
                height: ${finalHeight}px;
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

  const renderTemplate = () => {
    const templateProps = {
      qrId,
      assignedTo,
      hotelName: hotelName || tenantInfo?.hotel_name || 'Hotel',
      roomNumber,
      services,
      qrDataUrl,
      themeInfo,
      tenantInfo,
      templateConfig,
      sizeConfig
    };

    switch (selectedTemplate) {
      case 'a4-poster':
        return <A4PosterTemplate {...templateProps} />;
      case 'flyer':
        return <FlyerTemplate {...templateProps} />;
      case 'tent-card':
        return <TentCardTemplate {...templateProps} />;
      default:
        return <ClassicTemplate {...templateProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedTemplate} onValueChange={(value: PrintTemplate) => setSelectedTemplate(value)}>
          <SelectTrigger className="w-48">
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

        <Select value={selectedSize} onValueChange={(value: PrintSize) => setSelectedSize(value)}>
          <SelectTrigger className="w-32">
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
          className={`border rounded-lg shadow-lg overflow-hidden ${getThemeClassName(currentThemeId)}`}
          style={{ 
            width: Math.floor(templateConfig.width * sizeConfig.scale),
            height: Math.floor(templateConfig.height * sizeConfig.scale),
            maxWidth: '100%',
            transform: 'scale(0.8)',
            transformOrigin: 'top center'
          }}
        >
          {renderTemplate()}
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