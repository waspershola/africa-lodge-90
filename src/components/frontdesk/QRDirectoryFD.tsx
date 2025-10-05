import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  QrCode, 
  Download, 
  Printer, 
  Share, 
  Search,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQRDirectory } from "@/hooks/data/useQRDirectory";
import type { QRCodeInfo } from "@/hooks/data/useQRDirectory";

interface OldQRCodeInfo {
  id: string;
  roomNumber: string;
  guestName?: string;
  qrStatus: 'active' | 'inactive' | 'expired';
  services: string[];
  lastScanned?: Date;
  guestPhone?: string;
  guestEmail?: string;
  checkInDate?: string;
  checkOutDate?: string;
  qrUrl: string;
  issuedBy: string;
}

// Mock QR codes data - integrated with unified per-room model
const mockQRCodes: QRCodeInfo[] = [
  {
    id: 'QR_101',
    roomNumber: '101',
    qrStatus: 'active',
    services: ['Wi-Fi', 'Housekeeping', 'Maintenance'],
    qrUrl: 'https://hotel.app/qr/room/101',
    issuedBy: 'Hotel Manager'
  },
  {
    id: 'QR_102',
    roomNumber: '102',
    guestName: 'John Doe',
    qrStatus: 'active',
    services: ['Wi-Fi', 'Room Service', 'Housekeeping', 'Maintenance', 'Menu'],
    lastScanned: new Date(Date.now() - 2 * 60 * 60 * 1000),
    guestPhone: '+234-8012-345-678',
    guestEmail: 'john.doe@email.com',
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-18',
    qrUrl: 'https://hotel.app/qr/room/102',
    issuedBy: 'Hotel Manager'
  },
  {
    id: 'QR_201',
    roomNumber: '201',
    guestName: 'Mike Wilson',
    qrStatus: 'active',
    services: ['Wi-Fi', 'Room Service', 'Housekeeping', 'Maintenance', 'Digital Menu'],
    lastScanned: new Date(Date.now() - 30 * 60 * 1000),
    guestPhone: '+234-8087-654-321',
    guestEmail: 'mike.wilson@email.com',
    checkInDate: '2024-01-14',
    checkOutDate: '2024-01-20',
    qrUrl: 'https://hotel.app/qr/room/201',
    issuedBy: 'Hotel Manager'
  },
  {
    id: 'QR_203',
    roomNumber: '203',
    qrStatus: 'inactive',
    services: ['Wi-Fi', 'Maintenance'],
    qrUrl: 'https://hotel.app/qr/room/203',
    issuedBy: 'Hotel Manager'
  },
  {
    id: 'QR_POOL',
    roomNumber: 'Poolside Bar',
    qrStatus: 'active',
    services: ['Menu', 'Events'],
    lastScanned: new Date(Date.now() - 45 * 60 * 1000),
    qrUrl: 'https://hotel.app/qr/location/pool',
    issuedBy: 'Hotel Manager'
  }
];

