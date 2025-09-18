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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QRCode {
  id: string;
  type: 'room' | 'task' | 'payment' | 'guest-request';
  title: string;
  description: string;
  roomNumber?: string;
  qrToken: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'used' | 'expired';
  scanCount: number;
}

const mockQRCodes: QRCode[] = [
  {
    id: '1',
    type: 'room',
    title: 'Room 301 Guest Services',
    description: 'Guest amenity requests for Room 301',
    roomNumber: '301',
    qrToken: 'ROOM_301_GUEST_QR',
    createdAt: new Date('2024-09-18T10:00:00'),
    status: 'active',
    scanCount: 3
  },
  {
    id: '2',
    type: 'task',
    title: 'AC Maintenance - Room 205',
    description: 'Air conditioning repair task',
    roomNumber: '205',
    qrToken: 'TASK_AC_REPAIR_205',
    createdAt: new Date('2024-09-18T09:30:00'),
    expiresAt: new Date('2024-09-18T18:00:00'),
    status: 'active',
    scanCount: 1
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment QR - Guest John Doe',
    description: 'Room 410 folio payment',
    roomNumber: '410',
    qrToken: 'PAY_JOHN_DOE_410',
    createdAt: new Date('2024-09-18T08:15:00'),
    expiresAt: new Date('2024-09-18T20:00:00'),
    status: 'used',
    scanCount: 1
  }
];

export const QRCodeManager = ({ open, onOpenChange }: QRCodeManagerProps) => {
  const [activeTab, setActiveTab] = useState("generate");
  const [qrCodes, setQrCodes] = useState<QRCode[]>(mockQRCodes);
  const [newQR, setNewQR] = useState({
    type: 'room' as QRCode['type'],
    title: '',
    description: '',
    roomNumber: '',
    expiresIn: '24' // hours
  });
  const { toast } = useToast();

  const handleGenerateQR = () => {
    if (!newQR.title || !newQR.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    const qrCode: QRCode = {
      id: Date.now().toString(),
      type: newQR.type,
      title: newQR.title,
      description: newQR.description,
      roomNumber: newQR.roomNumber || undefined,
      qrToken: `${newQR.type.toUpperCase()}_${Date.now()}`,
      createdAt: new Date(),
      expiresAt: newQR.expiresIn ? new Date(Date.now() + parseInt(newQR.expiresIn) * 60 * 60 * 1000) : undefined,
      status: 'active',
      scanCount: 0
    };

    setQrCodes(prev => [qrCode, ...prev]);
    setNewQR({
      type: 'room',
      title: '',
      description: '',
      roomNumber: '',
      expiresIn: '24'
    });

    toast({
      title: "QR Code Generated",
      description: `Created ${newQR.type} QR code: ${newQR.title}`
    });
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Token Copied",
      description: "QR token copied to clipboard"
    });
  };

  const getTypeIcon = (type: QRCode['type']) => {
    switch (type) {
      case 'room': return <Bed className="h-4 w-4" />;
      case 'task': return <Wrench className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'guest-request': return <Users className="h-4 w-4" />;
      default: return <QrCode className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: QRCode['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      used: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status]}>
        {status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === 'used' && <Clock className="h-3 w-3 mr-1" />}
        {status === 'expired' && <AlertCircle className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Management Center
          </DialogTitle>
        </DialogHeader>

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
                            Room Guest Services
                          </div>
                        </SelectItem>
                        <SelectItem value="task">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Staff Task/Maintenance
                          </div>
                        </SelectItem>
                        <SelectItem value="payment">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Collection
                          </div>
                        </SelectItem>
                        <SelectItem value="guest-request">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Guest Request Form
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="room-number">Room Number (Optional)</Label>
                    <Input
                      id="room-number"
                      value={newQR.roomNumber}
                      onChange={(e) => setNewQR(prev => ({ ...prev, roomNumber: e.target.value }))}
                      placeholder="e.g., 301"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="qr-title">Title *</Label>
                  <Input
                    id="qr-title"
                    value={newQR.title}
                    onChange={(e) => setNewQR(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief title for this QR code"
                  />
                </div>

                <div>
                  <Label htmlFor="qr-description">Description *</Label>
                  <Textarea
                    id="qr-description"
                    value={newQR.description}
                    onChange={(e) => setNewQR(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What will happen when this QR code is scanned?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="expires-in">Expires In (Hours)</Label>
                  <Select value={newQR.expiresIn} onValueChange={(value) => setNewQR(prev => ({ ...prev, expiresIn: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="4">4 Hours</SelectItem>
                      <SelectItem value="8">8 Hours</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                      <SelectItem value="168">1 Week</SelectItem>
                      <SelectItem value="">Never Expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGenerateQR} className="flex-1">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {qrCodes.filter(qr => qr.status === 'active').map((qrCode) => (
                <Card key={qrCode.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getTypeIcon(qrCode.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{qrCode.title}</h3>
                            {qrCode.roomNumber && (
                              <Badge variant="outline">Room {qrCode.roomNumber}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{qrCode.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {qrCode.createdAt.toLocaleString()}</span>
                            {qrCode.expiresAt && (
                              <span>Expires: {qrCode.expiresAt.toLocaleString()}</span>
                            )}
                            <span>Scans: {qrCode.scanCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(qrCode.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyToken(qrCode.qrToken)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Token
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4 mr-1" />
                          Print
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
                  <div className="text-2xl font-bold text-green-600">
                    {qrCodes.filter(qr => qr.status === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Currently Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              {qrCodes.map((qrCode) => (
                <Card key={qrCode.id} className="hover:bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(qrCode.type)}
                        <div>
                          <div className="font-medium text-sm">{qrCode.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {qrCode.createdAt.toLocaleDateString()} • {qrCode.scanCount} scans
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(qrCode.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};