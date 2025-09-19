import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { HotelConfiguration } from '@/types/configuration';
import { Users, ClipboardList, QrCode, Wifi, UtensilsCrossed, Sparkles, Wrench } from 'lucide-react';

interface GuestExperienceProps {
  config: HotelConfiguration['guest_experience'];
  onUpdate: (updates: Partial<HotelConfiguration['guest_experience']>) => Promise<boolean>;
  loading: boolean;
}

const AVAILABLE_SERVICES = [
  { id: 'wifi', label: 'Wi-Fi Access', icon: Wifi },
  { id: 'room_service', label: 'Room Service', icon: UtensilsCrossed },
  { id: 'housekeeping', label: 'Housekeeping', icon: Sparkles },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'feedback', label: 'Feedback & Complaints', icon: ClipboardList },
  { id: 'concierge', label: 'Concierge Services', icon: Users },
];

export const GuestExperience = ({ config, onUpdate, loading }: GuestExperienceProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(config);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onUpdate(formData);
      if (success) {
        toast({
          title: "Guest Experience Settings Saved",
          description: "Guest experience preferences have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save guest experience settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCheckinField = (field: keyof HotelConfiguration['guest_experience']['checkin_slip_fields'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      checkin_slip_fields: {
        ...prev.checkin_slip_fields,
        [field]: value
      }
    }));
  };

  const updateQRDefault = (field: keyof HotelConfiguration['guest_experience']['qr_defaults'], value: any) => {
    setFormData(prev => ({
      ...prev,
      qr_defaults: {
        ...prev.qr_defaults,
        [field]: value
      }
    }));
  };

  const updateDefaultServices = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      qr_defaults: {
        ...prev.qr_defaults,
        default_services: checked
          ? [...prev.qr_defaults.default_services, serviceId]
          : prev.qr_defaults.default_services.filter(s => s !== serviceId)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Guest Experience Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure check-in requirements and QR code defaults
        </p>
      </div>

      <div className="grid gap-6">
        {/* Check-in Slip Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Check-in Slip Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure which fields are required or optional during guest check-in
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="guest_id_required">Guest ID Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require valid ID during check-in
                  </p>
                </div>
                <Switch
                  id="guest_id_required"
                  checked={formData.checkin_slip_fields.guest_id_required}
                  onCheckedChange={(checked) => updateCheckinField('guest_id_required', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="phone_required">Phone Number Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require phone number for contact
                  </p>
                </div>
                <Switch
                  id="phone_required"
                  checked={formData.checkin_slip_fields.phone_required}
                  onCheckedChange={(checked) => updateCheckinField('phone_required', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_required">Email Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email for receipts and updates
                  </p>
                </div>
                <Switch
                  id="email_required"
                  checked={formData.checkin_slip_fields.email_required}
                  onCheckedChange={(checked) => updateCheckinField('email_required', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="address_required">Address Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require home address information
                  </p>
                </div>
                <Switch
                  id="address_required"
                  checked={formData.checkin_slip_fields.address_required}
                  onCheckedChange={(checked) => updateCheckinField('address_required', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Set default configurations for newly generated QR codes
            </p>

            {/* QR Code Appearance */}
            <div className="space-y-4">
              <h4 className="font-medium">QR Code Appearance</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include_logo">Include Hotel Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Display hotel logo on QR codes
                    </p>
                  </div>
                  <Switch
                    id="include_logo"
                    checked={formData.qr_defaults.include_logo}
                    onCheckedChange={(checked) => updateQRDefault('include_logo', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include_hotel_name">Include Hotel Name</Label>
                    <p className="text-sm text-muted-foreground">
                      Display hotel name on QR codes
                    </p>
                  </div>
                  <Switch
                    id="include_hotel_name"
                    checked={formData.qr_defaults.include_hotel_name}
                    onCheckedChange={(checked) => updateQRDefault('include_hotel_name', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr_size">QR Code Size</Label>
                <Select
                  value={formData.qr_defaults.qr_size}
                  onValueChange={(value: any) => updateQRDefault('qr_size', value)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (200x200px)</SelectItem>
                    <SelectItem value="medium">Medium (300x300px)</SelectItem>
                    <SelectItem value="large">Large (400x400px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Default Services */}
            <div className="space-y-4">
              <h4 className="font-medium">Default Services</h4>
              <p className="text-sm text-muted-foreground">
                Select which services should be enabled by default for new QR codes
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_SERVICES.map((service) => {
                  const Icon = service.icon;
                  const isChecked = formData.qr_defaults.default_services.includes(service.id);
                  
                  return (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => updateDefaultServices(service.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={service.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {service.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">QR Code Preview</Label>
              <div className="mt-3 flex items-start gap-4">
                <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                    <div className="text-xs text-gray-500">
                      {formData.qr_defaults.qr_size} QR
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-sm space-y-1">
                  <div className="font-medium">QR Code Features:</div>
                  {formData.qr_defaults.include_logo && (
                    <div className="flex items-center gap-1 text-green-600">
                      ✓ Hotel logo included
                    </div>
                  )}
                  {formData.qr_defaults.include_hotel_name && (
                    <div className="flex items-center gap-1 text-green-600">
                      ✓ Hotel name displayed
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Default services: {formData.qr_defaults.default_services.length} enabled
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="min-w-32"
        >
          {saving ? 'Saving...' : 'Save Guest Settings'}
        </Button>
      </div>
    </div>
  );
};