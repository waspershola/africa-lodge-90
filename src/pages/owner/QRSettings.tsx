import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X, Crown, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeShowcase } from '@/components/owner/ThemeShowcase';

interface QRSettings {
  id?: string;
  tenant_id: string;
  hotel_name: string;
  hotel_logo_url?: string;
  primary_color: string;
  show_logo_on_qr: boolean;
  default_services: string[];
  front_desk_phone: string;
  theme: string;
}

const AVAILABLE_SERVICES = [
  'Wi-Fi',
  'Room Service', 
  'Housekeeping',
  'Maintenance',
  'Digital Menu',
  'Events & Packages',
  'Feedback'
];

const THEME_OPTIONS = [
  {
    id: 'classic-luxury-gold',
    name: 'Classic Luxury Gold',
    description: 'Sophisticated gold accents on dark background with elegant serif typography',
    colors: { primary: '#D4AF37', background: '#1A1A1A', accent: '#F4F1EB' },
    features: ['Elegant serif fonts', 'Luxurious gold gradients', 'Subtle animations']
  },
  {
    id: 'royal-white-gold',
    name: 'Royal White & Gold',
    description: 'Clean white marble aesthetic with gold highlights and refined elegance',
    colors: { primary: '#D4AF37', background: '#FEFEFE', accent: '#F8F6F0' },
    features: ['Pure white design', 'Gold accent lines', 'Premium feel']
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Bold black background with silver accents and clean sans-serif typography',
    colors: { primary: '#C0C0C0', background: '#000000', accent: '#1A1A1A' },
    features: ['Clean sans-serif fonts', 'Neon glow effects', 'Ultra-modern aesthetic']
  },
  {
    id: 'tropical-elegance',
    name: 'Tropical Elegance',
    description: 'Rich emerald gradient with gold accents and natural elegance',
    colors: { primary: '#50C878', background: '#0F4C3A', accent: '#D4AF37' },
    features: ['Natural green palette', 'Shimmering animations', 'Resort luxury feel']
  }
];

