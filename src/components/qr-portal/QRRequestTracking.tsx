import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { QRSession } from '@/hooks/useQRSession';
import { QRRequest } from './QRPortal';

interface QRRequestTrackingProps {
  session: QRSession;
  requests: QRRequest[];
  selectedRequest?: QRRequest | null;
  onBack: () => void;
  onFeedback: (requestId: string) => void;
}

export const QRRequestTracking = ({ 
  session, 
  requests, 
  selectedRequest, 
  onBack, 
  onFeedback 
}: QRRequestTrackingProps) => {
  const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
  const completedRequests = requests.filter(r => r.status === 'completed');

  const getStatusIcon = (status: QRRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'assigned':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'in-progress':
        return <AlertCircle className="h-5 w-5 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: QRRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'in-progress':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (selectedRequest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="p-4">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="font-semibold">Request Details</h1>
              <div></div>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedRequest.title}</span>
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedRequest.status)}
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.status === 'pending' && 'Waiting for assignment'}
                    {selectedRequest.status === 'assigned' && 'Staff member assigned'}
                    {selectedRequest.status === 'in-progress' && 'Request being processed'}
                    {selectedRequest.status === 'completed' && 'Request completed'}
                  </p>
                </div>
              </div>

              {selectedRequest.assigned_staff && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Assigned Staff</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.assigned_staff}
                    </p>
                  </div>
                </div>
              )}

              {selectedRequest.eta_minutes && selectedRequest.status !== 'completed' && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Estimated Time</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRequest.eta_minutes} minutes remaining
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Created {getTimeAgo(selectedRequest.created_at)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated {getTimeAgo(selectedRequest.updated_at)}
                </p>
              </div>

              {selectedRequest.status === 'completed' && (
                <Button 
                  onClick={() => onFeedback(selectedRequest.id)}
                  className="w-full"
                  variant="outline"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Leave Feedback
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold">My Requests</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Active Requests */}
        {activeRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Active Requests</h2>
            <div className="space-y-3">
              {activeRequests.map(request => (
                <Card 
                  key={request.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.hash = `#request-${request.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{request.title}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        <span>
                          {request.status === 'pending' && 'Pending assignment'}
                          {request.status === 'assigned' && 'Staff assigned'}
                          {request.status === 'in-progress' && 'In progress'}
                        </span>
                      </div>
                      {request.eta_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{request.eta_minutes}m</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTimeAgo(request.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Requests */}
        {completedRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Recent Completed</h2>
            <div className="space-y-3">
              {completedRequests.slice(0, 5).map(request => (
                <Card key={request.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{request.title}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(request.updated_at)}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onFeedback(request.id)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Rate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Requests Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't made any service requests yet. Go back to services to get started.
              </p>
              <Button onClick={onBack}>
                Browse Services
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};