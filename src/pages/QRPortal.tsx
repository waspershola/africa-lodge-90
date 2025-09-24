import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, Phone, Utensils, Wrench, MessageCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getThemeInfo, getThemeClassName, getDefaultTheme } from '@/utils/themeUtils';

interface QRData {
  id: string;
  tenant_id: string;
  room_id: string | null;
  room_number?: string;
  hotel_name: string;
  services: string[];
  is_active: boolean;
  theme_id?: string;
  tenant_theme?: string;
}

interface ServiceConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  description: string;
}

const serviceConfigs: Record<string, ServiceConfig> = {
  'wifi_support': { icon: Wifi, label: 'Wi-Fi Support', color: 'bg-blue-500', description: 'Get help with internet connection' },
  'room_service': { icon: Utensils, label: 'Room Service', color: 'bg-green-500', description: 'Order food & beverages' },
  'housekeeping': { icon: Phone, label: 'Housekeeping', color: 'bg-purple-500', description: 'Request cleaning services' },
  'maintenance': { icon: Wrench, label: 'Maintenance', color: 'bg-orange-500', description: 'Report room issues' },
  'concierge': { icon: MessageCircle, label: 'Concierge', color: 'bg-teal-500', description: 'Local recommendations & assistance' },
  'feedback': { icon: Star, label: 'Feedback', color: 'bg-yellow-500', description: 'Share your experience' }
};

export default function QRPortal() {
  const { slug } = useParams<{ slug: string }>();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingService, setSubmittingService] = useState<string | null>(null);
  const { toast } = useToast();

  // Get theme info
  const currentThemeId = qrData?.theme_id || qrData?.tenant_theme || getDefaultTheme();
  const themeInfo = getThemeInfo(currentThemeId);
  const themeClassName = getThemeClassName(currentThemeId);

  useEffect(() => {
    if (!slug) return;
    
    fetchQRData();
  }, [slug]);

  const fetchQRData = async () => {
    try {
      setLoading(true);
      
      // Call the guest portal API
      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${slug}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('QR code not found or invalid');
      }

      const data = await response.json();
      setQrData(data);
    } catch (err) {
      console.error('Failed to fetch QR data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceRequest = async (serviceType: string) => {
    if (!qrData || submittingService) return;

    try {
      setSubmittingService(serviceType);

      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${slug}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_type: serviceType,
          request_details: {
            timestamp: new Date().toISOString(),
            source: 'qr_portal'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const result = await response.json();
      
      toast({
        title: "Request Submitted",
        description: `Your ${serviceConfigs[serviceType]?.label} request has been sent to hotel staff.`,
      });

    } catch (err) {
      console.error('Failed to submit service request:', err);
      toast({
        title: "Request Failed",
        description: "Unable to submit request. Please try again or contact front desk.",
        variant: "destructive"
      });
    } finally {
      setSubmittingService(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/5 to-destructive/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/20">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">QR Code Invalid</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'This QR code is not valid or has expired.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the front desk for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!qrData.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/5 to-destructive/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/20">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Service Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              This QR service is currently inactive.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the front desk for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen p-4 qr-portal qr-theme-${currentThemeId}`}
      style={{ 
        background: 'var(--qr-background)',
        color: 'var(--qr-foreground)',
        fontFamily: 'var(--qr-font-body)'
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card 
          className="shadow-lg qr-card"
          style={{ 
            backgroundColor: 'var(--qr-card)',
            borderColor: 'var(--qr-primary)',
            color: 'var(--qr-card-foreground)'
          }}
        >
          <CardHeader className="text-center">
            <CardTitle 
              className="text-2xl font-bold"
              style={{ 
                color: 'var(--qr-primary)',
                fontFamily: 'var(--qr-font-heading)'
              }}
            >
              {qrData.hotel_name}
            </CardTitle>
            {qrData.room_number && (
              <Badge 
                variant="outline" 
                className="w-fit mx-auto"
                style={{ 
                  borderColor: 'var(--qr-primary)',
                  color: 'var(--qr-primary)',
                  backgroundColor: 'var(--qr-accent)'
                }}
              >
                Room {qrData.room_number}
              </Badge>
            )}
            <p 
              className="text-muted-foreground"
              style={{ 
                color: 'var(--qr-muted)'
              }}
            >
              Select a service to get started
            </p>
          </CardHeader>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qrData.services.map((service) => {
            const config = serviceConfigs[service];
            if (!config) return null;

            const IconComponent = config.icon;
            const isSubmitting = submittingService === service;

            return (
              <Card 
                key={service}
                className="qr-service-card hover:shadow-lg transition-all duration-200 cursor-pointer border-2"
                style={{ 
                  backgroundColor: 'var(--qr-card)',
                  borderColor: 'var(--qr-accent)',
                  color: 'var(--qr-card-foreground)'
                }}
                onClick={() => handleServiceRequest(service)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="p-3 rounded-full text-white"
                      style={{ backgroundColor: 'var(--qr-primary)' }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-lg"
                        style={{ 
                          color: 'var(--qr-card-foreground)',
                          fontFamily: 'var(--qr-font-heading)'
                        }}
                      >
                        {config.label}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ 
                          color: 'var(--qr-muted)'
                        }}
                      >
                        {config.description}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    disabled={isSubmitting || submittingService !== null}
                    style={{ 
                      backgroundColor: 'var(--qr-primary)',
                      color: 'var(--qr-primary-foreground)',
                      borderColor: 'var(--qr-primary)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleServiceRequest(service);
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      `Request ${config.label}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <Card 
          className="shadow-sm qr-card"
          style={{ 
            backgroundColor: 'var(--qr-card)',
            borderColor: 'var(--qr-accent)',
            color: 'var(--qr-card-foreground)'
          }}
        >
          <CardContent className="text-center py-4">
            <p 
              className="text-sm"
              style={{ 
                color: 'var(--qr-muted)'
              }}
            >
              Need immediate assistance? Call the front desk or visit the lobby.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}