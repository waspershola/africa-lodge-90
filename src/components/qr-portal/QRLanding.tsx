import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Wifi, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { QRSession, HotelConfig } from '@/hooks/useQRSession';
import { QRRequest } from './QRPortal';

interface QRLandingProps {
  session: QRSession;
  hotelConfig: HotelConfig;
  requests: QRRequest[];
  onContinue: () => void;
}

export const QRLanding = ({ session, hotelConfig, requests, onContinue }: QRLandingProps) => {
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'in-progress');
  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');

  const getLocationTitle = () => {
    switch (session.location_type) {
      case 'room': return `Room ${session.room_id} Services`;
      case 'bar': return 'Bar Services';
      case 'pool': return 'Poolside Services';
      case 'restaurant': return 'Restaurant Services';
      default: return 'Hotel Services';
    }
  };

  const getLocationIcon = () => {
    switch (session.location_type) {
      case 'room': return <MapPin className="h-5 w-5" />;
      case 'bar': return <span className="text-lg">🍹</span>;
      case 'pool': return <span className="text-lg">🏊‍♀️</span>;
      case 'restaurant': return <span className="text-lg">🍽️</span>;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="p-6 max-w-md mx-auto">
        {/* Hotel Branding */}
        <div className="text-center mb-8 pt-8">
          {hotelConfig.logo && (
            <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <img 
                src={hotelConfig.logo} 
                alt={hotelConfig.name}
                className="h-12 w-12 object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {hotelConfig.name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {getLocationIcon()}
            <span className="text-lg font-medium">{getLocationTitle()}</span>
          </div>
        </div>

        {/* Quick Status */}
        <div className="space-y-4 mb-8">
          {/* Wi-Fi Status */}
          {hotelConfig.wifi_ssid && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Wifi className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Wi-Fi Connected</p>
                      <p className="text-sm text-muted-foreground">{hotelConfig.wifi_ssid}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Requests */}
          {activeRequests.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {activeRequests.length} Active Request{activeRequests.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pendingRequests.length > 0 
                          ? `${pendingRequests.length} pending response`
                          : 'All requests in progress'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    {activeRequests.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Welcome Message */}
          {activeRequests.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">👋</span>
                </div>
                <h3 className="font-semibold mb-2">Welcome!</h3>
                <p className="text-sm text-muted-foreground">
                  Access all hotel services through this portal. No app download required.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Service Preview */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Available Services</h3>
          <div className="grid grid-cols-2 gap-3">
            {hotelConfig.enabled_services.includes('room-service') && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <span className="text-2xl mb-1 block">🍽️</span>
                <p className="text-sm font-medium">Room Service</p>
              </div>
            )}
            {hotelConfig.enabled_services.includes('housekeeping') && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <span className="text-2xl mb-1 block">🧹</span>
                <p className="text-sm font-medium">Housekeeping</p>
              </div>
            )}
            {hotelConfig.enabled_services.includes('maintenance') && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <span className="text-2xl mb-1 block">🔧</span>
                <p className="text-sm font-medium">Maintenance</p>
              </div>
            )}
            {hotelConfig.enabled_services.includes('feedback') && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <span className="text-2xl mb-1 block">📝</span>
                <p className="text-sm font-medium">Feedback</p>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <Button 
          onClick={onContinue}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          Access Services
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>

        {/* Session Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Session ID: {session.guest_session_id.slice(-8)}
          </p>
        </div>
      </div>
    </div>
  );
};