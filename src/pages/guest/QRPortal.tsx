import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, Coffee, Home, Wrench, MessageCircle, Star, Phone, Clock, User, ArrowLeft, Crown, Sparkles, AlertCircle } from 'lucide-react';
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
import { MyRequestsPanel } from '@/components/guest/MyRequestsPanel';

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

// 📱 Enhanced Device Fingerprinting for stable cross-session identification
// Combines multiple device characteristics for better uniqueness
const getDeviceFingerprint = (): string => {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.hardwareConcurrency || 0,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      navigator.maxTouchPoints || 0,
      navigator.platform
    ];
    
    // Create stable hash from components
    const fingerprint = btoa(components.join('|')).slice(0, 32);
    console.log('🔐 [Device Fingerprint] Generated:', fingerprint);
    return fingerprint;
  } catch (e) {
    console.warn('⚠️ [Device Fingerprint] Failed to generate:', e);
    return 'unknown';
  }
};

// 💾 Store session in both localStorage and sessionStorage
const storeSession = (sessionId: string, expiresAt: string, qrToken: string, sessionInfo: any) => {
  const sessionData = { sessionId, expiresAt, qrToken, ...sessionInfo };
  
  try {
    // LocalStorage (persistent across tabs)
    localStorage.setItem('qr_session_token', sessionId);
    localStorage.setItem('qr_session_expiry', expiresAt);
    localStorage.setItem('qr_session_data', JSON.stringify(sessionInfo));
    localStorage.setItem('qr_token', qrToken);
    localStorage.setItem('device_fingerprint', getDeviceFingerprint());
    
    // SessionStorage (more reliable on mobile browsers)
    sessionStorage.setItem('qr_session_data', JSON.stringify(sessionData));
    
    console.log('💾 Session stored in localStorage + sessionStorage');
  } catch (e) {
    console.error('Failed to store session:', e);
  }
};

// 📖 Retrieve session from sessionStorage first, then localStorage
const getStoredSession = () => {
  try {
    // Try sessionStorage first (better mobile support)
    const sessionData = sessionStorage.getItem('qr_session_data');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      console.log('✅ Retrieved session from sessionStorage');
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse sessionStorage:', e);
  }
  
  // Fall back to localStorage
  try {
    return {
      sessionId: localStorage.getItem('qr_session_token'),
      expiresAt: localStorage.getItem('qr_session_expiry'),
      qrToken: localStorage.getItem('qr_token')
    };
  } catch (e) {
    console.warn('Failed to read localStorage:', e);
    return { sessionId: null, expiresAt: null, qrToken: null };
  }
};