export const QRDirectoryFD = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: qrCodes = [], isLoading } = useQRDirectory();
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    action: string;
    roomNumber: string;
    staff: string;
    timestamp: Date;
    details: string;
  }>>([]);
  const { toast } = useToast();

  const filteredQRCodes = qrCodes.filter(qr => 
    qr.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qr.guestName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const logAction = (action: string, roomNumber: string, details: string) => {
    const newLog = {
      id: Date.now().toString(),
      action,
      roomNumber,
      staff: 'Front Desk Staff', // Would be actual logged-in user
      timestamp: new Date(),
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleDownloadQR = (qrCode: QRCodeInfo) => {
    logAction('Download QR', qrCode.roomNumber, `Downloaded QR code for printing`);
    toast({
      title: "QR Code Downloaded",
      description: `QR code for ${qrCode.roomNumber} downloaded successfully`,
    });
  };

  const handlePrintQR = (qrCode: QRCodeInfo) => {
    logAction('Print QR', qrCode.roomNumber, `Printed QR code`);
    toast({
      title: "QR Code Printed",
      description: `QR code for ${qrCode.roomNumber} sent to printer`,
    });
  };

  const handleShareQR = (qrCode: QRCodeInfo, method: 'whatsapp' | 'email' | 'sms') => {
    logAction('Share QR', qrCode.roomNumber, `Shared QR code via ${method}`);
    
    let message = '';
    switch (method) {
      case 'whatsapp':
        message = `WhatsApp message sent to guest`;
        break;
      case 'email':
        message = `Email sent to ${qrCode.guestEmail}`;
        break;
      case 'sms':
        message = `SMS sent to ${qrCode.guestPhone}`;
        break;
    }

    toast({
      title: "QR Code Shared",
      description: message,
    });
  };

  const handleResendQR = (qrCode: QRCodeInfo) => {
    logAction('Resend QR', qrCode.roomNumber, `Re-issued QR code to guest`);
    toast({
      title: "QR Code Re-issued",
      description: `Secure link generated and sent to guest in ${qrCode.roomNumber}`,
    });
  };

  const getStatusIcon = (status: QRCodeInfo['qrStatus']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-danger" />;
    }
  };

  const getStatusColor = (status: QRCodeInfo['qrStatus']) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'inactive':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'expired':
        return 'bg-danger/10 text-danger border-danger/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">QR Code Directory</h2>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Read-Only Access
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by room or guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{qrCodes.filter(q => q.qrStatus === 'active').length}</div>
            <div className="text-sm text-muted-foreground">Active QR Codes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{qrCodes.filter(q => q.guestName).length}</div>
            <div className="text-sm text-muted-foreground">Assigned to Guests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{qrCodes.filter(q => q.lastScanned && Date.now() - q.lastScanned.getTime() < 24 * 60 * 60 * 1000).length}</div>
            <div className="text-sm text-muted-foreground">Scanned Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{auditLogs.length}</div>
            <div className="text-sm text-muted-foreground">Actions Logged</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Codes Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading QR codes...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
        {filteredQRCodes.map((qrCode) => (
          <Card key={qrCode.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-variant rounded-lg flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1">
                        {getStatusIcon(qrCode.qrStatus)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {qrCode.roomNumber.includes('Room') ? qrCode.roomNumber : `Room ${qrCode.roomNumber}`}
                        </h3>
                        <Badge className={getStatusColor(qrCode.qrStatus)}>
                          {qrCode.qrStatus.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {qrCode.guestName ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {qrCode.guestName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{qrCode.guestName}</span>
                          {qrCode.checkInDate && (
                            <Badge variant="outline" className="text-xs">
                              {qrCode.checkInDate} - {qrCode.checkOutDate}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground mb-2">No guest assigned</div>
                      )}
                      
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-xs text-muted-foreground">Services:</span>
                        <div className="flex flex-wrap gap-1">
                          {qrCode.services.map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {qrCode.lastScanned && (
                        <div className="text-xs text-muted-foreground">
                          Last scanned: {qrCode.lastScanned.toLocaleDateString()} at {qrCode.lastScanned.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleDownloadQR(qrCode)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrintQR(qrCode)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {qrCode.guestName && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleResendQR(qrCode)}>
                        <Smartphone className="h-4 w-4 mr-1" />
                        Resend QR
                      </Button>
                    </div>
                  )}
                  
                  {qrCode.guestName && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleShareQR(qrCode, 'whatsapp')}>
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleShareQR(qrCode, 'sms')}>
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleShareQR(qrCode, 'email')}>
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Recent Audit Log */}
      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Actions (Security Audit)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <span className="text-sm">Room {log.roomNumber}</span>
                    <span className="text-xs text-muted-foreground">{log.details}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.staff} • {log.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredQRCodes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No QR Codes Found</h3>
            <p className="text-muted-foreground">
              No QR codes match your search criteria. QR codes are created by Hotel Managers in the Owner Dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};