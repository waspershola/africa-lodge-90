import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Smartphone, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useMaintenanceApi } from '@/hooks/useMaintenance';

// This component demonstrates how QR requests integrate with maintenance
export default function QRIntegration() {
  const { workOrders, acceptWorkOrder, isLoading } = useMaintenanceApi();
  const [qrRequests, setQrRequests] = useState([
    {
      id: 'qr-001',
      timestamp: '2024-01-19T14:30:00Z',
      roomId: '308',
      guestName: 'John Doe',
      issue: 'Light not working',
      description: 'Bedside lamp not turning on',
      status: 'pending',
      urgency: 'medium',
      workOrderId: null
    },
    {
      id: 'qr-002',
      timestamp: '2024-01-19T13:45:00Z',
      roomId: '205',
      guestName: 'Sarah Smith',
      issue: 'AC too loud',
      description: 'Air conditioning making unusual noise',
      status: 'escalated',
      urgency: 'high',
      workOrderId: 'wo-001'
    },
    {
      id: 'qr-003',
      timestamp: '2024-01-19T12:15:00Z',
      roomId: '412',
      guestName: 'Mike Johnson',
      issue: 'Shower pressure low',
      description: 'Water pressure is very weak',
      status: 'resolved',
      urgency: 'low',
      workOrderId: 'wo-003'
    }
  ]);

  // Simulate real-time updates from QR system
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would be a WebSocket connection or Server-Sent Events
      // For demo, we'll occasionally add new QR requests
      if (Math.random() > 0.95) {
        const newRequest = {
          id: `qr-${Date.now()}`,
          timestamp: new Date().toISOString(),
          roomId: String(Math.floor(Math.random() * 500) + 100),
          guestName: 'Guest User',
          issue: 'TV not working',
          description: 'Television screen is black',
          status: 'pending',
          urgency: 'medium',
          workOrderId: null
        };
        setQrRequests(prev => [newRequest, ...prev.slice(0, 9)]);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleEscalateToMaintenance = async (requestId: string) => {
    const request = qrRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Create work order for the QR request
      const workOrderData = {
        roomId: request.roomId,
        issue: request.issue,
        description: `Guest QR Request: ${request.description}`,
        source: 'guest-qr' as const,
        priority: request.urgency === 'high' ? 'high' as const : 'medium' as const,
        estimatedTime: 30
      };

      // In production, this would call the API
      console.log('Creating work order:', workOrderData);
      
      // Update the QR request status
      setQrRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'escalated', workOrderId: `wo-${Date.now()}` }
          : r
      ));
    } catch (error) {
      console.error('Failed to escalate to maintenance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'escalated': return 'orange';
      case 'resolved': return 'green';
      default: return 'secondary';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'orange';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const pendingRequests = qrRequests.filter(r => r.status === 'pending');
  const escalatedRequests = qrRequests.filter(r => r.status === 'escalated');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">QR Guest Requests Integration</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and escalate guest issues from QR room service to maintenance
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending QR Requests</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Smartphone className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escalated to Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{escalatedRequests.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {qrRequests.filter(r => r.urgency === 'high' && r.status !== 'resolved').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {qrRequests.filter(r => r.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent QR Guest Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {qrRequests.map(request => (
                <div key={request.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(request.status) as any}>
                        {request.status}
                      </Badge>
                      <Badge variant={getUrgencyColor(request.urgency) as any}>
                        {request.urgency} priority
                      </Badge>
                      <span className="text-sm font-medium">#{request.id}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{request.issue}</h3>
                    <p className="text-muted-foreground mb-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Room {request.roomId}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.guestName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(request.timestamp).toLocaleString()}
                      </div>
                      {request.workOrderId && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-600 font-medium">
                            Work Order: {request.workOrderId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => handleEscalateToMaintenance(request.id)}
                        disabled={isLoading}
                      >
                        Escalate to Maintenance
                      </Button>
                    )}
                    {request.status === 'escalated' && (
                      <Badge variant="secondary" className="text-center">
                        Work Order Created
                      </Badge>
                    )}
                    {request.status === 'resolved' && (
                      <Badge variant="secondary" className="text-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">QR Portal Connected</span>
              </div>
              <p className="text-sm text-green-600">
                Real-time guest requests being received
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Maintenance Integration</span>
              </div>
              <p className="text-sm text-green-600">
                Automatic work order creation enabled
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Front Desk Notifications</span>
              </div>
              <p className="text-sm text-green-600">
                Status updates sent to front desk
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}