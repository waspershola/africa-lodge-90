import React from 'react';

interface TentCardTemplateProps {
  qrId: string;
  assignedTo: string;
  hotelName: string;
  roomNumber?: string;
  services?: string[];
  qrDataUrl: string;
  themeInfo: any;
  tenantInfo: any;
  templateConfig: any;
  sizeConfig: any;
}

export const TentCardTemplate = ({
  qrId,
  assignedTo,
  hotelName,
  roomNumber,
  services,
  qrDataUrl,
  themeInfo,
  tenantInfo,
  templateConfig,
  sizeConfig
}: TentCardTemplateProps) => {
  const primaryColor = themeInfo?.colors.primary || '#2563eb';
  const backgroundColor = themeInfo?.colors.background || '#ffffff';
  const accentColor = themeInfo?.colors.accent || '#f8fafc';
  
  return (
    <div 
      className="h-full flex relative"
      style={{ 
        background: `linear-gradient(135deg, ${backgroundColor}, ${accentColor}40)`,
        fontFamily: themeInfo?.fontBody || 'Inter',
        color: backgroundColor === '#ffffff' ? '#1f2937' : '#f9fafb'
      }}
    >
      {/* Left Section - QR Code */}
      <div className="w-1/2 flex flex-col items-center justify-center p-2">
        <div 
          className="bg-white p-6 rounded-lg shadow-lg border-4"
          style={{ borderColor: primaryColor }}
        >
          {qrDataUrl && (
            <img 
              src={qrDataUrl}
              alt="QR Code"
              className="block"
              style={{ 
                width: Math.floor(templateConfig.qrSize * sizeConfig.scale), 
                height: Math.floor(templateConfig.qrSize * sizeConfig.scale) 
              }}
            />
          )}
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-sm font-medium" style={{ color: primaryColor }}>
            📱 Scan Here
          </p>
        </div>
      </div>

      {/* Right Section - Content */}
      <div className="flex-1 flex flex-col justify-center p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          {tenantInfo?.logo_url && (
            <div className="mb-2">
              <img 
                src={tenantInfo.logo_url} 
                alt="Hotel Logo" 
                className="h-8 object-contain"
              />
            </div>
          )}
          
          <h1 
            className="text-lg font-bold leading-tight"
            style={{ 
              color: primaryColor,
              fontFamily: themeInfo?.fontHeading || 'Playfair Display'
            }}
          >
            {hotelName}
          </h1>
          
          {roomNumber && (
            <p className="text-sm font-semibold" style={{ opacity: 0.8 }}>
              Room {roomNumber}
            </p>
          )}
        </div>

        {/* Services */}
        {services && services.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold" style={{ opacity: 0.9 }}>
              Digital Services:
            </h3>
            <div className="space-y-1">
              {services.slice(0, 3).map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="text-xs">{service}</span>
                </div>
              ))}
              {services.length > 3 && (
                <p className="text-xs" style={{ opacity: 0.6 }}>
                  +{services.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-1">
          <p className="text-xs font-medium" style={{ opacity: 0.8 }}>
            Quick Access Instructions:
          </p>
          <div className="space-y-0.5">
            <p className="text-xs" style={{ opacity: 0.7 }}>
              • Open your phone camera
            </p>
            <p className="text-xs" style={{ opacity: 0.7 }}>
              • Point at QR code
            </p>
            <p className="text-xs" style={{ opacity: 0.7 }}>
              • Tap the notification
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t" style={{ borderColor: `${primaryColor}30` }}>
          <p className="text-xs font-mono" style={{ opacity: 0.5 }}>
            ID: {qrId}
          </p>
          <p className="text-xs" style={{ opacity: 0.6 }}>
            Available 24/7 • No app required
          </p>
        </div>
      </div>

      {/* Decorative accent */}
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: primaryColor }}
      />
      
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`
        }}
      />
    </div>
  );
};