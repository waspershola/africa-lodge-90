import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Palette, 
  Image, 
  Download,
  Eye,
  Trash2,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTenantInfo } from "@/hooks/useTenantInfo";

interface BrandingFormProps {
  onDataChange: () => void;
}

const BrandingForm = ({ onDataChange }: BrandingFormProps) => {
  const { data: tenantInfo } = useTenantInfo();
  const [brandingData, setBrandingData] = useState({
    // Logo & Images
    logo: "/placeholder.svg",
    favicon: "/placeholder.svg",
    heroImage: "/assets/hero-hotel-bg.jpg",
    
    // Color Theme
    primaryColor: "#D32F2F",
    secondaryColor: "#FFD700", 
    accentColor: "#1A237E",
    backgroundColor: "#FAFAFA",
    
    // Typography
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    
    // Brand Identity
    brandTagline: "Luxury Redefined",
    brandDescription: "Experience unparalleled luxury and comfort"
  });

  // Load tenant data when available
  useEffect(() => {
    if (tenantInfo) {
      setBrandingData(prev => ({
        ...prev,
        brandDescription: `Experience unparalleled luxury and comfort at ${tenantInfo.hotel_name}`
      }));
    }
  }, [tenantInfo]);

  const [previewMode, setPreviewMode] = useState(false);

  const handleFileUpload = (type: 'logo' | 'favicon' | 'heroImage') => {
    // Simulate file upload
    toast({
      title: "File Upload",
      description: `${type} uploaded successfully`,
    });
    onDataChange();
  };

  const handleColorChange = (colorType: string, value: string) => {
    setBrandingData(prev => ({
      ...prev,
      [colorType]: value
    }));
    onDataChange();
  };

  const colorPresets = [
    {
      name: "Luxury Red & Gold",
      primary: "#D32F2F",
      secondary: "#FFD700",
      accent: "#1A237E"
    },
    {
      name: "Ocean Blue",
      primary: "#1976D2",
      secondary: "#03DAC6", 
      accent: "#FF6F00"
    },
    {
      name: "Forest Green",
      primary: "#388E3C",
      secondary: "#FFC107",
      accent: "#5E35B1"
    },
    {
      name: "Royal Purple",
      primary: "#7B1FA2",
      secondary: "#E91E63",
      accent: "#FF9800"
    }
  ];

  const fontOptions = [
    "Inter", "Playfair Display", "Roboto", "Open Sans", 
    "Lato", "Montserrat", "Source Sans Pro", "Oswald"
  ];

  return (
    <div className="space-y-8">
      {/* Logo & Images */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Logo & Brand Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hotel Logo */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hotel Logo</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your hotel logo (PNG, JPG, SVG)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileUpload('logo')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 400x200px, transparent background
                </p>
              </div>
            </div>

            {/* Favicon */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload favicon (ICO, PNG)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileUpload('favicon')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Favicon
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 32x32px or 64x64px
                </p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Hero Background</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <div className="mx-auto w-24 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload hero image (JPG, PNG)
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFileUpload('heroImage')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 1920x1080px, high quality
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Theme */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Color Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Presets */}
          <div className="space-y-4">
            <Label>Quick Color Presets</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {colorPresets.map((preset, index) => (
                <div 
                  key={index}
                  className="p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    handleColorChange("primaryColor", preset.primary);
                    handleColorChange("secondaryColor", preset.secondary);
                    handleColorChange("accentColor", preset.accent);
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  <p className="text-sm font-medium">{preset.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={brandingData.primaryColor}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="w-12 h-10 p-1 rounded border"
                />
                <Input
                  type="text"
                  value={brandingData.primaryColor}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  placeholder="#D32F2F"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={brandingData.secondaryColor}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="w-12 h-10 p-1 rounded border"
                />
                <Input
                  type="text"
                  value={brandingData.secondaryColor}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  placeholder="#FFD700"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={brandingData.accentColor}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-12 h-10 p-1 rounded border"
                />
                <Input
                  type="text"
                  value={brandingData.accentColor}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  placeholder="#1A237E"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={brandingData.backgroundColor}
                  onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                  className="w-12 h-10 p-1 rounded border"
                />
                <Input
                  type="text"
                  value={brandingData.backgroundColor}
                  onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                  placeholder="#FAFAFA"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Typography Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="headingFont">Heading Font</Label>
              <select 
                id="headingFont"
                value={brandingData.headingFont}
                onChange={(e) => {
                  setBrandingData(prev => ({ ...prev, headingFont: e.target.value }));
                  onDataChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {fontOptions.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
              <p className="text-sm font-playfair" style={{ fontFamily: brandingData.headingFont }}>
                Sample Heading Text
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFont">Body Font</Label>
              <select 
                id="bodyFont"
                value={brandingData.bodyFont}
                onChange={(e) => {
                  setBrandingData(prev => ({ ...prev, bodyFont: e.target.value }));
                  onDataChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {fontOptions.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
              <p className="text-sm" style={{ fontFamily: brandingData.bodyFont }}>
                Sample body text content goes here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Identity */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="h-5 w-5 text-primary" />
            Brand Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brandTagline">Brand Tagline</Label>
            <Input
              id="brandTagline"
              value={brandingData.brandTagline}
              onChange={(e) => {
                setBrandingData(prev => ({ ...prev, brandTagline: e.target.value }));
                onDataChange();
              }}
              placeholder="Luxury Redefined"
            />
            <p className="text-xs text-muted-foreground">
              A short, memorable phrase that captures your hotel's essence
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandDescription">Brand Description</Label>
            <Input
              id="brandDescription"
              value={brandingData.brandDescription}
              onChange={(e) => {
                setBrandingData(prev => ({ ...prev, brandDescription: e.target.value }));
                onDataChange();
              }}
              placeholder="Experience unparalleled luxury and comfort..."
            />
            <p className="text-xs text-muted-foreground">
              A brief description of your hotel for marketing materials
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview & Actions */}
      <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview Changes'}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Brand Kit
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Changes are automatically applied to your hotel's theme
        </div>
      </div>
    </div>
  );
};

export default BrandingForm;