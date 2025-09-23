import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Coffee, Home, Wrench, MessageCircle, Star, Phone, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  const [submittingService, setSubmittingService] = useState<string | null>(null);

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

  const handleServiceRequest = async (service: string) => {
    if (!qrInfo || submittingService) return;

    // Simple rate limiting check (optional)
    const lastRequest = localStorage.getItem('last_service_request');
    const now = Date.now();
    if (lastRequest && (now - parseInt(lastRequest)) < 1000) {
      return; // Prevent spam clicking
    }
    localStorage.setItem('last_service_request', now.toString());

    try {
      setSubmittingService(service);
      
      // Create a service request directly via API
      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${qrInfo.qr_token}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type: service.toLowerCase().replace(/[\s-]/g, '_'),
          request_details: {
            service_name: service,
            requested_at: new Date().toISOString(),
            guest_session_id: sessionToken
          },
          priority: 1,
          notes: `${service} request from guest`
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Show success message or update UI
        alert(`Your ${service} request has been submitted successfully! Request ID: ${result.request_id || 'N/A'}`);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      alert('Failed to submit your request. Please try again or contact the front desk.');
    } finally {
      setSubmittingService(null);
    }
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
                  disabled={submittingService !== null}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0">
                      {submittingService === service ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></span>
                      ) : (
                        serviceIcons[service as keyof typeof serviceIcons] || <Star className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">
                        {submittingService === service ? 'Submitting...' : service}
                      </div>
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