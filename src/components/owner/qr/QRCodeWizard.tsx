import React, { useState } from 'react';
import { MapPin, Building2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QRCodeData } from '@/pages/owner/QRManager';
import { useToast } from '@/hooks/use-toast';

interface QRCodeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (qrData: Omit<QRCodeData, 'id' | 'createdAt' | 'createdBy' | 'pendingRequests'>) => void;
  defaultServices?: string[];
}

const availableServices = [
  'Wi-Fi',
  'Room Service', 
  'Housekeeping',
  'Maintenance',
  'Digital Menu',
  'Events & Packages',
  'Feedback'
];

const presetLocations = [
  { id: 'lobby', name: 'Lobby', services: ['Wi-Fi', 'Feedback'] },
  { id: 'pool', name: 'Poolside Bar', services: ['Digital Menu', 'Events & Packages'] },
  { id: 'restaurant', name: 'Restaurant', services: ['Digital Menu', 'Feedback'] },
  { id: 'gym', name: 'Fitness Center', services: ['Wi-Fi', 'Feedback'] },
  { id: 'spa', name: 'Spa & Wellness', services: ['Wi-Fi', 'Room Service'] }
];

export const QRCodeWizard = ({ open, onOpenChange, onSave, defaultServices = [] }: QRCodeWizardProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<'Room' | 'Location'>('Room');
  const [assignedTo, setAssignedTo] = useState('');
  const [services, setServices] = useState<string[]>(defaultServices);
  const [roomRange, setRoomRange] = useState({ from: '', to: '' });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleReset = () => {
    setStep(1);
    setScope('Room');
    setAssignedTo('');
    setServices(defaultServices);
    setRoomRange({ from: '', to: '' });
    setSelectedPreset(null);
  };

  const handleServiceToggle = (service: string) => {
    setServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presetLocations.find(p => p.id === presetId);
    if (preset) {
      setAssignedTo(preset.name);
      setServices(preset.services);
      setSelectedPreset(presetId);
    }
  };

  const handleSave = () => {
    if (scope === 'Room') {
      // Validate room number is provided
      if (!assignedTo.trim() && !(roomRange.from && roomRange.to)) {
        toast({
          title: "Room Number Required",
          description: "Please enter a room number or range.",
          variant: "destructive"
        });
        return;
      }

      if (roomRange.from && roomRange.to) {
        // Generate multiple room QR codes
        const fromNum = parseInt(roomRange.from);
        const toNum = parseInt(roomRange.to);
        
        if (fromNum > toNum || fromNum < 1 || toNum < 1) {
          toast({
            title: "Invalid Room Range",
            description: "Please enter a valid room number range.",
            variant: "destructive"
          });
          return;
        }
        
        for (let i = fromNum; i <= toNum; i++) {
          const roomNumber = i.toString().padStart(3, '0');
          onSave({
            scope: 'Room',
            assignedTo: `Room ${roomNumber}`,
            servicesEnabled: services,
            status: 'Active'
          });
        }
      } else {
        // Single room - format the room number
        const roomNumber = assignedTo.replace(/^Room\s+/i, '').trim();
        onSave({
          scope: 'Room',
          assignedTo: roomNumber,
          servicesEnabled: services,
          status: 'Active'
        });
      }
    } else {
      // Location QR code - validate location name
      if (!assignedTo.trim()) {
        toast({
          title: "Location Name Required",
          description: "Please enter a valid location name.",
          variant: "destructive"
        });
        return;
      }

      onSave({
        scope: 'Location',
        assignedTo: assignedTo.trim(),
        servicesEnabled: services,
        status: 'Active'
      });
    }
    
    handleReset();
    onOpenChange(false);
  };

  const canProceedStep1 = scope === 'Room' ? 
    (assignedTo || (roomRange.from && roomRange.to)) : 
    assignedTo;

  const canSave = canProceedStep1 && services.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate New QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`h-px w-8 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select Scope</Label>
                <RadioGroup value={scope} onValueChange={(value) => setScope(value as 'Room' | 'Location')} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Room" id="room" />
                    <Label htmlFor="room" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Room (Guest accommodations)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Location" id="location" />
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location (Common areas, facilities)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {scope === 'Room' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="single-room">Single Room</Label>
                    <Input
                      id="single-room"
                      placeholder="e.g., Room 101"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    />
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">or</div>
                  
                  <div>
                    <Label>Room Range</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        placeholder="From (e.g., 101)"
                        value={roomRange.from}
                        onChange={(e) => setRoomRange(prev => ({ ...prev, from: e.target.value }))}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        placeholder="To (e.g., 120)"
                        value={roomRange.to}
                        onChange={(e) => setRoomRange(prev => ({ ...prev, to: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {scope === 'Location' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input
                      id="location-name"
                      placeholder="e.g., Poolside Bar"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {presetLocations.map((preset) => (
                        <Button
                          key={preset.id}
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetSelect(preset.id)}
                          className="justify-start h-auto p-2"
                        >
                          <div className="text-left">
                            <div className="font-medium text-xs">{preset.name}</div>
                            <div className="text-xs opacity-70">
                              {preset.services.slice(0, 2).join(', ')}
                              {preset.services.length > 2 && '...'}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Enable Services</Label>
                <p className="text-sm text-muted-foreground">
                  Select which services will be available when guests scan this QR code
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={service}
                      checked={services.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <Label htmlFor={service} className="flex-1 cursor-pointer">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>

              {services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Selected Services</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1">
                      {services.map((service) => (
                        <Badge key={service} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {step === 1 && (
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!canProceedStep1}
                >
                  Next
                </Button>
              )}
              {step === 2 && (
                <Button onClick={handleSave} disabled={!canSave}>
                  Generate QR Code{roomRange.from && roomRange.to ? 's' : ''}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};