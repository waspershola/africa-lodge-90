import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Palette, FileText, Image } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface BrandingStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const colorPresets = [
  { name: 'Ocean Blue', primary: '#2563eb', secondary: '#1e40af' },
  { name: 'Forest Green', primary: '#059669', secondary: '#047857' },
  { name: 'Sunset Orange', primary: '#ea580c', secondary: '#c2410c' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#5b21b6' },
  { name: 'Rose Gold', primary: '#e11d48', secondary: '#be185d' },
  { name: 'Midnight Black', primary: '#1f2937', secondary: '#111827' },
];

export function BrandingStep({ data, updateData }: BrandingStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const updateBranding = (field: string, value: string | File) => {
    updateData({
      branding: {
        ...data.branding,
        [field]: value,
      },
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateBranding('logo', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectColorPreset = (preset: typeof colorPresets[0]) => {
    updateBranding('primaryColor', preset.primary);
    updateBranding('secondaryColor', preset.secondary);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Brand Your Hotel</h3>
        <p className="text-muted-foreground">
          Customize the look and feel of your hotel management system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5" />
              <span>Hotel Logo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              {logoPreview ? (
                <div className="space-y-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-auto mx-auto"
                  />
                  <p className="text-sm text-muted-foreground">
                    Logo uploaded successfully
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h4 className="font-medium mb-1">Upload Hotel Logo</h4>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG or SVG. Max file size 2MB.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="logoUpload">Choose Logo File</Label>
              <Input
                id="logoUpload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="mt-1"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Your logo will appear on receipts, invoices, and guest communications.
              You can change this later in settings.
            </p>
          </CardContent>
        </Card>

        {/* Color Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Color Theme</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">Choose a Color Preset</Label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => selectColorPreset(preset)}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm ${
                      data.branding.primaryColor === preset.primary
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={data.branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={data.branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={data.branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={data.branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Receipt & Document Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="receiptFormat">Receipt Format</Label>
            <Select
              value={data.branding.receiptFormat}
              onValueChange={(value: 'pdf' | 'pos' | 'both') => updateBranding('receiptFormat', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">A4 PDF Receipts Only</SelectItem>
                <SelectItem value="pos">POS Thermal Receipts Only</SelectItem>
                <SelectItem value="both">Both PDF and Thermal Receipts</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Choose how receipts and invoices will be generated for guests
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Brand Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center space-x-3 mb-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-8 w-auto" />
                )}
                <div>
                  <h4 className="font-medium">{data.hotelInfo.name || 'Your Hotel Name'}</h4>
                  <p className="text-sm text-muted-foreground">Hotel Management System</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <div
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: data.branding.primaryColor }}
                >
                  Primary Button
                </div>
                <div
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: data.branding.secondaryColor }}
                >
                  Secondary Button
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              This is how your branding will appear throughout the system
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}