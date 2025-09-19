import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useConfiguration } from '@/hooks/useConfiguration';
import { HotelConfiguration } from '@/types/configuration';
import { Palette, Upload, Image, Type } from 'lucide-react';

interface BrandingIdentityProps {
  config: HotelConfiguration['branding'];
  onUpdate: (updates: Partial<HotelConfiguration['branding']>) => Promise<boolean>;
  loading: boolean;
}

export const BrandingIdentity = ({ config, onUpdate, loading }: BrandingIdentityProps) => {
  const { toast } = useToast();
  const { uploadLogo } = useConfiguration();
  const [formData, setFormData] = useState(config);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onUpdate(formData);
      if (success) {
        toast({
          title: "Branding Saved",
          description: "Branding and identity settings have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save branding settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, SVG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const logoUrl = await uploadLogo(file);
      setFormData(prev => ({
        ...prev,
        logo_url: logoUrl
      }));
      toast({
        title: "Logo Uploaded",
        description: "Hotel logo has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateField = (field: keyof HotelConfiguration['branding'], value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Branding & Identity</h3>
        <p className="text-sm text-muted-foreground">
          Configure hotel branding, colors, and visual identity
        </p>
      </div>

      <div className="grid gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Hotel Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {formData.logo_url ? (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.logo_url}
                    alt="Hotel Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Image className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">No logo</p>
                  </div>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Label htmlFor="logo-upload">Upload Logo</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PNG, JPG, SVG. Max size: 5MB.
                  <br />
                  Recommended size: 200x200px or larger.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                    placeholder="#64748b"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent_color">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accent_color"
                    value={formData.accent_color}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <Input
                    value={formData.accent_color}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Color Preview</Label>
              <div className="mt-3 flex gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <span className="text-sm">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                  <span className="text-sm">Secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: formData.accent_color }}
                  />
                  <span className="text-sm">Accent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Text */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Receipt Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt_header_text">Header Text</Label>
              <Textarea
                id="receipt_header_text"
                value={formData.receipt_header_text}
                onChange={(e) => updateField('receipt_header_text', e.target.value)}
                placeholder="Thank you for choosing Grand Palace Lagos"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Appears at the top of receipts and invoices
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt_footer_text">Footer Text</Label>
              <Textarea
                id="receipt_footer_text"
                value={formData.receipt_footer_text}
                onChange={(e) => updateField('receipt_footer_text', e.target.value)}
                placeholder="We hope to see you again soon!"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Appears at the bottom of receipts and invoices
              </p>
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
          {saving ? 'Saving...' : 'Save Branding'}
        </Button>
      </div>
    </div>
  );
};