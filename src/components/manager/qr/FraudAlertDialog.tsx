import { AlertTriangle, Shield, Clock, User, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FraudAlert {
  id: string;
  type: 'quick_completion' | 'no_confirmation' | 'frequent_cancellation' | 'unusual_pattern';
  room: string;
  staff: string;
  details: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  occurrences: number;
}

interface FraudAlertDialogProps {
  trigger: React.ReactNode;
}

const fraudAlerts: FraudAlert[] = [
  {
    id: 'FA-001',
    type: 'quick_completion',
    room: '203',
    staff: 'John Doe',
    details: 'Marked 3 room service requests as completed within 2 minutes each',
    timestamp: '2024-01-15 14:30:00',
    severity: 'high',
    occurrences: 3
  },
  {
    id: 'FA-002',
    type: 'no_confirmation',
    room: '156',
    staff: 'Sarah Wilson',
    details: 'Completed requests without guest confirmation code',
    timestamp: '2024-01-15 13:45:00',
    severity: 'medium',
    occurrences: 2
  },
  {
    id: 'FA-003',
    type: 'frequent_cancellation',
    room: '301',
    staff: 'Mike Johnson',
    details: 'Cancelled 5 requests in past 2 hours citing "guest unavailable"',
    timestamp: '2024-01-15 12:15:00',
    severity: 'medium',
    occurrences: 5
  }
];

export const FraudAlertDialog = ({ trigger }: FraudAlertDialogProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quick_completion': return <Clock className="h-4 w-4" />;
      case 'no_confirmation': return <Shield className="h-4 w-4" />;
      case 'frequent_cancellation': return <TrendingDown className="h-4 w-4" />;
      case 'unusual_pattern': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quick_completion': return 'Suspiciously Quick Completion';
      case 'no_confirmation': return 'Missing Guest Confirmation';
      case 'frequent_cancellation': return 'Frequent Cancellations';
      case 'unusual_pattern': return 'Unusual Activity Pattern';
      default: return 'Unknown Pattern';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Fraud & Abuse Detection
          </DialogTitle>
          <DialogDescription>
            Automated detection of suspicious QR service activities and staff behavior patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">3</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">10</div>
                <div className="text-sm text-muted-foreground">Flagged Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">2.1%</div>
                <div className="text-sm text-muted-foreground">Fraud Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Fraud Alerts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Fraud Alerts</h3>
            
            {fraudAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(alert.type)}
                      <div>
                        <CardTitle className="text-base">{getTypeLabel(alert.type)}</CardTitle>
                        <CardDescription className="text-sm">
                          Alert ID: {alert.id} • Room {alert.room}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity} risk
                      </Badge>
                      <Badge variant="outline">
                        {alert.occurrences}x
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm">{alert.details}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Staff Member:</span>
                        <div className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {alert.staff}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Detected:</span>
                        <div className="font-medium">{alert.timestamp}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Investigate
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1">
                        Escalate to Owner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detection Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Detection Rules
              </CardTitle>
              <CardDescription>
                Automated patterns that trigger fraud alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Quick Completion Detection</div>
                    <div className="text-xs text-muted-foreground">
                      Flags requests completed in under 5 minutes
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Confirmation Bypass</div>
                    <div className="text-xs text-muted-foreground">
                      Detects completion without guest confirmation
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Excessive Cancellations</div>
                    <div className="text-xs text-muted-foreground">
                      Monitors high cancellation rates per staff
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">After-Hours Pattern</div>
                    <div className="text-xs text-muted-foreground">
                      Unusual activity outside normal hours
                    </div>
                  </div>
                  <Badge variant="secondary">Monitoring</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline">
            Configure Detection Rules
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              Export Report
            </Button>
            <Button>
              Acknowledge All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};