export default function QRSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tenantInfo } = useTenantInfo();
  
  const [formData, setFormData] = useState<QRSettings>({
    tenant_id: '',
    hotel_name: '',
    hotel_logo_url: '',
    primary_color: '#D4AF37',
    show_logo_on_qr: true,
    default_services: ['Wi-Fi', 'Room Service', 'Housekeeping'],
    front_desk_phone: '+2347065937769',
    theme: 'classic-luxury-gold'
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch QR settings
  const { data: qrSettings, isLoading } = useQuery({
    queryKey: ['qr-settings', tenantInfo?.tenant_id],
    queryFn: async () => {
      if (!tenantInfo?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('qr_settings')
        .select('*')
        .eq('tenant_id', tenantInfo.tenant_id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!tenantInfo?.tenant_id
  });

  // Update form when data loads
  useEffect(() => {
    if (tenantInfo) {
      setFormData(prev => ({
        ...prev,
        tenant_id: tenantInfo.tenant_id,
        hotel_name: qrSettings?.hotel_name || tenantInfo.hotel_name || '',
        hotel_logo_url: qrSettings?.hotel_logo_url || tenantInfo.logo_url || '',
        primary_color: qrSettings?.primary_color || '#D4AF37',
        show_logo_on_qr: qrSettings?.show_logo_on_qr ?? true,
        default_services: qrSettings?.default_services || ['Wi-Fi', 'Room Service', 'Housekeeping'],
        front_desk_phone: qrSettings?.front_desk_phone || '+2347065937769',
        theme: qrSettings?.theme || 'classic-luxury-gold'
      }));
    }
  }, [tenantInfo, qrSettings]);

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `qr-logo-${Date.now()}.${fileExt}`;
      const filePath = `${tenantInfo?.tenant_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hotel-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hotel-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onSuccess: (logoUrl) => {
      setFormData(prev => ({ ...prev, hotel_logo_url: logoUrl }));
      setLogoFile(null);
      setIsUploading(false);
      toast({
        title: "Success",
        description: "Logo uploaded successfully!"
      });
    },
    onError: (error) => {
      console.error('Logo upload error:', error);
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: QRSettings) => {
      const { data, error } = await supabase
        .from('qr_settings')
        .upsert(settings, { onConflict: 'tenant_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-settings'] });
      toast({
        title: "Success",
        description: "QR settings saved successfully!"
      });
    },
    onError: (error) => {
      console.error('Save settings error:', error);
      toast({
        title: "Error", 
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "File size must be less than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setLogoFile(file);
    setIsUploading(true);
    uploadLogoMutation.mutate(file);
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      default_services: prev.default_services.includes(service)
        ? prev.default_services.filter(s => s !== service)
        : [...prev.default_services, service]
    }));
  };

  const handleSave = () => {
    if (!formData.hotel_name.trim()) {
      toast({
        title: "Error",
        description: "Hotel name is required.",
        variant: "destructive"
      });
      return;
    }

    saveSettingsMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 flex items-center justify-center">
        <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Crown className="h-12 w-12 text-amber-600 mx-auto animate-pulse mb-4" />
            <p className="text-amber-700">Loading QR settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/owner-dashboard/qr-manager')}
              className="text-amber-100 hover:text-white hover:bg-amber-800/50 rounded-full p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-amber-600/30 shadow-lg">
                <Crown className="h-6 w-6 text-amber-200" />
              </div>
              <div>
                <h1 className="text-3xl font-serif text-white mb-1">Global QR Code Settings</h1>
                <p className="text-amber-200/80">Configure hotel branding and default services</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Theme Selection */}
        <Card className="shadow-xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-serif text-amber-900">QR Portal Theme</CardTitle>
            </div>
            <p className="text-amber-700/70">Choose the visual theme for your guest QR portal</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {THEME_OPTIONS.map((themeOption) => (
                <div
                  key={themeOption.id}
                  onClick={() => setFormData(prev => ({ ...prev, theme: themeOption.id }))}
                  className={`group p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    formData.theme === themeOption.id 
                      ? 'border-amber-400 bg-amber-50/50 shadow-xl ring-2 ring-amber-400/20' 
                      : 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-lg'
                  }`}
                >
                  {/* Theme Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
                      style={{ backgroundColor: themeOption.colors.primary }}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 text-lg">{themeOption.name}</h4>
                      {formData.theme === themeOption.id && (
                        <Badge className="ml-2 bg-amber-500 text-white">Active</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Theme Description */}
                  <p className="text-sm text-amber-700/70 mb-4 leading-relaxed">
                    {themeOption.description}
                  </p>
                  
                  {/* Theme Features */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800 uppercase tracking-wide">Features</span>
                    </div>
                    <div className="space-y-1">
                      {themeOption.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-amber-700/60">
                          <div className="w-1 h-1 bg-amber-400 rounded-full" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Color Palette Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800 uppercase tracking-wide">Color Palette</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-md border shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: themeOption.colors.primary }}
                          title="Primary Color"
                        />
                        <span className="text-xs text-amber-700/60">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-md border shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: themeOption.colors.background }}
                          title="Background Color"
                        />
                        <span className="text-xs text-amber-700/60">Background</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-md border shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: themeOption.colors.accent }}
                          title="Accent Color"
                        />
                        <span className="text-xs text-amber-700/60">Accent</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {formData.theme === themeOption.id && (
                    <div className="mt-4 p-3 bg-amber-100/50 rounded-lg border border-amber-200/50">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">Currently Applied</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Theme Preview Note */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-purple-900 mb-1">Theme Preview</h5>
                  <p className="text-sm text-purple-700/70 leading-relaxed">
                    Your selected theme will be applied to all guest QR portal experiences. 
                    The theme includes custom colors, typography, animations, and visual effects 
                    that match your hotel's brand identity.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hotel Branding */}
        <Card className="shadow-xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-serif text-amber-900">Hotel Branding</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hotel Name */}
            <div className="space-y-2">
              <Label htmlFor="hotel-name" className="text-amber-900 font-medium">Hotel Name</Label>
              <Input
                id="hotel-name"
                value={formData.hotel_name}
                onChange={(e) => setFormData(prev => ({ ...prev, hotel_name: e.target.value }))}
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                placeholder="Enter hotel name"
              />
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="text-amber-900 font-medium">Primary Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary-color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-16 h-10 border-amber-200"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                  placeholder="#D4AF37"
                />
              </div>
            </div>

            {/* Front Desk Phone */}
            <div className="space-y-2">
              <Label htmlFor="front-desk-phone" className="text-amber-900 font-medium">Front Desk Phone Number</Label>
              <Input
                id="front-desk-phone"
                value={formData.front_desk_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, front_desk_phone: e.target.value }))}
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                placeholder="+1234567890"
              />
              <p className="text-xs text-amber-700/70">
                This number will be used for the "Need Immediate Assistance" call button
              </p>
            </div>

            {/* Show Logo Toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
              <div>
                <Label className="text-amber-900 font-medium">Show Logo on QR Codes</Label>
                <p className="text-sm text-amber-700/70">Display hotel logo on all generated QR codes</p>
              </div>
              <Switch
                checked={formData.show_logo_on_qr}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_logo_on_qr: checked }))}
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-amber-900 font-medium">Logo Upload</Label>
              <p className="text-sm text-amber-700/70">Recommended: 200x200px PNG or SVG</p>
              
              {/* Current Logo Preview */}
              {formData.hotel_logo_url && (
                <div className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
                  <img 
                    src={formData.hotel_logo_url} 
                    alt="Hotel Logo" 
                    className="w-16 h-16 object-contain rounded-lg border border-amber-200 bg-white"
                  />
                  <div className="flex-1">
                    <p className="text-amber-900 font-medium">Current Logo</p>
                    <p className="text-sm text-amber-700/70">Logo successfully uploaded</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, hotel_logo_url: '' }))}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Hotel Logo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Services */}
        <Card className="shadow-xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-serif text-amber-900">Default Services</CardTitle>
            <p className="text-amber-700/70">Services automatically enabled for new QR codes</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_SERVICES.map((service) => (
                <div
                  key={service}
                  onClick={() => handleServiceToggle(service)}
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    borderColor: formData.default_services.includes(service) ? formData.primary_color : '#F3E8FF',
                    backgroundColor: formData.default_services.includes(service) ? `${formData.primary_color}15` : '#FEFBFF'
                  }}
                >
                  <span className="font-medium text-amber-900">{service}</span>
                  {formData.default_services.includes(service) && (
                    <Badge 
                      style={{ backgroundColor: formData.primary_color, color: 'white' }}
                      className="text-xs"
                    >
                      Default
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/owner-dashboard/qr-manager')}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl"
          >
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}