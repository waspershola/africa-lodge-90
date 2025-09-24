import React from 'react';
import { Crown, Wifi, Coffee, Home } from 'lucide-react';

interface ThemePreviewProps {
  theme: string;
  className?: string;
}

export function ThemePreview({ theme, className = "" }: ThemePreviewProps) {
  const getThemeClassName = (themeId: string) => `qr-theme-${themeId}`;

  return (
    <div className={`${getThemeClassName(theme)} qr-portal ${className}`}>
      <div className="w-full h-32 rounded-lg overflow-hidden relative">
        {/* Mini Header */}
        <div className="qr-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 qr-accent rounded-full flex items-center justify-center">
              <Crown className="h-3 w-3" />
            </div>
            <span className="text-xs font-serif">Hotel Preview</span>
          </div>
        </div>
        
        {/* Mini Services */}
        <div className="p-3 space-y-2">
          <div className="qr-service-card p-2 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 qr-accent rounded flex items-center justify-center">
                <Wifi className="h-2 w-2" />
              </div>
              <span className="text-xs">Wi-Fi</span>
            </div>
          </div>
          
          <div className="qr-service-card p-2 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 qr-accent rounded flex items-center justify-center">
                <Coffee className="h-2 w-2" />
              </div>
              <span className="text-xs">Room Service</span>
            </div>
          </div>
        </div>
        
        {/* Mini Button */}
        <div className="p-3">
          <div className="qr-button-primary px-2 py-1 rounded text-xs text-center">
            Call Front Desk
          </div>
        </div>
      </div>
    </div>
  );
}