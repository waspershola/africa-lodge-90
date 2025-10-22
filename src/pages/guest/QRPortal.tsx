import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Coffee, Home, Wrench, MessageCircle, Star, Phone, Clock, User, ArrowLeft, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUnifiedQR } from '@/hooks/useUnifiedQR';
import { getThemeClassName } from '@/utils/themeUtils';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/guest/QRScanner';
import { OfflineIndicator } from '@/components/guest/OfflineIndicator';
import { useOfflineSync } from '@/hooks/useOfflineSync';

// Service Components
import WiFiService from '@/components/guest/services/WiFiService';
import HousekeepingService from '@/components/guest/services/HousekeepingService';
import MaintenanceService from '@/components/guest/services/MaintenanceService';
import FrontDeskService from '@/components/guest/services/FrontDeskService';
import FeedbackService from '@/components/guest/services/FeedbackService';
import RoomServiceMenu from '@/components/guest/services/RoomServiceMenu';

interface QRCodeInfo {
  qr_token: string;
  room_number?: string;
  hotel_name: string;
  services: string[];
  is_active: boolean;
  label?: string;
  tenant_id: string;
  hotel_logo?: string;
  front_desk_phone?: string;
  theme?: string;
}

const serviceIcons = {
  'Wi-Fi': <Wifi className="h-6 w-6" />,
  'Room Service': <Coffee className="h-6 w-6" />,
  'Housekeeping': <Home className="h-6 w-6" />,
  'Maintenance': <Wrench className="h-6 w-6" />,
  'Digital Menu': <Coffee className="h-6 w-6" />,
  'Events & Packages': <Star className="h-6 w-6" />,
  'Feedback': <MessageCircle className="h-6 w-6" />
};

const serviceDescriptions = {
  'Wi-Fi': 'Network credentials & support',
  'Room Service': 'Order food & beverages',
  'Housekeeping': 'Cleaning & amenities',
  'Maintenance': 'Report issues',
  'Digital Menu': 'Browse & order from menu',
  'Events & Packages': 'Explore special offers',
  'Feedback': 'Share your experience'
};

