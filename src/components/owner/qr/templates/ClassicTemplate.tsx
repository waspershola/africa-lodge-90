import React from 'react';

interface ClassicTemplateProps {
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

export const ClassicTemplate = ({
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
}: ClassicTemplateProps) => {
  const primaryColor = themeInfo?.colors.primary || '#2563eb';
  const backgroundColor = themeInfo?.colors.background || '#ffffff';
  const accentColor = themeInfo?.colors.accent || '#f8fafc';
  
  return (
    <div 
      className="h-full flex flex-col justify-between p-8 text-center relative"
      style={{ 
        background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}20)`,
        borderTop: `4px solid ${primaryColor}`,
        fontFamily: themeInfo?.fontBody || 'Inter',
        color: backgroundColor === '#ffffff' ? '#1f2937' : '#f9fafb'
      }}
    >
      {/* Header */}
      <div className="space-y-4">
        {tenantInfo?.logo_url && (
          <div className="flex justify-center">
            <img 
              src={tenantInfo.logo_url} 
              alt="Hotel Logo" 
              className="h-16 object-contain"
            />
          </div>
        )}
        
        <div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: primaryColor,
              fontFamily: themeInfo?.fontHeading || 'Playfair Display'
            }}
          >
            {hotelName}
          </h1>
          {roomNumber && (
            <p className="text-xl font-semibold" style={{ opacity: 0.8 }}>
              Room {roomNumber}
            </p>
          )}
          {!roomNumber && assignedTo && (
            <p className="text-lg" style={{ opacity: 0.7 }}>
              {assignedTo}
            </p>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="bg-white p-12 rounded-xl shadow-xl border-4"
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
      </div>

      {/* Services */}
      {services && services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ opacity: 0.9 }}>
            Available Services
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {services.slice(0, 6).map((service) => (
              <span 
                key={service}
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: `${primaryColor}dd` }}
              >
                {service}
              </span>
            ))}
            {services.length > 6 && (
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor
                }}
              >
                +{services.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="space-y-2" style={{ opacity: 0.8 }}>
        <p className="text-lg font-medium">
          📱 Scan with your phone camera
        </p>
        <p className="text-sm">
          Access hotel services instantly
        </p>
        <p className="text-xs font-mono" style={{ opacity: 0.5 }}>
          ID: {qrId}
        </p>
      </div>

      {/* Decorative Elements */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-24 h-24 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`
        }}
      />
    </div>
  );
};