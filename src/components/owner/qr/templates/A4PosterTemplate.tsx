import React from 'react';

interface A4PosterTemplateProps {
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

export const A4PosterTemplate = ({
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
}: A4PosterTemplateProps) => {
  const primaryColor = themeInfo?.colors.primary || '#2563eb';
  const backgroundColor = themeInfo?.colors.background || '#ffffff';
  const accentColor = themeInfo?.colors.accent || '#f8fafc';
  
  return (
    <div 
      className="h-full flex flex-col relative"
      style={{ 
        background: `linear-gradient(135deg, ${backgroundColor}, ${accentColor})`,
        fontFamily: themeInfo?.fontBody || 'Inter',
        color: backgroundColor === '#ffffff' ? '#1f2937' : '#f9fafb'
      }}
    >
      {/* Header Section */}
      <div 
        className="text-center py-12 px-8"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          color: '#ffffff'
        }}
      >
        {tenantInfo?.logo_url && (
          <div className="flex justify-center mb-6">
            <img 
              src={tenantInfo.logo_url} 
              alt="Hotel Logo" 
              className="h-20 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        )}
        
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ 
            fontFamily: themeInfo?.fontHeading || 'Playfair Display'
          }}
        >
          {hotelName}
        </h1>
        
        {roomNumber && (
          <p className="text-2xl font-semibold opacity-90">
            Room {roomNumber}
          </p>
        )}
        
        <div className="mt-8">
          <p className="text-xl font-medium">
            Welcome to Digital Services
          </p>
          <p className="text-lg opacity-80 mt-2">
            Scan the QR code below to access our exclusive services
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 py-8">
        {/* QR Code */}
        <div 
          className="bg-white p-8 rounded-2xl shadow-2xl border-4 mb-8"
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
        <div className="text-center space-y-4">
          <h2 
            className="text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            📱 How to Use
          </h2>
          <div className="grid grid-cols-3 gap-8 max-w-2xl">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3"
                style={{ backgroundColor: primaryColor }}
              >
                1
              </div>
              <p className="font-medium">Open Camera</p>
              <p className="text-sm opacity-70">Use your phone's camera app</p>
            </div>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3"
                style={{ backgroundColor: primaryColor }}
              >
                2
              </div>
              <p className="font-medium">Scan QR Code</p>
              <p className="text-sm opacity-70">Point at the QR code above</p>
            </div>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3"
                style={{ backgroundColor: primaryColor }}
              >
                3
              </div>
              <p className="font-medium">Enjoy Services</p>
              <p className="text-sm opacity-70">Access all available features</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Footer */}
      {services && services.length > 0 && (
        <div 
          className="px-8 py-6"
          style={{ backgroundColor: `${accentColor}80` }}
        >
          <h3 
            className="text-xl font-semibold text-center mb-4"
            style={{ color: primaryColor }}
          >
            Available Services
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {services.slice(0, 9).map((service) => (
              <div 
                key={service}
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: '#ffffff', color: primaryColor }}
              >
                <span className="text-sm font-medium">{service}</span>
              </div>
            ))}
          </div>
          {services.length > 9 && (
            <p className="text-center mt-4 text-sm" style={{ opacity: 0.7 }}>
              +{services.length - 9} more services available
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4 px-8" style={{ backgroundColor: primaryColor, color: '#ffffff' }}>
        <p className="text-sm font-mono opacity-70">
          QR ID: {qrId} | Generated for enhanced guest experience
        </p>
      </div>
    </div>
  );
};