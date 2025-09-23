import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Wifi, Coffee, Home, Wrench, MessageCircle, Star, Phone, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { QRSecurity } from '@/lib/qr-security';

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

  // Validate QR token and get info
  const { data: qrInfo, isLoading, error } = useQuery({
    queryKey: ['qr-portal', qrToken],
    queryFn: async () => {
      if (!qrToken) throw new Error('Invalid QR code');

      // Validate rate limiting
      const sessionId = `guest_${Date.now()}`;
      if (!QRSecurity.checkRateLimit(sessionId, 'qr_access')) {
        throw new Error('Too many requests. Please wait before trying again.');
      }

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
        .single();

      if (error || !qrData) {
        throw new Error('QR code not found or inactive');
      }

      // Get tenant info separately
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('hotel_name, logo_url')
        .eq('tenant_id', qrData.tenant_id)
        .single();


      // Generate session token for secure access
      const token = QRSecurity.generateSessionToken({
        hotel_id: qrData.tenant_id,
        location_id: qrData.rooms?.room_number || qrData.label || 'unknown',
        location_type: qrData.rooms?.room_number ? 'room' : 'lobby',
        permissions: qrData.services
      });

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
    },
    enabled: !!qrToken,
    retry: false
  });

  useEffect(() => {
    if (qrInfo) {
      // Log access for analytics
      QRSecurity.logAction(sessionToken, 'qr_scanned', {
        qr_token: qrInfo.qr_token,
        location: qrInfo.room_number || qrInfo.label,
        services_available: qrInfo.services.length
      });
    }
  }, [qrInfo, sessionToken]);

  const handleServiceRequest = (service: string) => {
    if (!qrInfo) return;

    // Check rate limiting for service requests
    if (!QRSecurity.checkRateLimit(sessionToken, 'service_request')) {
      alert('Please wait before making another request.');
      return;
    }

    // Navigate to service request page with session token
    navigate(`/guest/service/${service.toLowerCase().replace(/\s+/g, '-')}?token=${sessionToken}&qr=${qrInfo.qr_token}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotel services...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !qrInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invalid QR Code</h3>
            <p className="text-muted-foreground mb-4">
              {error?.message || 'This QR code is not valid or has expired.'}
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
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
                  onClick={() => handleServiceRequest(service)}
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

        {/* Emergency Contact */}
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
              <Button size="sm" variant="outline">
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