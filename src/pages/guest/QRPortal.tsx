import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Coffee, Home, Wrench, MessageCircle, Star, Phone, Clock, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  'Wi-Fi': <Wifi className="h-5 w-5" />,
  'Room Service': <Coffee className="h-5 w-5" />,
  'Housekeeping': <Home className="h-5 w-5" />,
  'Maintenance': <Wrench className="h-5 w-5" />,
  'Digital Menu': <Coffee className="h-5 w-5" />,
  'Events & Packages': <Star className="h-5 w-5" />,
  'Feedback': <MessageCircle className="h-5 w-5" />
};

export default function QRPortal() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [sessionToken, setSessionToken] = useState<string>('');
  const [currentService, setCurrentService] = useState<string | null>(null);

  // Get QR info - graceful handling, no harsh errors
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
          return null; // Graceful fallback instead of throwing
        }

        // Get tenant info separately
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('hotel_name, logo_url')
          .eq('tenant_id', qrData.tenant_id)
          .maybeSingle();

        // Generate simple session token for tracking (no expiry)
        const token = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionToken(token);

        return {
          qr_token: qrData.qr_token,
          room_number: qrData.rooms?.room_number,
          hotel_name: tenantData?.hotel_name || 'Hotel',
          services: qrData.services || [],
          is_active: qrData.is_active,
          label: qrData.label,
          tenant_id: qrData.tenant_id,
          hotel_logo: tenantData?.logo_url
        } as QRCodeInfo;
      } catch (error) {
        console.log('QR lookup error:', error);
        return null; // Graceful fallback
      }
    },
    enabled: !!qrToken,
    retry: false
  });

  // Log access for analytics (optional, lightweight)
  if (qrInfo && sessionToken) {
    // Simple analytics without blocking the UI
    console.log('QR Portal accessed:', {
      hotel: qrInfo.hotel_name,
      location: qrInfo.room_number || qrInfo.label,
      services: qrInfo.services.length
    });
  }

  const selectService = (service: string) => {
    setCurrentService(service);
  };

  const goBack = () => {
    setCurrentService(null);
  };

  const callFrontDesk = () => {
    window.location.href = 'tel:+2347065937769';
  };

  // Show loading only briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏨</span>
            </div>
            <p className="text-muted-foreground">Loading hotel services...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Graceful fallback for invalid QR codes
  if (!qrInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏨</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">QR Code Not Recognized</h3>
            <p className="text-muted-foreground mb-4">
              This QR code is not recognized by our system. Please contact the front desk for assistance.
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render service-specific component
  if (currentService && qrInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                  {qrInfo.hotel_logo ? (
                    <img 
                      src={qrInfo.hotel_logo} 
                      alt="Hotel Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-lg">🏨</span>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{qrInfo.hotel_name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {qrInfo.room_number ? `Room ${qrInfo.room_number}` : qrInfo.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Content */}
        <div className="max-w-2xl mx-auto p-4">
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
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Events & Packages</h3>
                <p className="text-muted-foreground mb-4">
                  Discover our special offers and event packages.
                </p>
                <Button onClick={() => selectService('Front Desk')}>
                  Contact Front Desk for Details
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {qrInfo.hotel_logo ? (
                <img 
                  src={qrInfo.hotel_logo} 
                  alt="Hotel Logo" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl">🏨</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {qrInfo.hotel_name}
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              {qrInfo.room_number ? (
                <>
                  <Home className="h-4 w-4" />
                  <span>Room {qrInfo.room_number}</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>{qrInfo.label || 'Location'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Welcome Message */}
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
            <p className="text-muted-foreground">
              Select a service below to get started. Our staff will respond to your request promptly.
            </p>
          </CardContent>
        </Card>

        {/* Available Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Available Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {qrInfo.services.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No services are currently available for this location.
                </AlertDescription>
              </Alert>
            ) : (
              qrInfo.services.map((service) => (
                <Button
                  key={service}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => selectService(service)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {serviceIcons[service as keyof typeof serviceIcons] || <Star className="h-5 w-5" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{service}</div>
                      <div className="text-xs text-muted-foreground">
                        {service === 'Wi-Fi' && 'Get network credentials and support'}
                        {service === 'Room Service' && 'Order food and beverages'}
                        {service === 'Housekeeping' && 'Request cleaning and amenities'}
                        {service === 'Maintenance' && 'Report issues or request repairs'}
                        {service === 'Digital Menu' && 'View restaurant menu and order'}
                        {service === 'Events & Packages' && 'Explore hotel packages and events'}
                        {service === 'Feedback' && 'Share your experience with us'}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        Available
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Front Desk Contact */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Need immediate assistance?</h3>
                <p className="text-sm text-muted-foreground">Call the front desk directly</p>
              </div>
              <Button size="sm" variant="outline" onClick={callFrontDesk}>
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Available 24/7</span>
          </div>
          <p>Powered by {qrInfo.hotel_name} Guest Services</p>
        </div>
      </div>
    </div>
  );
}