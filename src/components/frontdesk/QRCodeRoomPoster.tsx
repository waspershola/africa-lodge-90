import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Download, 
  Printer, 
  Eye,
  Bed,
  Utensils,
  Wifi,
  Phone,
  Users,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeRoomPosterProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  roomNumber?: string;
}

interface RoomQRCode {
  id: string;
  type: 'service' | 'amenities' | 'wifi' | 'room-service' | 'concierge' | 'checkout';
  title: string;
  description: string;
  icon: React.ReactNode;
  qrData: string;
  color: string;
}

const qrCodeTypes: RoomQRCode[] = [
  {
    id: 'service',
    type: 'service',
    title: 'Request Service',
    description: 'Housekeeping, maintenance, extra towels',
    icon: <Bed className="h-5 w-5" />,
    qrData: 'SERVICE_REQUEST',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'amenities',
    type: 'amenities', 
    title: 'Order Amenities',
    description: 'Toiletries, linens, pillows',
    icon: <Settings className="h-5 w-5" />,
    qrData: 'AMENITIES_ORDER',
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'room-service',
    type: 'room-service',
    title: 'Room Service Menu',
    description: 'Food & beverage delivery',
    icon: <Utensils className="h-5 w-5" />,
    qrData: 'ROOM_SERVICE_MENU',
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'wifi',
    type: 'wifi',
    title: 'WiFi Access',
    description: 'Connect to hotel WiFi',
    icon: <Wifi className="h-5 w-5" />,
    qrData: 'WIFI_CONNECT',
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'concierge',
    type: 'concierge',
    title: 'Concierge Services',
    description: 'Tours, reservations, assistance',
    icon: <Users className="h-5 w-5" />,
    qrData: 'CONCIERGE_REQUEST',
    color: 'bg-indigo-50 border-indigo-200'
  },
  {
    id: 'checkout',
    type: 'checkout',
    title: 'Express Checkout',
    description: 'Quick checkout & bill settlement',
    icon: <Phone className="h-5 w-5" />,
    qrData: 'EXPRESS_CHECKOUT',
    color: 'bg-red-50 border-red-200'
  }
];

export const QRCodeRoomPoster = ({ open, onOpenChange, roomNumber: initialRoom }: QRCodeRoomPosterProps) => {
  const [selectedRoom, setSelectedRoom] = useState(initialRoom || "");
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['service', 'amenities', 'room-service', 'wifi']);
  const [posterLayout, setPosterLayout] = useState<'standard' | 'compact' | 'door-hanger'>('standard');
  const { toast } = useToast();

  const handleToggleCode = (codeId: string) => {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const handleDownloadPoster = () => {
    toast({
      title: "Poster Downloaded",
      description: `Room ${selectedRoom} QR poster saved as PDF`
    });
  };

  const handlePrintPoster = () => {
    toast({
      title: "Poster Printed",
      description: `Room ${selectedRoom} QR poster sent to printer`
    });
  };

  const handlePreview = () => {
    toast({
      title: "Preview Generated",
      description: "QR poster preview opened in new window"
    });
  };

  const getLayoutDescription = (layout: string) => {
    switch (layout) {
      case 'standard': return 'A4 poster with all QR codes in grid layout';
      case 'compact': return 'Half-page poster with essential QRs only';
      case 'door-hanger': return 'Door hanger format with key QR codes';
      default: return '';
    }
  };

  const selectedQRs = qrCodeTypes.filter(qr => selectedCodes.includes(qr.id));

  const renderContent = () => (
    <div className="space-y-6">
      {/* Room Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="room">Room Number</Label>
          <Input
            id="room"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            placeholder="e.g., 305"
            className="font-mono text-lg"
          />
        </div>

        <div>
          <Label htmlFor="layout">Poster Layout</Label>
          <Select value={posterLayout} onValueChange={(value: any) => setPosterLayout(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">
                <div>
                  <div className="font-medium">Standard Poster</div>
                  <div className="text-sm text-muted-foreground">A4 full page</div>
                </div>
              </SelectItem>
              <SelectItem value="compact">
                <div>
                  <div className="font-medium">Compact Poster</div>
                  <div className="text-sm text-muted-foreground">Half page</div>
                </div>
              </SelectItem>
              <SelectItem value="door-hanger">
                <div>
                  <div className="font-medium">Door Hanger</div>
                  <div className="text-sm text-muted-foreground">Fits door handle</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            {getLayoutDescription(posterLayout)}
          </p>
        </div>
      </div>

      {/* QR Code Selection */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Select QR Codes to Include</Label>
          <Badge variant="outline">
            {selectedCodes.length} of {qrCodeTypes.length} selected
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qrCodeTypes.map((qrType) => (
            <Card 
              key={qrType.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedCodes.includes(qrType.id) 
                  ? `${qrType.color} border-2` 
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleToggleCode(qrType.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {qrType.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{qrType.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {qrType.description}
                      </p>
                    </div>
                  </div>
                  {selectedCodes.includes(qrType.id) && (
                    <Badge variant="default" className="ml-2">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Poster Preview */}
      <div className="space-y-4">
        <Label>Poster Preview</Label>
        <Card className="p-6 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Lagos Grand Hotel
            </h2>
            <div className="text-4xl font-mono font-bold text-primary mt-2">
              Room {selectedRoom || "___"}
            </div>
            <p className="text-gray-600 mt-2">
              Scan QR codes below for instant service
            </p>
          </div>

          <div className={`grid gap-4 ${
            posterLayout === 'door-hanger' ? 'grid-cols-2' :
            posterLayout === 'compact' ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {selectedQRs.map((qr) => (
              <div key={qr.id} className="text-center p-3 border rounded-lg">
                <div className="flex justify-center mb-2">
                  {qr.icon}
                </div>
                <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-xs font-medium">{qr.title}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
            For assistance, call Front Desk: +234 1 234 5678
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handlePreview} variant="outline" className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={handleDownloadPoster} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={handlePrintPoster} className="flex-1">
          <Printer className="h-4 w-4 mr-2" />
          Print Now
        </Button>
      </div>
    </div>
  );

  if (open !== undefined) {
    // Dialog mode
    return (
      <Dialog open={open || false} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Create Room QR Poster
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone mode
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <QrCode className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Create Room QR Poster</h2>
      </div>
      {renderContent()}
    </div>
  );
};