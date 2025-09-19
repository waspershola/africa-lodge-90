import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scan, 
  Camera, 
  Keyboard,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Bed,
  CreditCard,
  Wrench,
  AlertCircle,
  History,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onScanComplete?: (result: ScanResult) => void;
}

interface ScanResult {
  id: string;
  type: 'room-service' | 'task' | 'payment' | 'guest-checkin' | 'unknown';
  data: string;
  timestamp: Date;
  status: 'success' | 'error' | 'processing';
  details: {
    room?: string;
    guest?: string;
    task?: string;
    amount?: number;
    action?: string;
  };
  message: string;
}

interface ScanHistory {
  id: string;
  qrData: string;
  result: ScanResult;
  scannedBy: string;
  timestamp: Date;
}

export const QRCodeScanner = ({ open, onOpenChange, onScanComplete }: QRCodeScannerProps) => {
  const [activeTab, setActiveTab] = useState("camera");
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const { toast } = useToast();

  // Mock scan history
  useEffect(() => {
    setScanHistory([
      {
        id: '1',
        qrData: 'QR_TASK_HK_305_001',
        result: {
          id: '1',
          type: 'task',
          data: 'QR_TASK_HK_305_001',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          status: 'success',
          details: {
            room: '305',
            task: 'Housekeeping - Fresh towels',
            action: 'mark_completed'
          },
          message: 'Task marked as completed'
        },
        scannedBy: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: '2',
        qrData: 'QR_PAYMENT_1234',
        result: {
          id: '2',
          type: 'payment',
          data: 'QR_PAYMENT_1234',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          status: 'success',
          details: {
            room: '201',
            guest: 'Michael Adebayo',
            amount: 125000,
            action: 'process_payment'
          },
          message: 'Payment of ₦125,000 processed successfully'
        },
        scannedBy: 'David Okafor',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: '3',
        qrData: 'QR_ROOM_102_SERVICE',
        result: {
          id: '3',
          type: 'room-service',
          data: 'QR_ROOM_102_SERVICE',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          status: 'processing',
          details: {
            room: '102',
            guest: 'Fatima Hassan',
            action: 'amenity_request'
          },
          message: 'Service request logged - extra pillows requested'
        },
        scannedBy: 'Emmanuel Obi',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      }
    ]);
  }, []);

  const handleStartCamera = () => {
    setIsScanning(true);
    toast({
      title: "Camera Started",
      description: "Point camera at QR code to scan"
    });

    // Simulate camera scanning
    setTimeout(() => {
      simulateScan("QR_ROOM_305_SERVICE");
    }, 3000);
  };

  const handleStopCamera = () => {
    setIsScanning(false);
    toast({
      title: "Camera Stopped",
      description: "Scanning paused"
    });
  };

  const handleManualScan = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive"
      });
      return;
    }
    
    simulateScan(manualCode);
    setManualCode("");
  };

  const simulateScan = (qrData: string) => {
    setIsScanning(false);
    
    // Simulate QR code processing
    const mockResult = processMockQRCode(qrData);
    setLastScanResult(mockResult);
    
    // Add to history
    const newHistoryItem: ScanHistory = {
      id: Date.now().toString(),
      qrData,
      result: mockResult,
      scannedBy: 'Current User',
      timestamp: new Date()
    };
    
    setScanHistory(prev => [newHistoryItem, ...prev]);
    
    toast({
      title: mockResult.status === 'success' ? "Scan Successful" : "Scan Error",
      description: mockResult.message,
      variant: mockResult.status === 'success' ? "default" : "destructive"
    });

    if (onScanComplete) {
      onScanComplete(mockResult);
    }
  };

  const processMockQRCode = (qrData: string): ScanResult => {
    const timestamp = new Date();
    
    if (qrData.includes('TASK_HK')) {
      return {
        id: Date.now().toString(),
        type: 'task',
        data: qrData,
        timestamp,
        status: 'success',
        details: {
          room: '305',
          task: 'Housekeeping task',
          action: 'mark_in_progress'
        },
        message: 'Housekeeping task updated to "In Progress"'
      };
    }
    
    if (qrData.includes('PAYMENT')) {
      return {
        id: Date.now().toString(),
        type: 'payment',
        data: qrData,
        timestamp,
        status: 'success',
        details: {
          room: '201',
          guest: 'Guest Name',
          amount: 75000,
          action: 'process_payment'
        },
        message: 'Payment link opened - ₦75,000'
      };
    }
    
    if (qrData.includes('ROOM') && qrData.includes('SERVICE')) {
      return {
        id: Date.now().toString(),
        type: 'room-service',
        data: qrData,
        timestamp,
        status: 'success',
        details: {
          room: qrData.match(/ROOM_(\d+)/)?.[1] || 'Unknown',
          action: 'service_request'
        },
        message: 'Guest service request logged'
      };
    }
    
    return {
      id: Date.now().toString(),
      type: 'unknown',
      data: qrData,
      timestamp,
      status: 'error',
      details: {},
      message: 'Unknown QR code format'
    };
  };

  const getResultIcon = (type: ScanResult['type'], status: ScanResult['status']) => {
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    if (status === 'processing') return <Clock className="h-5 w-5 text-yellow-500" />;
    
    switch (type) {
      case 'task': return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'payment': return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'room-service': return <Bed className="h-5 w-5 text-purple-500" />;
      case 'guest-checkin': return <User className="h-5 w-5 text-indigo-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ScanResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="camera">Camera Scan</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="history">Scan History</TabsTrigger>
      </TabsList>

      <TabsContent value="camera" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View Simulation */}
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
              {isScanning ? (
                <>
                  <div className="absolute inset-0 bg-gray-800">
                    <div className="absolute inset-4 border-2 border-white/50 rounded-lg">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-32 h-32 border-2 border-green-400 rounded-lg animate-pulse">
                          <div className="absolute inset-2 border border-green-400/50 rounded">
                            <div className="w-full h-full bg-green-400/10 rounded flex items-center justify-center">
                              <Scan className="h-8 w-8 text-green-400 animate-spin" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <p className="text-white text-sm">Scanning for QR codes...</p>
                  </div>
                </>
              ) : (
                <div className="text-center text-white">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Camera Ready</p>
                  <p className="text-sm opacity-75">Click start to begin scanning</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!isScanning ? (
                <Button onClick={handleStartCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={handleStopCamera} variant="destructive" className="flex-1">
                  Stop Scanning
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="manual" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manual-code">QR Code Data</Label>
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code manually (e.g., QR_ROOM_305_SERVICE)"
                className="font-mono"
              />
            </div>
            
            <Button onClick={handleManualScan} className="w-full" disabled={!manualCode.trim()}>
              <Zap className="h-4 w-4 mr-2" />
              Process QR Code
            </Button>

            <div className="text-sm text-muted-foreground">
              <p><strong>Common formats:</strong></p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• QR_ROOM_[number]_SERVICE - Guest service requests</li>
                <li>• QR_TASK_HK_[room]_[id] - Housekeeping tasks</li>
                <li>• QR_PAYMENT_[folio] - Payment processing</li>
                <li>• QR_CHECKIN_[booking] - Guest check-in</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scan history yet</p>
                  <p className="text-sm">Your QR code scans will appear here</p>
                </div>
              ) : (
                scanHistory.map((scan) => (
                  <div key={scan.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getResultIcon(scan.result.type, scan.result.status)}
                        <span className="font-medium">{scan.result.message}</span>
                      </div>
                      <Badge className={getStatusColor(scan.result.status)}>
                        {scan.result.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>QR Data:</strong> <code className="bg-gray-100 px-1 rounded">{scan.qrData}</code></p>
                      {scan.result.details.room && <p><strong>Room:</strong> {scan.result.details.room}</p>}
                      {scan.result.details.guest && <p><strong>Guest:</strong> {scan.result.details.guest}</p>}
                      {scan.result.details.amount && <p><strong>Amount:</strong> ₦{scan.result.details.amount.toLocaleString()}</p>}
                      <p><strong>Scanned by:</strong> {scan.scannedBy}</p>
                      <p><strong>Time:</strong> {scan.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  // Show last scan result if available
  const lastScanDisplay = lastScanResult && (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {getResultIcon(lastScanResult.type, lastScanResult.status)}
          <div className="flex-1">
            <p className="font-medium">{lastScanResult.message}</p>
            <p className="text-sm text-muted-foreground">
              Scanned {lastScanResult.timestamp.toLocaleTimeString()}
            </p>
          </div>
          <Badge className={getStatusColor(lastScanResult.status)}>
            {lastScanResult.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (open !== undefined) {
    // Dialog mode
    return (
      <Dialog open={open || false} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              QR Code Scanner
            </DialogTitle>
          </DialogHeader>
          {lastScanDisplay}
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone mode
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Scan className="h-5 w-5" />
        <h2 className="text-xl font-semibold">QR Code Scanner</h2>
      </div>
      {lastScanDisplay}
      {renderContent()}
    </div>
  );
};