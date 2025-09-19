import { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import type { PricingChange } from '@/types/pricing';

interface ApprovalQueueProps {
  pendingChanges: PricingChange[];
  onApprove: (changeId: string) => void;
  onReject: (changeId: string, reason: string) => void;
}

export const ApprovalQueue = ({ pendingChanges, onApprove, onReject }: ApprovalQueueProps) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedChange, setSelectedChange] = useState<PricingChange | null>(null);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'auto-approved': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityLevel = (change: PricingChange) => {
    const absPercentage = Math.abs(change.changePercentage);
    const absAmount = Math.abs(change.changeAmount);
    
    if (absPercentage > 25 || absAmount > 10000) return 'high';
    if (absPercentage > 15 || absAmount > 5000) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleReject = (changeId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this change.",
        variant: "destructive"
      });
      return;
    }
    
    onReject(changeId, rejectionReason);
    setRejectionReason('');
    setSelectedChange(null);
  };

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingChanges.length}</div>
            <div className="text-sm text-muted-foreground">Pending Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {pendingChanges.filter(c => getPriorityLevel(c) === 'high').length}
            </div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {pendingChanges.filter(c => c.changeAmount > 0).length}
            </div>
            <div className="text-sm text-muted-foreground">Price Increases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatTimeAgo(pendingChanges.sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime())[0]?.requestedAt || new Date().toISOString())}
            </div>
            <div className="text-sm text-muted-foreground">Oldest Request</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Changes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Price Changes
          </CardTitle>
          <CardDescription>
            Review and approve pricing changes submitted by managers within delegation limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingChanges.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">All caught up!</p>
              <p>No pending price changes require your review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingChanges.map((change) => {
                const priority = getPriorityLevel(change);
                return (
                  <div key={change.id} className="border rounded-lg p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{change.itemName}</h3>
                          <Badge variant={getStatusColor(change.status)}>
                            {change.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(priority)}>
                            {priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {change.serviceType.replace('-', ' ')} • Requested by {change.requestedBy}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(change.requestedAt)} • Effective {new Date(change.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Price Change Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Current Price</div>
                        <div className="font-bold text-lg">{formatPrice(change.currentPrice)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Proposed Price</div>
                        <div className="font-bold text-lg text-blue-600">{formatPrice(change.proposedPrice)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Change Impact</div>
                        <div className={`font-bold text-lg flex items-center justify-center gap-1 ${
                          change.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {change.changeAmount >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {change.changeAmount >= 0 ? '+' : ''}{formatPrice(change.changeAmount)}
                          <span className="text-sm ml-1">
                            ({change.changePercentage >= 0 ? '+' : ''}{change.changePercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Justification:</div>
                      <div className="text-sm bg-background border rounded p-3">
                        {change.reason}
                      </div>
                    </div>

                    {/* Delegation Alert */}
                    {priority === 'high' && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This change significantly exceeds normal delegation limits and requires careful review.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Price Change Details</DialogTitle>
                            <DialogDescription>
                              Complete information for {change.itemName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium">Request ID:</div>
                                <div className="text-muted-foreground">{change.id}</div>
                              </div>
                              <div>
                                <div className="font-medium">Service Type:</div>
                                <div className="text-muted-foreground capitalize">{change.serviceType.replace('-', ' ')}</div>
                              </div>
                              <div>
                                <div className="font-medium">Requested By:</div>
                                <div className="text-muted-foreground">{change.requestedBy}</div>
                              </div>
                              <div>
                                <div className="font-medium">Request Date:</div>
                                <div className="text-muted-foreground">{new Date(change.requestedAt).toLocaleString()}</div>
                              </div>
                            </div>
                            {change.roomType && change.roomType.length > 0 && (
                              <div>
                                <div className="font-medium text-sm">Room Type Restrictions:</div>
                                <div className="flex gap-2 mt-1">
                                  {change.roomType.map(type => (
                                    <Badge key={type} variant="outline">{type}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedChange(change)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Price Change</DialogTitle>
                              <DialogDescription>
                                Please provide a reason for rejecting this change
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why this change is being rejected..."
                                rows={3}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setRejectionReason('')}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => handleReject(change.id)}
                                >
                                  Reject Change
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm"
                          onClick={() => onApprove(change.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};