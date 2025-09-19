import React, { useState } from 'react';
import { Settings, Upload, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface BrandingSettings {
  hotelName: string;
  showLogo: boolean;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  defaultServices: string[];
}

interface GlobalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: BrandingSettings;
  onSave: (settings: BrandingSettings) => void;
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

export const GlobalSettingsDialog = ({ open, onOpenChange, settings, onSave }: GlobalSettingsDialogProps) => {
  const [formData, setFormData] = useState<BrandingSettings>(settings);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const toggleDefaultService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      defaultServices: prev.defaultServices.includes(service)
        ? prev.defaultServices.filter(s => s !== service)
        : [...prev.defaultServices, service]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global QR Code Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hotel Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Hotel Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input
                    id="hotelName"
                    value={formData.hotelName}
                    onChange={(e) => setFormData(prev => ({ ...prev, hotelName: e.target.value }))}
                    placeholder="Enter hotel name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Logo on QR Codes</Label>
                  <p className="text-sm text-muted-foreground">Display hotel logo on all generated QR codes</p>
                </div>
                <Switch
                  checked={formData.showLogo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showLogo: checked }))}
                />
              </div>

              {formData.showLogo && (
                <div className="space-y-2">
                  <Label>Logo Upload</Label>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Hotel Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">Recommended: 200x200px PNG or SVG</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Default Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Services</CardTitle>
              <p className="text-sm text-muted-foreground">
                Services automatically enabled for new QR codes
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{service}</span>
                      {formData.defaultServices.includes(service) && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <Switch
                      checked={formData.defaultServices.includes(service)}
                      onCheckedChange={() => toggleDefaultService(service)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};