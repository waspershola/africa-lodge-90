import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Utensils,
  Bed,
  Wrench,
  Wifi,
  MessageSquare,
  Receipt,
  Clock,
  ChevronRight,
  WifiIcon
} from 'lucide-react';
import { QRSession, HotelConfig } from '@/hooks/useQRSession';
import { QRRequest } from './QRPortal';
import { QRServiceStatus } from './QRServiceStatus';

interface QRServicesProps {
  session: QRSession;
  hotelConfig: HotelConfig;
  requests: QRRequest[];
  onServiceSelect: (service: string) => void;
  onViewRequest: (request: QRRequest) => void;
  isConnected: boolean;
}

export const QRServices = ({ 
  session, 
  hotelConfig, 
  requests, 
  onServiceSelect, 
  onViewRequest,
  isConnected 
}: QRServicesProps) => {
  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const recentRequests = requests.slice(0, 3);

  const services = [
    {
      id: 'room-service',
      title: 'Room Service',
      description: 'Food & beverage delivery',
      icon: <Utensils className="h-6 w-6" />,
      enabled: hotelConfig.enabled_services.includes('room-service'),
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      id: 'housekeeping',
      title: 'Housekeeping',
      description: 'Cleaning & amenities',
      icon: <Bed className="h-6 w-6" />,
      enabled: hotelConfig.enabled_services.includes('housekeeping'),
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      description: 'Technical support & repairs',
      icon: <Wrench className="h-6 w-6" />,
      enabled: hotelConfig.enabled_services.includes('maintenance'),
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      id: 'wifi',
      title: 'Wi-Fi Access',
      description: 'Internet connection',
      icon: <Wifi className="h-6 w-6" />,
      enabled: hotelConfig.enabled_services.includes('wifi'),
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      id: 'feedback',
      title: 'Feedback',
      description: 'Share your experience',
      icon: <MessageSquare className="h-6 w-6" />,
      enabled: hotelConfig.enabled_services.includes('feedback'),
      color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
    },
    {
      id: 'bill-preview',
      title: 'My Bill',
      description: 'View current charges',
      icon: <Receipt className="h-6 w-6" />,
      enabled: hotelConfig.enabled_services.includes('bill-preview'),
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }
  ];

  const enabledServices = services.filter(service => service.enabled);

  const getStatusBadge = (status: QRRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'assigned':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Assigned</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{hotelConfig.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Room {session.room_id}</span>
                <div className="flex items-center gap-1">
                  <WifiIcon className="h-3 w-3" />
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            {activeRequests.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onServiceSelect('tracking')}
                className="relative"
              >
                <Clock className="h-4 w-4 mr-1" />
                {activeRequests.length}
                {activeRequests.some(r => r.status === 'pending') && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 max-w-md mx-auto">
        {/* Connection Status */}
        <div className="mb-4">
          <QRServiceStatus 
            isOnline={isConnected}
            lastSync={new Date().toISOString()}
            pendingRequests={activeRequests.length}
          />
        </div>
        {/* Active Requests Summary */}
        {activeRequests.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-orange-900">Active Requests</h3>
                <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                  {activeRequests.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {recentRequests.map(request => (
                  <div
                    key={request.id}
                    onClick={() => onViewRequest(request)}
                    className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-orange-900">
                        {request.title}
                      </p>
                      <p className="text-xs text-orange-700">
                        {new Date(request.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <ChevronRight className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Services</h2>
          
          <div className="grid grid-cols-1 gap-3">
            {enabledServices.map(service => (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${service.color}`}
                onClick={() => onServiceSelect(service.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-white/60 flex items-center justify-center">
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-lg">🚨</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Emergency</h3>
                <p className="text-sm text-red-700">
                  For urgent assistance, call front desk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Secure connection • Session expires in 24h
          </p>
        </div>
      </div>
    </div>
  );
};