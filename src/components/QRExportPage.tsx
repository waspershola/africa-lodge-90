import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  QrCode, 
  Download, 
  Printer,
  Copy,
  Hotel,
  Phone,
  Wifi,
  CheckCircle,
  FileImage,
  Grid3X3
} from "lucide-react";

// Mock hotel data
const hotelInfo = {
  name: "Lagos Grand Hotel",
  phone: "+234 803 123 4567",
  email: "frontdesk@lagosgrand.com",
  website: "www.lagosgrand.com",
  logo: "/api/placeholder/120/80"
};

// Mock room data
const mockRooms = [
  { number: "101", floor: 1, type: "Standard", active: true },
  { number: "102", floor: 1, type: "Standard", active: true },
  { number: "103", floor: 1, type: "Deluxe", active: false },
  { number: "201", floor: 2, type: "Standard", active: true },
  { number: "202", floor: 2, type: "Deluxe", active: true },
  { number: "301", floor: 3, type: "Suite", active: true },
  { number: "305", floor: 3, type: "Suite", active: true },
  { number: "401", floor: 4, type: "Presidential", active: true }
];

const QRExportPage = () => {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [qrSize, setQrSize] = useState("medium");
  const [paperSize, setPaperSize] = useState("a5");
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [customInstructions, setCustomInstructions] = useState(
    "Scan this QR code with your phone camera to access our room service menu and place orders directly to your room."
  );

  const toggleRoomSelection = (roomNumber: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomNumber) 
        ? prev.filter(r => r !== roomNumber)
        : [...prev, roomNumber]
    );
  };

  const selectFloor = (floor: number) => {
    const floorRooms = mockRooms
      .filter(room => room.floor === floor && room.active)
      .map(room => room.number);
    
    setSelectedRooms(prev => {
      const withoutFloorRooms = prev.filter(r => {
        const room = mockRooms.find(room => room.number === r);
        return room?.floor !== floor;
      });
      return [...withoutFloorRooms, ...floorRooms];
    });
  };

  const selectAll = () => {
    const allActiveRooms = mockRooms
      .filter(room => room.active)
      .map(room => room.number);
    setSelectedRooms(allActiveRooms);
  };

  const clearSelection = () => {
    setSelectedRooms([]);
  };

  const generateQRUrl = (roomNumber: string) => {
    return `https://lagosgrand.com/room-service/${roomNumber}`;
  };

  const QRPreview = ({ roomNumber }: { roomNumber: string }) => (
    <div className={`
      bg-white border-2 border-dashed border-gray-300 p-6 rounded-lg 
      ${paperSize === 'a5' ? 'w-64 h-80' : paperSize === 'a6' ? 'w-48 h-64' : 'w-80 h-96'}
      flex flex-col items-center justify-center space-y-4
    `}>
      {/* Hotel Logo */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Hotel className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="font-playfair font-bold text-lg">{hotelInfo.name}</div>
          <div className="text-sm text-muted-foreground">Room {roomNumber}</div>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className={`
        bg-gray-100 border-2 border-gray-200 flex items-center justify-center rounded-lg
        ${qrSize === 'small' ? 'w-24 h-24' : qrSize === 'medium' ? 'w-32 h-32' : 'w-40 h-40'}
      `}>
        <QrCode className="h-12 w-12 text-gray-400" />
      </div>

      {/* Room Number */}
      <div className="text-center">
        <div className="text-2xl font-bold text-primary">Room {roomNumber}</div>
        <div className="text-sm text-muted-foreground">Room Service QR Code</div>
      </div>

      {/* Instructions */}
      {includeInstructions && (
        <div className="text-center text-xs text-muted-foreground max-w-48 leading-relaxed">
          {customInstructions}
        </div>
      )}

      {/* Contact Info */}
      <div className="text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Phone className="h-3 w-3" />
          <span>{hotelInfo.phone}</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Wifi className="h-3 w-3" />
          <span>Free WiFi Available</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-gradient">
              QR Code Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate and export QR codes for room service ordering
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
              {selectedRooms.length} rooms selected
            </Badge>
            <Button variant="outline">
              <FileImage className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            <Button className="bg-gradient-primary">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Room Selection */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Select Rooms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={selectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear All
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectFloor(1)}>
                  Floor 1
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectFloor(2)}>
                  Floor 2
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectFloor(3)}>
                  Floor 3
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {mockRooms.map(room => (
                  <Button
                    key={room.number}
                    variant={selectedRooms.includes(room.number) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRoomSelection(room.number)}
                    disabled={!room.active}
                    className="h-12 flex flex-col gap-1"
                  >
                    <span className="font-bold">{room.number}</span>
                    <span className="text-xs">{room.type}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* QR Settings */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">QR Code Size</label>
                <Select value={qrSize} onValueChange={setQrSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (3cm × 3cm)</SelectItem>
                    <SelectItem value="medium">Medium (4cm × 4cm)</SelectItem>
                    <SelectItem value="large">Large (5cm × 5cm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Paper Size</label>
                <Select value={paperSize} onValueChange={setPaperSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a5">A5 (148 × 210 mm)</SelectItem>
                    <SelectItem value="a6">A6 (105 × 148 mm)</SelectItem>
                    <SelectItem value="custom">Custom Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="instructions"
                  checked={includeInstructions}
                  onChange={(e) => setIncludeInstructions(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="instructions" className="text-sm font-medium">
                  Include instructions
                </label>
              </div>

              {includeInstructions && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Instructions</label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={3}
                    placeholder="Enter custom instructions for guests..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-primary" disabled={selectedRooms.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF ({selectedRooms.length} QR codes)
              </Button>
              <Button variant="outline" className="w-full" disabled={selectedRooms.length === 0}>
                <Printer className="h-4 w-4 mr-2" />
                Print Preview
              </Button>
              <Button variant="outline" className="w-full" disabled={selectedRooms.length === 0}>
                <Copy className="h-4 w-4 mr-2" />
                Copy QR URLs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>QR Code Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview how your QR codes will look when printed
              </p>
            </CardHeader>
            <CardContent>
              {selectedRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rooms selected</h3>
                  <p className="text-muted-foreground">
                    Select rooms from the left panel to see QR code previews
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedRooms.slice(0, 4).map(roomNumber => (
                    <QRPreview key={roomNumber} roomNumber={roomNumber} />
                  ))}
                  {selectedRooms.length > 4 && (
                    <div className="md:col-span-2 text-center p-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">
                        + {selectedRooms.length - 4} more QR codes will be generated
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generation Settings Summary */}
          {selectedRooms.length > 0 && (
            <Card className="luxury-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Generation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Selected Rooms:</span>
                      <span className="font-medium">{selectedRooms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">QR Code Size:</span>
                      <span className="font-medium capitalize">{qrSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Paper Size:</span>
                      <span className="font-medium uppercase">{paperSize}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Include Instructions:</span>
                      <span className="font-medium">{includeInstructions ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Est. File Size:</span>
                      <span className="font-medium">{Math.round(selectedRooms.length * 0.3)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Format:</span>
                      <span className="font-medium">PDF</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRExportPage;