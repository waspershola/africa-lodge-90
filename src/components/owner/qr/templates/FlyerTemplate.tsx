import React from 'react';

interface FlyerTemplateProps {
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

export const FlyerTemplate = ({
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
}: FlyerTemplateProps) => {
  const primaryColor = themeInfo?.colors.primary || '#2563eb';
  const backgroundColor = themeInfo?.colors.background || '#ffffff';
  const accentColor = themeInfo?.colors.accent || '#f8fafc';
  
  return (
    <div 
      className="h-full flex relative"
      style={{ 
        background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}dd)`,
        fontFamily: themeInfo?.fontBody || 'Inter'
      }}
    >
      {/* Left Section - Content */}
      <div className="flex-1 flex flex-col justify-center p-8 text-white">
        {tenantInfo?.logo_url && (
          <div className="mb-6">
            <img 
              src={tenantInfo.logo_url} 
              alt="Hotel Logo" 
              className="h-12 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        )}
        
        <div className="space-y-4">
          <h1 
            className="text-3xl font-bold leading-tight"
            style={{ 
              fontFamily: themeInfo?.fontHeading || 'Playfair Display'
            }}
          >
            {hotelName}
          </h1>
          
          {roomNumber && (
            <p className="text-xl font-semibold opacity-90">
              Room {roomNumber} Services
            </p>
          )}
          
          <div className="space-y-2">
            <p className="text-lg font-medium">
              🚀 Instant Digital Access
            </p>
            <p className="text-sm opacity-80 leading-relaxed">
              Scan the QR code to unlock exclusive hotel services, room controls, concierge assistance, and more - all from your smartphone.
            </p>
          </div>

          {/* Services Preview */}
          {services && services.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Quick Access To:</h3>
              <div className="space-y-2">
                {services.slice(0, 4).map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                    <span className="text-sm">{service}</span>
                  </div>
                ))}
                {services.length > 4 && (
                  <p className="text-xs opacity-70">
                    +{services.length - 4} more services
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium opacity-90">
              📱 Compatible with all smartphones
            </p>
            <p className="text-xs opacity-70 font-mono">
              QR ID: {qrId}
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - QR Code */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-8"
        style={{ 
          background: `linear-gradient(135deg, ${backgroundColor}, ${accentColor})`,
          color: backgroundColor === '#ffffff' ? '#1f2937' : '#f9fafb'
        }}
      >
        <div className="text-center space-y-6">
          <div>
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ color: primaryColor }}
            >
              Scan Here
            </h2>
            <p className="text-sm opacity-70">
              Point your camera at the code
            </p>
          </div>
          
          {/* QR Code */}
          <div 
            className="bg-white p-10 rounded-xl shadow-xl border-4 mx-auto"
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

          {/* Instructions */}
          <div className="space-y-3">
            <div 
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${primaryColor}20`,
                color: primaryColor
              }}
            >
              <span>📸</span>
              <span>No app required</span>
            </div>
            <p className="text-xs opacity-60 max-w-48">
              Works with your phone's built-in camera app. Just point and tap the notification.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div 
          className="absolute bottom-4 right-4 w-16 h-16 opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`
          }}
        />
      </div>
    </div>
  );
};