export default function QRPortal() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [currentService, setCurrentService] = useState<string | null>(null);
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(!qrToken);
  const { queueOfflineRequest } = useOfflineSync();
  
  // Circuit breaker state for preventing infinite retries
  const [retryCount, setRetryCount] = useState(0);
  const [permanentError, setPermanentError] = useState<string | null>(null);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const MAX_RETRIES = 3;
  
  // ✅ Phase 3: Simplified session restoration (removed redundant validation)
  useEffect(() => {
    const stored = getStoredSession();
    
    if (stored.sessionId && stored.expiresAt && stored.qrToken === qrToken) {
      const expiryDate = new Date(stored.expiresAt);
      if (expiryDate > new Date()) {
        console.log('✅ Restored session:', stored.sessionId);
        setSessionData({ sessionId: stored.sessionId, expiresAt: stored.expiresAt });
      }
    }
  }, [qrToken]);
  
  // Debug logging
  console.log('🔍 QRPortal render - sessionData:', sessionData, 'sessionId:', sessionData?.sessionId);

  // Phase 1: Call edge function with circuit breaker and timeout protection
  const { data: qrInfo, isLoading, error: qrError, refetch } = useQuery({
    queryKey: ['qr-portal', qrToken, retryCount],
    queryFn: async () => {
      // Circuit breaker: Stop after max retries
      if (retryCount >= MAX_RETRIES) {
        setPermanentError('Unable to connect after multiple attempts. Please scan QR code again or check your internet connection.');
        return null;
      }
      console.log('[QRPortal] 🚀 Phase 1: Starting QR validation for token:', qrToken);
      const startTime = Date.now();
      
      if (!qrToken) {
        console.log('❌ [QRPortal Query] No qrToken provided');
        return null;
      }

      try {
        // ✅ Simplified session validation - trust localStorage if valid and unexpired
        const stored = getStoredSession();
        if (stored.sessionId && stored.qrToken === qrToken && stored.expiresAt) {
          const expiryDate = new Date(stored.expiresAt);
          if (expiryDate > new Date()) {
            console.log('✅ Using cached session, skipping edge function call');
            const storedData = localStorage.getItem('qr_session_data');
            if (storedData) {
              try {
                const parsedData = JSON.parse(storedData);
                setSessionData(parsedData);
                
                // Just fetch static QR info (no session validation needed)
                const { data: qrData } = await supabase
                  .from('qr_codes')
                  .select('label, qr_type, tenant_id')
                  .eq('qr_token', qrToken)
                  .single();
                
                const { data: qrSettings } = await supabase
                  .from('qr_settings')
                  .select('hotel_name, hotel_logo_url, front_desk_phone, theme')
                  .eq('tenant_id', qrData?.tenant_id)
                  .maybeSingle();
                
                return {
                  qr_token: qrToken,
                  room_number: parsedData.roomNumber,
                  hotel_name: parsedData.hotelName || qrSettings?.hotel_name || 'Hotel',
                  services: parsedData.services || [],
                  is_active: true,
                  label: qrData?.label || 'Guest Services',
                  tenant_id: qrData?.tenant_id,
                  hotel_logo: qrSettings?.hotel_logo_url,
                  front_desk_phone: qrSettings?.front_desk_phone,
                  theme: qrSettings?.theme
                } as QRCodeInfo;
              } catch (e) {
                console.warn('[⚠️ QRPortal] Parse error, will create new session:', e);
              }
            }
          } else {
            console.log('📅 Session expired, creating new session');
          }
        }
        
        console.log('[QRPortal] 📡 Session expired or missing, validating with edge function...');
        
        // 5-second timeout for edge function call
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 5 seconds. Please check your internet and try again.')), 5000)
        );
        
        // Call the edge function with device fingerprint
        const deviceFingerprint = getDeviceFingerprint();
        const edgeFunctionCall = supabase.functions.invoke('qr-unified-api/validate', {
          body: {
            qrToken,
            deviceInfo: {
              fingerprint: deviceFingerprint, // CRITICAL: Server uses this to identify device
              userAgent: navigator.userAgent,
              language: navigator.language,
              platform: navigator.platform,
              timestamp: new Date().toISOString()
            }
          }
        });
        
        console.log('📡 [QRPortal] Calling edge function with fingerprint:', deviceFingerprint);
        
        const { data, error } = await Promise.race([
          edgeFunctionCall,
          timeoutPromise
        ]) as any;

        const duration = Date.now() - startTime;
        console.log(`[QRPortal] 📥 Edge function response (${duration}ms):`, { data, error });

        if (error) {
          console.error('[QRPortal] ❌ Edge function error:', error);
          throw error;
        }

        if (!data?.success || !data?.session) {
          console.error('[QRPortal] ❌ Validation failed:', data);
          return null;
        }

        console.log('[QRPortal] ✅ Validation successful:', data.session);

        // Phase 1: Store complete session data with enhanced persistence
        const sessionInfo = {
          sessionId: data.session.sessionId,
          tenantId: data.session.tenantId,
          qrCodeId: data.session.qrCodeId,
          hotelName: data.session.hotelName,
          roomNumber: data.session.roomNumber,
          services: data.session.services,
          expiresAt: data.session.expiresAt,
          token: data.session.token
        };
        
        setSessionData(sessionInfo);
        
        // Use enhanced storage with sessionStorage fallback
        storeSession(data.session.sessionId, data.session.expiresAt || '', qrToken, sessionInfo);
        console.log('[QRPortal] 💾 Session stored with device fingerprint:', sessionInfo);

        // Get room number if room_id exists
        let roomNumber = data.session.roomNumber || null;

        // Fetch QR code details to get the actual label
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('label, qr_type')
          .eq('id', data.session.qrCodeId)
          .single();

        if (qrError) {
          console.warn('⚠️ [QRPortal Query] Failed to fetch QR label:', qrError);
        }

        // Get QR settings for hotel branding
        const { data: qrSettings } = await supabase
          .from('qr_settings')
          .select('hotel_name, hotel_logo_url, primary_color, show_logo_on_qr, front_desk_phone, theme')
          .eq('tenant_id', data.session.tenantId)
          .maybeSingle();

        // Use actual QR label or fallback
        const displayLabel = qrData?.label || 
                            (roomNumber ? `Room ${roomNumber}` : 'Guest Services');

        const qrInfo = {
          qr_token: qrToken,
          room_number: roomNumber,
          hotel_name: data.session.hotelName || qrSettings?.hotel_name || 'Hotel',
          services: data.session.services || [],
          is_active: true,
          label: displayLabel,
          tenant_id: data.session.tenantId,
          hotel_logo: qrSettings?.show_logo_on_qr ? qrSettings?.hotel_logo_url : undefined,
          front_desk_phone: qrSettings?.front_desk_phone || '+2347065937769',
          theme: qrSettings?.theme || 'classic-luxury-gold'
        } as QRCodeInfo;

        console.log('[QRPortal] ✅ Final qrInfo:', qrInfo);
        return qrInfo;
      } catch (error) {
        console.error('[QRPortal] 💥 Query exception:', error);
        const duration = Date.now() - startTime;
        console.log(`[QRPortal] ⏱️ Failed after ${duration}ms`);
        setRetryCount(prev => prev + 1);
        throw error;
      }
    },
    enabled: !!qrToken && retryCount < MAX_RETRIES && !permanentError,
    retry: false, // Disable React Query retry, using circuit breaker instead
    staleTime: 0,
    gcTime: 0
  });

  // Show loading timeout message after 5 seconds
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setLoadingTooLong(true), 5000);
      return () => clearTimeout(timer);
    }
    setLoadingTooLong(false);
  }, [isLoading]);

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

  console.log('[QRPortal] 🎨 Render state:', {
    isLoading,
    hasError: !!qrError,
    hasQrInfo: !!qrInfo,
    hasSessionData: !!sessionData,
    qrToken,
    storedToken: localStorage.getItem('qr_session_token')
  });

  // Phase 2: Loading state with timeout warning
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="h-10 w-10 text-white animate-pulse" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
                <h3 className="text-lg font-serif text-amber-900">Loading Services</h3>
                <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
              </div>
              <p className="text-amber-700/70">Preparing your luxury experience...</p>
              
              {loadingTooLong && (
                <Alert className="mt-4">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    This is taking longer than expected. Please check your internet connection.
                  </AlertDescription>
                </Alert>
              )}
              
              {loadingTooLong && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setRetryCount(0);
                    setPermanentError(null);
                    setLoadingTooLong(false);
                    refetch();
                  }}
                  className="mt-4"
                >
                  Cancel & Retry
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Phase 2 & 5: Show My Requests button even while loading */}
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MyRequestsPanel 
            key={localStorage.getItem('qr_session_token') || 'no-session'}
            sessionToken={localStorage.getItem('qr_session_token') || ''} 
            qrToken={qrToken || ''}
          />
        </div>
      </div>
    );
  }

  // Phase 4: Error state with circuit breaker and specific messages
  if (qrError || permanentError) {
    const errorMessage = permanentError || 
      (qrError instanceof Error && qrError.message.includes('timeout')
        ? 'Connection timeout. Please check your internet connection and try again.'
        : qrError instanceof Error && qrError.message.includes('expired')
        ? 'Session expired. Please scan QR code again.'
        : qrError instanceof Error 
        ? qrError.message 
        : 'Unable to connect to room services. Please try again.');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200">
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-2xl border-red-200/50 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-serif text-amber-900 mb-4">
                {permanentError ? 'Connection Failed' : 'Temporary Issue'}
              </h3>
              <p className="text-amber-700/70 mb-4">{errorMessage}</p>
              {retryCount >= MAX_RETRIES && (
                <p className="text-sm text-muted-foreground mb-2">
                  Tried {retryCount} times without success.
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-6">
                {permanentError 
                  ? 'Try scanning the QR code again or contact front desk for assistance.' 
                  : 'Please check your internet connection and try again.'}
              </p>
              <Button 
                onClick={() => {
                  setRetryCount(0);
                  setPermanentError(null);
                  setLoadingTooLong(false);
                  refetch();
                }} 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Phase 2: Show My Requests button even on error */}
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MyRequestsPanel 
            key={localStorage.getItem('qr_session_token') || 'no-session'}
            sessionToken={localStorage.getItem('qr_session_token') || ''} 
            qrToken={qrToken || ''}
          />
        </div>
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

  // Phase 5: Main portal with fixed button
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
        {/* Phase 1C: My Requests Panel - Prominently positioned ABOVE welcome card */}
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-sm">
            <MyRequestsPanel 
              key={sessionData?.sessionId || 'no-session'}
              sessionToken={sessionData?.sessionId || ''} 
              qrToken={qrInfo.qr_token} 
            />
          </div>
        </div>

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
      
      {/* Phase 5: Fixed position "My Requests" button - always visible above the fold */}
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <MyRequestsPanel 
          key={sessionData?.sessionId || localStorage.getItem('qr_session_token') || 'no-session'}
          sessionToken={sessionData?.sessionId || localStorage.getItem('qr_session_token') || ''} 
          qrToken={qrToken || ''}
        />
      </div>
    </div>
  );
}