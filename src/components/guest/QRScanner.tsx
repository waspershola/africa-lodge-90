import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface QRScannerProps {
  onScan: (token: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const extractTokenFromURL = (text: string): string => {
    try {
      const url = new URL(text);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || text;
    } catch {
      return text;
    }
  };

  const startCameraScanning = async () => {
    try {
      setIsScanning(true);
      const scanner = new Html5Qrcode("qr-scanner-element");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          const token = extractTokenFromURL(decodedText);
          onScan(token);
          stopScanning();
        },
        (errorMessage) => {
          console.warn('QR scan error:', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      onError?.(err.message || 'Camera access denied');
      setScanMode('upload');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      const scanner = new Html5Qrcode("qr-file-scanner");
      const decodedText = await scanner.scanFile(file, false);
      const token = extractTokenFromURL(decodedText);
      onScan(token);
    } catch (err: any) {
      onError?.('Could not read QR code from image');
    }
  };

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      onScan(manualToken.trim());
    }
  };

  useEffect(() => {
    if (scanMode === 'camera') {
      startCameraScanning();
    }
    return () => {
      stopScanning();
    };
  }, [scanMode]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex gap-2 justify-center">
        <Button
          variant={scanMode === 'camera' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('camera')}
        >
          <Camera className="w-4 h-4 mr-2" />
          Camera
        </Button>
        <Button
          variant={scanMode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('upload')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button
          variant={scanMode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('manual')}
        >
          <Type className="w-4 h-4 mr-2" />
          Manual
        </Button>
      </div>

      {scanMode === 'camera' && (
        <div className="space-y-2">
          <div id="qr-scanner-element" className="rounded-lg overflow-hidden border"></div>
          {isScanning && (
            <p className="text-sm text-muted-foreground text-center">
              Point camera at QR code
            </p>
          )}
        </div>
      )}

      {scanMode === 'upload' && (
        <div className="space-y-2">
          <div id="qr-file-scanner" className="hidden"></div>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground text-center">
            Upload an image containing a QR code
          </p>
        </div>
      )}

      {scanMode === 'manual' && (
        <div className="space-y-2">
          <Input
            placeholder="Enter QR token"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <Button onClick={handleManualSubmit} className="w-full">
            Submit Token
          </Button>
        </div>
      )}
    </Card>
  );
}
