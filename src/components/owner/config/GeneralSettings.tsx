import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HotelConfiguration } from '@/types/configuration';
import { Building, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';
import { useTenantInfo } from '@/hooks/useTenantInfo';

interface GeneralSettingsProps {
  config: HotelConfiguration['general'];
  onUpdate: (updates: Partial<HotelConfiguration['general']>) => Promise<boolean>;
  loading: boolean;
}

const TIMEZONES = [
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

export const GeneralSettings = ({ config, onUpdate, loading }: GeneralSettingsProps) => {
  const { toast } = useToast();
  const { data: tenantInfo } = useTenantInfo();
  const [formData, setFormData] = useState(config);
  const [saving, setSaving] = useState(false);

  // Load tenant data when available and avoid overriding with defaults
  useEffect(() => {
    if (tenantInfo && config) {
      setFormData(prev => ({
        ...prev,
        hotel_name: tenantInfo.hotel_name || prev.hotel_name,
        address: {
          ...prev.address,
          street: tenantInfo.address || prev.address.street,
          city: tenantInfo.city || prev.address.city,
          country: tenantInfo.country || prev.address.country
        },
        contact: {
          ...prev.contact,
          phone: tenantInfo.phone || prev.contact.phone,
          email: tenantInfo.email || prev.contact.email
        },
        timezone: tenantInfo.timezone || prev.timezone
      }));
    }
  }, [tenantInfo, config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onUpdate(formData);
      if (success) {
        toast({
          title: "Settings Saved",
          description: "General settings have been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save general settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure basic hotel information and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Hotel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Hotel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Hotel Name</Label>
                <Input
                  id="hotel_name"
                  value={formData.hotel_name}
                  onChange={(e) => updateField('hotel_name', e.target.value)}
                  placeholder="Grand Palace Lagos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => updateField('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => updateField('address.street', e.target.value)}
                placeholder="123 Victoria Island"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => updateField('address.city', e.target.value)}
                  placeholder="Lagos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => updateField('address.state', e.target.value)}
                  placeholder="Lagos State"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address.country}
                  onChange={(e) => updateField('address.country', e.target.value)}
                  placeholder="Nigeria"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.address.postal_code}
                  onChange={(e) => updateField('address.postal_code', e.target.value)}
                  placeholder="101001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) => updateField('contact.phone', e.target.value)}
                  placeholder="+234 123 456 7890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => updateField('contact.email', e.target.value)}
                  placeholder="info@grandpalacelagos.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.contact.website || ''}
                onChange={(e) => updateField('contact.website', e.target.value)}
                placeholder="https://grandpalacelagos.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Display Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={formData.date_format}
                  onValueChange={(value: any) => updateField('date_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (19/01/2025)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/19/2025)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-01-19)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_format">Time Format</Label>
                <Select
                  value={formData.time_format}
                  onValueChange={(value: any) => updateField('time_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24 Hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
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
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};