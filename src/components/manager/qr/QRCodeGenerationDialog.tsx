import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Plus, Download, Printer, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface QRCodeGenerationDialogProps {
  trigger: React.ReactNode;
}

export const QRCodeGenerationDialog = ({ trigger }: QRCodeGenerationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [generationType, setGenerationType] = useState('single');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedFloor, setSelectedFloor] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>(['Room Service', 'Housekeeping']);
  const [pricingTier, setPricingTier] = useState('standard');
  const { toast } = useToast();

  const availableServices = [
    'Room Service',
    'Housekeeping', 
    'Concierge',
    'Spa Services',
    'Transport',
    'Minibar',
    'Laundry'
  ];

  const availableRooms = [
    '101', '102', '103', '104', '105',
    '201', '202', '203', '204', '205',
    '301', '302', '303', '304', '305'
  ];

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleRoomToggle = (room: string) => {
    setSelectedRooms(prev => 
      prev.includes(room) 
        ? prev.filter(r => r !== room)
        : [...prev, room]
    );
  };

  const handleGenerate = () => {
    const roomsToGenerate = generationType === 'single' 
      ? [customRoom]
      : generationType === 'batch' 
        ? selectedRooms
        : availableRooms.filter(room => room.startsWith(selectedFloor.charAt(0)));

    toast({
      title: "QR Codes Generated Successfully",
      description: `Generated ${roomsToGenerate.length} QR code(s) with ${selectedServices.length} services enabled.`,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate QR Codes
          </DialogTitle>
          <DialogDescription>
            Create QR codes for rooms with customized service access and pricing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generation Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Generation Type</Label>
            <Select value={generationType} onValueChange={setGenerationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select generation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Room</SelectItem>
                <SelectItem value="batch">Batch Selection</SelectItem>
                <SelectItem value="floor">Entire Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection */}
          {generationType === 'single' && (
            <div className="space-y-2">
              <Label htmlFor="room">Room Number</Label>
              <Input
                id="room"
                placeholder="Enter room number (e.g., 205)"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
              />
            </div>
          )}

          {generationType === 'batch' && (
            <div className="space-y-3">
              <Label>Select Rooms</Label>
              <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                {availableRooms.map(room => (
                  <div key={room} className="flex items-center space-x-2">
                    <Checkbox
                      id={room}
                      checked={selectedRooms.includes(room)}
                      onCheckedChange={() => handleRoomToggle(room)}
                    />
                    <Label htmlFor={room} className="text-sm">{room}</Label>
                  </div>
                ))}
              </div>
              {selectedRooms.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Selected: {selectedRooms.length} room(s)
                </div>
              )}
            </div>
          )}

          {generationType === 'floor' && (
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Floor">1st Floor</SelectItem>
                  <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                  <SelectItem value="3rd Floor">3rd Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pricing Tier */}
          <div className="space-y-3">
            <Label>Pricing Tier</Label>
            <Select value={pricingTier} onValueChange={setPricingTier}>
              <SelectTrigger>
                <SelectValue placeholder="Select pricing tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Pricing</SelectItem>
                <SelectItem value="premium">Premium Pricing (+15%)</SelectItem>
                <SelectItem value="vip">VIP Pricing (+30%)</SelectItem>
                <SelectItem value="budget">Budget Pricing (-10%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Selection */}
          <div className="space-y-3">
            <Label>Available Services</Label>
            <div className="grid grid-cols-2 gap-3">
              {availableServices.map(service => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={selectedServices.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <Label htmlFor={service} className="text-sm">{service}</Label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedServices.map(service => (
                <Badge key={service} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-3">QR Code Preview</h4>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white border rounded-lg flex items-center justify-center">
                <QrCode className="h-12 w-12" />
              </div>
              <div className="flex-1 text-sm">
                <div><strong>Room(s):</strong> {
                  generationType === 'single' ? customRoom :
                  generationType === 'batch' ? `${selectedRooms.length} selected` :
                  selectedFloor
                }</div>
                <div><strong>Services:</strong> {selectedServices.length} enabled</div>
                <div><strong>Pricing:</strong> {pricingTier}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={
              (generationType === 'single' && !customRoom) ||
              (generationType === 'batch' && selectedRooms.length === 0) ||
              (generationType === 'floor' && !selectedFloor)
            }>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code{generationType !== 'single' ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};