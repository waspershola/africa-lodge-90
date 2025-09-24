import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Wifi, Coffee, Phone, Sparkles, Palette, Eye } from 'lucide-react';
import { THEME_DEFINITIONS } from '@/utils/themeUtils';

interface ThemeShowcaseProps {
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
}

export function ThemeShowcase({ selectedTheme, onThemeSelect }: ThemeShowcaseProps) {
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const themes = Object.values(THEME_DEFINITIONS);

  const PreviewMiniPortal = ({ themeId }: { themeId: string }) => {
    const theme = THEME_DEFINITIONS[themeId];
    
    return (
      <div 
        className={`qr-theme-${themeId} qr-portal relative overflow-hidden rounded-lg`}
        style={{ minHeight: '200px' }}
      >
        {/* Mini Header */}
        <div className="qr-card p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 qr-accent rounded-full flex items-center justify-center">
              <Crown className="h-3 w-3" />
            </div>
            <div>
              <h4 className="text-sm font-serif">Luxury Hotel</h4>
              <p className="text-xs qr-muted">Room 101</p>
            </div>
          </div>
        </div>
        
        {/* Mini Services */}
        <div className="p-3 space-y-2">
          <div className="qr-service-card p-2 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 qr-accent rounded flex items-center justify-center">
                <Wifi className="h-3 w-3" />
              </div>
              <span className="text-xs">Wi-Fi Access</span>
            </div>
          </div>
          
          <div className="qr-service-card p-2 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 qr-accent rounded flex items-center justify-center">
                <Coffee className="h-3 w-3" />
              </div>
              <span className="text-xs">Room Service</span>
            </div>
          </div>
        </div>
        
        {/* Mini Contact */}
        <div className="p-3">
          <div className="qr-button-primary px-3 py-1.5 rounded-full text-xs flex items-center justify-center gap-1">
            <Phone className="h-3 w-3" />
            <span>Call Front Desk</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Theme Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {themes.map((theme) => (
          <Card 
            key={theme.id}
            className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] border-2 ${
              selectedTheme === theme.id 
                ? 'border-amber-400 shadow-xl ring-2 ring-amber-400/20' 
                : 'border-amber-200 hover:border-amber-300 hover:shadow-lg'
            }`}
            onClick={() => onThemeSelect(theme.id)}
          >
            <CardContent className="p-6">
              {/* Theme Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full shadow-md"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div>
                    <h3 className="font-semibold text-amber-900">{theme.name}</h3>
                    <p className="text-xs text-amber-700/60">{theme.fontHeading} • {theme.fontBody}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTheme(previewTheme === theme.id ? null : theme.id);
                    }}
                    className="text-amber-700 hover:text-amber-900"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {selectedTheme === theme.id && (
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Description */}
              <p className="text-sm text-amber-700/70 mb-4">{theme.description}</p>

              {/* Color Palette */}
              <div className="flex items-center gap-3 mb-4">
                <Palette className="h-4 w-4 text-amber-600" />
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded border shadow-sm"
                    style={{ backgroundColor: theme.colors.primary }}
                    title={`Primary: ${theme.colors.primary}`}
                  />
                  <div 
                    className="w-5 h-5 rounded border shadow-sm"
                    style={{ backgroundColor: theme.colors.background }}
                    title={`Background: ${theme.colors.background}`}
                  />
                  <div 
                    className="w-5 h-5 rounded border shadow-sm"
                    style={{ backgroundColor: theme.colors.accent }}
                    title={`Accent: ${theme.colors.accent}`}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1">
                {theme.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-amber-700/60">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Live Preview */}
              {previewTheme === theme.id && (
                <div className="mt-4 border-t border-amber-200 pt-4">
                  <div className="text-xs text-amber-700 mb-2 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>Live Preview</span>
                  </div>
                  <PreviewMiniPortal themeId={theme.id} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Instructions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Theme System Overview</h4>
              <p className="text-sm text-blue-700/70 leading-relaxed mb-3">
                Each theme provides a complete visual identity for your guest QR portal, including:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700/70">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span>Custom color palettes and gradients</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span>Typography and font combinations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span>Unique animations and hover effects</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full" />
                  <span>Responsive design optimization</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}