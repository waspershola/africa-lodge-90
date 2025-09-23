import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Coffee, Home, Wrench, MessageCircle, Star, Phone, Clock, User, ArrowLeft, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [sessionToken, setSessionToken] = useState<string>('');
  const [currentService, setCurrentService] = useState<string | null>(null);

  // Get QR info - graceful handling
  const { data: qrInfo, isLoading } = useQuery({
    queryKey: ['qr-portal', qrToken],
    queryFn: async () => {
      if (!qrToken) return null;

      try {
        // Get QR code info from database
        const { data: qrData, error } = await supabase
          .from('qr_codes')
          .select(`
            qr_token,
            services,
            is_active,
            label,
            tenant_id,
            rooms:room_id (room_number)
          `)
          .eq('qr_token', qrToken)
          .eq('is_active', true)
          .maybeSingle();

        if (error || !qrData) {
          return null;
        }

        // Get tenant info separately
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('hotel_name, logo_url')
          .eq('tenant_id', qrData.tenant_id)
          .maybeSingle();

        console.log('Tenant data fetched:', tenantData);
        console.log('Tenant error:', tenantError);

        // Generate session token
        const token = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionToken(token);

        return {
          qr_token: qrData.qr_token,
          room_number: qrData.rooms?.room_number,
          hotel_name: tenantData?.hotel_name || 'Default Hotel',
          services: qrData.services || [],
          is_active: qrData.is_active,
          label: qrData.label,
          tenant_id: qrData.tenant_id,
          hotel_logo: tenantData?.logo_url
        } as QRCodeInfo;
      } catch (error) {
        console.error('QR lookup error:', error);
        console.error('Failed to fetch QR data or tenant info');
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
    window.location.href = 'tel:+2347065937769';
  };

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
                      className="w-full h-full object-contain rounded-full"
                    />
                  ) : (
                    <Crown className="h-6 w-6 text-amber-200" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-serif text-white mb-1">{qrInfo.hotel_name}</h1>
                  <p className="text-amber-200/80 text-sm flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    {qrInfo.room_number ? `Room ${qrInfo.room_number}` : qrInfo.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Content */}
        <div className="max-w-2xl mx-auto p-6">
          {currentService === 'Wi-Fi' && (
            <WiFiService qrToken={qrInfo.qr_token} sessionToken={sessionToken} hotelName={qrInfo.hotel_name} />
          )}
          {currentService === 'Housekeeping' && (
            <HousekeepingService qrToken={qrInfo.qr_token} sessionToken={sessionToken} />
          )}
          {currentService === 'Maintenance' && (
            <MaintenanceService qrToken={qrInfo.qr_token} sessionToken={sessionToken} />
          )}
          {(currentService === 'Room Service' || currentService === 'Digital Menu') && (
            <RoomServiceMenu qrToken={qrInfo.qr_token} sessionToken={sessionToken} />
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
            <FeedbackService qrToken={qrInfo.qr_token} sessionToken={sessionToken} />
          )}
          {currentService === 'Front Desk' && (
            <FrontDeskService qrToken={qrInfo.qr_token} sessionToken={sessionToken} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200">
      {/* Luxury Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 shadow-2xl">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-amber-600/30 shadow-2xl">
              {qrInfo.hotel_logo ? (
                <img 
                  src={qrInfo.hotel_logo} 
                  alt="Hotel Logo" 
                  className="w-full h-full object-contain rounded-full"
                />
              ) : (
                <Crown className="h-12 w-12 text-amber-200" />
              )}
            </div>
            <h1 className="text-4xl font-serif text-white mb-3 tracking-wide">
              {qrInfo.hotel_name}
            </h1>
            <div className="flex items-center justify-center gap-3 text-amber-200/90 mb-2">
              <Sparkles className="h-5 w-5" />
              {qrInfo.room_number ? (
                <>
                  <Home className="h-5 w-5" />
                  <span className="text-lg font-medium">Room {qrInfo.room_number}</span>
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  <span className="text-lg font-medium">{qrInfo.label || 'Welcome'}</span>
                </>
              )}
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-amber-100/80 text-lg font-light">
              Luxury Guest Services
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Welcome Card */}
        <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-amber-600" />
              <h2 className="text-2xl font-serif text-amber-900">Welcome</h2>
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-amber-700/70 text-lg leading-relaxed">
              Experience our exclusive guest services designed for your comfort and convenience. 
              Our dedicated staff is ready to assist you.
            </p>
          </CardContent>
        </Card>

        {/* Service Grid */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-serif text-amber-900 mb-2">Guest Services</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full"></div>
          </div>
          
          {qrInfo.services.length === 0 ? (
            <Card className="shadow-xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-amber-600/50" />
                </div>
                <p className="text-amber-700/70 text-lg">
                  No services are currently available for this location.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {qrInfo.services.map((service) => (
                <button
                  key={service}
                  onClick={() => selectService(service)}
                  className="w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl"
                >
                  <Card className="group cursor-pointer shadow-lg hover:shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white/95 active:scale-[0.98]">
                    <CardContent className="p-6 sm:p-8 min-h-[120px] flex items-center">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl flex items-center justify-center group-hover:from-amber-400/30 group-hover:to-amber-600/30 transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                          <div className="text-amber-700 group-hover:text-amber-800 transition-colors duration-300">
                            {serviceIcons[service as keyof typeof serviceIcons] || <Star className="h-6 w-6 sm:h-8 sm:w-8" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl sm:text-2xl font-serif text-amber-900 group-hover:text-amber-800 transition-colors duration-300 mb-2 leading-tight">
                            {service}
                          </h4>
                          <p className="text-amber-700/70 group-hover:text-amber-700/90 transition-colors duration-300 text-sm sm:text-base leading-relaxed">
                            {serviceDescriptions[service as keyof typeof serviceDescriptions]}
                          </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white transform rotate-180" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direct Contact */}
        <Card className="shadow-xl border-amber-200/50 bg-gradient-to-br from-amber-800 to-amber-900 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-amber-600/30">
                <Phone className="h-6 w-6 text-amber-200" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-serif mb-1">Need Immediate Assistance?</h4>
                <p className="text-amber-100/80">Connect directly with our front desk</p>
              </div>
              <Button 
                onClick={callFrontDesk}
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-amber-600/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full px-6"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-700/60">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Available 24/7</span>
          </div>
          <p className="text-sm text-amber-600/50 font-light">
            Powered by {qrInfo.hotel_name} Guest Services
          </p>
        </div>
      </div>
    </div>
  );
}