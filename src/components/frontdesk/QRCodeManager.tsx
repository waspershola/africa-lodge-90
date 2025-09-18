import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Wrench, 
  Bed, 
  CreditCard,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeManagerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface QRCode {
  id: string;
  type: 'room' | 'task' | 'payment';
  title: string;
  room?: string;
  data: string;
  url: string;
  status: 'active' | 'expired' | 'used';
  createdAt: Date;
  usedAt?: Date;
  scans: number;
  purpose: string;
}

export const QRCodeManager = ({ open, onOpenChange }: QRCodeManagerProps = {}) => {
  const [activeTab, setActiveTab] = useState("generate");
  const [newQR, setNewQR] = useState({
    type: 'room' as QRCode['type'],
    room: '',
    purpose: '',
    notes: ''
  });
  const { toast } = useToast();

  const [qrCodes] = useState<QRCode[]>([
    {
      id: '1',
      type: 'room',
      title: 'Room 305 Service Request',
      room: '305',
      data: 'QR_ROOM_305_SERVICE',
      url: 'https://hotel.app/qr/room/305/service',
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      scans: 3,
      purpose: 'Guest amenity requests'
    },
    {
      id: '2', 
      type: 'task',
      title: 'Housekeeping - Room 201',
      room: '201',
      data: 'QR_TASK_HK_201_001',
      url: 'https://hotel.app/qr/task/hk/201/001',
      status: 'used',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      usedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      scans: 1,
      purpose: 'Housekeeping task completion'
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment QR - Folio #1234',
      data: 'QR_PAYMENT_1234',
      url: 'https://hotel.app/qr/payment/1234',
      status: 'active',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      scans: 0,
      purpose: 'Guest self-service payment'
    }
  ]);

  const handleGenerateQR = () => {
    toast({
      title: "QR Code Generated",
      description: `New ${newQR.type} QR code created successfully`
    });
    setNewQR({ type: 'room', room: '', purpose: '', notes: '' });
  };

  const handleDownload = (qrCode: QRCode) => {
    toast({
      title: "QR Code Downloaded",
      description: `${qrCode.title} downloaded as PNG`
    });
  };

  const handlePrint = (qrCode: QRCode) => {
    toast({
      title: "QR Code Printed",
      description: `${qrCode.title} sent to printer`
    });
  };

  const handleCopy = (qrCode: QRCode) => {
    navigator.clipboard.writeText(qrCode.url);
    toast({
      title: "URL Copied",
      description: "QR code URL copied to clipboard"
    });
  };

  const handleDeactivate = (qrCodeId: string) => {
    toast({
      title: "QR Code Deactivated",
      description: "QR code has been deactivated"
    });
  };

  const getStatusColor = (status: QRCode['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="generate">Generate New</TabsTrigger>
        <TabsTrigger value="active">Active QR Codes</TabsTrigger>
        <TabsTrigger value="history">History & Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate New QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qr-type">QR Code Type</Label>
                <Select value={newQR.type} onValueChange={(value: QRCode['type']) => setNewQR(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        Room Service Request
                      </div>
                    </SelectItem>
                    <SelectItem value="task">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Staff Task
                      </div>
                    </SelectItem>
                    <SelectItem value="payment">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment QR
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newQR.type === 'room' && (
                <div>
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    value={newQR.room}
                    onChange={(e) => setNewQR(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., 305"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="purpose">Purpose/Description</Label>
              <Input
                id="purpose"
                value={newQR.purpose}
                onChange={(e) => setNewQR(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Brief description of QR code purpose"
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={newQR.notes}
                onChange={(e) => setNewQR(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Special instructions or notes"
                rows={3}
              />
            </div>

            <Button onClick={handleGenerateQR} className="w-full">
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="active" className="space-y-4">
        <div className="grid gap-4">
          {qrCodes.filter(qr => qr.status === 'active').map((qrCode) => (
            <Card key={qrCode.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{qrCode.title}</h3>
                      <Badge className={getStatusColor(qrCode.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{qrCode.purpose}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {qrCode.createdAt.toLocaleDateString()}</span>
                      <span>Scans: {qrCode.scans}</span>
                      {qrCode.room && <span>Room: {qrCode.room}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(qrCode)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrint(qrCode)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(qrCode)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeactivate(qrCode.id)}>
                      Deactivate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{qrCodes.length}</div>
              <div className="text-sm text-muted-foreground">Total Generated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{qrCodes.filter(q => q.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Currently Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {qrCodes.reduce((sum, qr) => sum + qr.scans, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Scans</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {qrCodes.map((qrCode) => (
            <Card key={qrCode.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{qrCode.title}</h3>
                      <Badge className={getStatusColor(qrCode.status)}>
                        {qrCode.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {qrCode.status === 'used' && <Clock className="h-3 w-3 mr-1" />}
                        {qrCode.status === 'expired' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {qrCode.status.charAt(0).toUpperCase() + qrCode.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{qrCode.purpose}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {qrCode.createdAt.toLocaleDateString()}</span>
                      <span>Scans: {qrCode.scans}</span>
                      {qrCode.room && <span>Room: {qrCode.room}</span>}
                      {qrCode.usedAt && <span>Used: {qrCode.usedAt.toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );

  if (open !== undefined) {
    // Dialog mode
    return (
      <Dialog open={open || false} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Management Center
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone panel mode
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <QrCode className="h-5 w-5" />
        <h2 className="text-xl font-semibold">QR Code Management Center</h2>
      </div>
      {renderContent()}
    </div>
  );
};