export default function QRPortal() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [currentService, setCurrentService] = useState<string | null>(null);
  const { validateQR } = useUnifiedQR();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(!qrToken);
  const { queueOfflineRequest } = useOfflineSync();

  // Get QR info using unified QR system
  const { data: qrInfo, isLoading } = useQuery({
    queryKey: ['qr-portal', qrToken],
    queryFn: async () => {
      if (!qrToken) return null;

      try {
        // Use unified QR validation which creates session and logs scan
        const result = await validateQR.mutateAsync({
          qrToken,
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timestamp: new Date().toISOString()
          }
        });

        if (!result.success || !result.session) {
          console.error('QR validation failed');
          return null;
        }

        // Store session data for request creation
        setSessionData(result.session);

        // Get room number if room_id exists
        let roomNumber = null;
        if (result.session.roomNumber) {
          roomNumber = result.session.roomNumber;
        }

        // Fetch QR code details to get the actual label
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('label, qr_type')
          .eq('id', result.session.qrCodeId)
          .single();

        if (qrError) {
          console.warn('Failed to fetch QR label:', qrError);
        }

        // Get QR settings for hotel branding
        const { data: qrSettings } = await supabase
          .from('qr_settings')
          .select('hotel_name, hotel_logo_url, primary_color, show_logo_on_qr, front_desk_phone, theme')
          .eq('tenant_id', result.session.tenantId)
          .maybeSingle();

        // Use actual QR label or fallback
        const displayLabel = qrData?.label || 
                            (roomNumber ? `Room ${roomNumber}` : 'Guest Services');

        return {
          qr_token: qrToken,
          room_number: roomNumber,
          hotel_name: result.session.hotelName || qrSettings?.hotel_name || 'Hotel',
          services: result.session.services || [],
          is_active: true,
          label: displayLabel, // ✅ Use actual label
          tenant_id: result.session.tenantId,
          hotel_logo: qrSettings?.show_logo_on_qr ? qrSettings?.hotel_logo_url : undefined,
          front_desk_phone: qrSettings?.front_desk_phone || '+2347065937769',
          theme: qrSettings?.theme || 'classic-luxury-gold'
        } as QRCodeInfo;
      } catch (error) {
        console.error('QR lookup error:', error);
        toast({
          title: 'Session Error',
          description: 'Failed to validate QR code. Please try scanning again.',
          variant: 'destructive'
        });
        return null;
      }
    },
    enabled: !!qrToken,
    retry: false
  });

  const selectService = (service: string) => {
    setCurrentService(service);
  };

  const goBack = () => {
    setCurrentService(null);
  };

  const callFrontDesk = () => {
    const phoneNumber = qrInfo?.front_desk_phone || '+2347065937769';
    window.location.href = `tel:${phoneNumber}`;
  };

  // Get theme class name using utility function
  const themeClassName = getThemeClassName(qrInfo?.theme);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="h-10 w-10 text-white animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
              <h3 className="text-lg font-serif text-amber-900">Loading Services</h3>
              <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
            </div>
            <p className="text-amber-700/70">Preparing your luxury experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show QR Scanner if no token
  if (showScanner && !qrInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-serif text-amber-900 mb-2">Guest Portal</h3>
              <p className="text-amber-700/70 mb-6">
                Scan your QR code to access hotel services
              </p>
            </CardContent>
          </Card>
          
          <QRScanner 
            onScan={(token) => {
              setShowScanner(false);
              navigate(`/guest/qr/${token}`);
            }}
            onError={(error) => {
              toast({
                title: 'Scan Error',
                description: error,
                variant: 'destructive'
              });
            }}
          />
          
          <OfflineIndicator />
        </div>
      </div>
    );
  }

  // Invalid QR code
  if (!qrInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-serif text-amber-900 mb-4">QR Code Expired</h3>
            <p className="text-amber-700/70 mb-6">
              This QR code is no longer valid. Please contact the front desk for a new code or assistance.
            </p>
            <Button 
              onClick={callFrontDesk}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Front Desk
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Service-specific view
  if (currentService && qrInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200">
        {/* Elegant Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-xl border-b border-amber-700/30">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="text-amber-100 hover:text-white hover:bg-amber-800/50 rounded-full p-2 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-amber-600/30 shadow-lg">
                  {qrInfo.hotel_logo ? (
                    <img 
                      src={qrInfo.hotel_logo} 
                      alt="Hotel Logo" 
                      className="w-10 h-10 object-cover rounded-full"
                      onError={(e) => {
                        console.log('Header logo failed to load:', qrInfo.hotel_logo);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.setAttribute('style', 'display: block');
                      }}
                    />
                  ) : null}
                  <Crown className={`h-6 w-6 text-amber-200 ${qrInfo.hotel_logo ? 'hidden' : 'block'}`} />
                </div>
                <div>
                  <h1 className="text-xl font-serif text-white mb-1">{qrInfo.hotel_name}</h1>
                  <p className="text-amber-100 text-lg font-bold flex items-center gap-3">
                    <Home className="h-5 w-5" />
                    <span className="text-xl font-serif tracking-wide">
                      {qrInfo.room_number ? `Room ${qrInfo.room_number}` : qrInfo.label || 'Hotel Services'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Content */}
        <div className="max-w-2xl mx-auto p-6">
          {currentService === 'Wi-Fi' && (
            <WiFiService qrToken={qrInfo.qr_token} sessionToken={sessionData?.sessionId || ''} hotelName={qrInfo.hotel_name} />
          )}
          {currentService === 'Housekeeping' && (
            <HousekeepingService qrToken={qrInfo.qr_token} sessionToken={sessionData?.sessionId || ''} />
          )}
          {currentService === 'Maintenance' && (
            <MaintenanceService qrToken={qrInfo.qr_token} sessionToken={sessionData?.sessionId || ''} />
          )}
          {(currentService === 'Room Service' || currentService === 'Digital Menu') && (
            <RoomServiceMenu qrToken={qrInfo.qr_token} sessionToken={sessionData?.sessionId || ''} />
          )}
          {currentService === 'Events & Packages' && (
            <Card className="shadow-xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-serif text-amber-900 mb-4">Events & Packages</h3>
                <p className="text-amber-700/70 mb-6 text-lg">
                  Discover our exclusive offers and event packages tailored for you.
                </p>
                <Button 
                  onClick={() => selectService('Front Desk')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Concierge
                </Button>
              </CardContent>
            </Card>
          )}
          {currentService === 'Feedback' && (
            <FeedbackService qrToken={qrInfo.qr_token} sessionToken={sessionData?.sessionId || ''} />
          )}
          {currentService === 'Front Desk' && (
            <FrontDeskService 
              qrToken={qrInfo.qr_token} 
              sessionToken={sessionData?.sessionId || ''}
              hotelPhone={qrInfo.front_desk_phone || '+2347065937769'}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`qr-portal ${themeClassName}`}>
      {/* Luxury Header */}
      <div className="qr-card shadow-2xl">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 qr-accent rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-opacity-30 shadow-2xl">
              {qrInfo.hotel_logo ? (
                <img 
                  src={qrInfo.hotel_logo} 
                  alt="Hotel Logo" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-white/20"
                  onError={(e) => {
                    console.log('Logo failed to load:', qrInfo.hotel_logo);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.setAttribute('style', 'display: block');
                  }}
                />
              ) : null}
              <Crown className={`h-12 w-12 ${qrInfo.hotel_logo ? 'hidden' : 'block'}`} />
            </div>
            <h1 className="text-4xl font-serif mb-3 tracking-wide">
              {qrInfo.hotel_name}
            </h1>
            <div className="flex items-center justify-center gap-4 qr-muted mb-4">
              <Sparkles className="h-6 w-6" />
              {qrInfo.room_number ? (
                <>
                  <Home className="h-6 w-6" />
                  <span className="text-2xl font-bold font-serif tracking-wider bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    Room {qrInfo.room_number}
                  </span>
                </>
              ) : (
                <>
                  <User className="h-6 w-6" />
                  <span className="text-2xl font-bold font-serif tracking-wider bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    {qrInfo.label || 'Guest Services'}
                  </span>
                </>
              )}
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="qr-muted opacity-80 text-lg font-light">
              Luxury Guest Services
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Welcome Card */}
        <div className="qr-card shadow-2xl backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-6 w-6" />
              <h2 className="text-2xl font-serif">Welcome</h2>
              <Crown className="h-6 w-6" />
            </div>
            <p className="qr-muted text-lg leading-relaxed">
              Experience our exclusive guest services designed for your comfort and convenience. 
              Our dedicated staff is ready to assist you.
            </p>
          </div>
        </div>

        {/* Service Grid */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-serif mb-2">Guest Services</h3>
            <div className="w-24 h-1 qr-button-primary mx-auto rounded-full"></div>
          </div>
          
          {qrInfo.services.length === 0 ? (
            <div className="qr-card shadow-xl backdrop-blur-sm">
              <div className="p-8 text-center">
                <div className="w-16 h-16 qr-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 opacity-50" />
                </div>
                <p className="qr-muted text-lg">
                  No services are currently available for this location.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {qrInfo.services.map((service) => (
                <button
                  key={service}
                  onClick={() => selectService(service)}
                  className="w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl"
                >
                  <div className="qr-service-card shadow-lg transition-all duration-300 min-h-[120px] flex items-center">
                    <div className="p-6 sm:p-8 flex items-center gap-4 w-full">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 qr-accent rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                        <div className="transition-colors duration-300">
                          {serviceIcons[service as keyof typeof serviceIcons] || <Star className="h-6 w-6 sm:h-8 sm:w-8" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl sm:text-2xl font-serif transition-colors duration-300 mb-2 leading-tight">
                          {service}
                        </h4>
                        <p className="qr-muted transition-colors duration-300 text-sm sm:text-base leading-relaxed">
                          {serviceDescriptions[service as keyof typeof serviceDescriptions]}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 qr-button-primary rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 transform rotate-180" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direct Contact */}
        <div className="qr-card shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 qr-accent rounded-full flex items-center justify-center backdrop-blur-sm border border-opacity-30">
                <Phone className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-serif mb-1">Need Immediate Assistance?</h4>
                <p className="qr-muted">Connect directly with our front desk</p>
              </div>
              <Button 
                onClick={callFrontDesk}
                className="qr-button-primary backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full px-6"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 space-y-3">
          <div className="flex items-center justify-center gap-2 qr-muted">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Available 24/7</span>
          </div>
          <p className="qr-muted text-xs">
            Powered by luxuryhotelpro.com
          </p>
        </div>
      </div>
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}