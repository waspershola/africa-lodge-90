import { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Eye, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrency } from '@/hooks/useCurrency';
import type { PricingChange } from '@/types/pricing';

interface ApprovalQueueProps {
  pendingChanges: PricingChange[];
  onApprove: (changeId: string) => void;
  onReject: (changeId: string, reason: string) => void;
}

export const ApprovalQueue = ({ pendingChanges }: ApprovalQueueProps) => {
  const [selectedChange, setSelectedChange] = useState<PricingChange | null>(null);
  const { formatPrice } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'auto-approved': return 'secondary';
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting owner approval';
      case 'approved': return 'Approved by owner';
      case 'rejected': return 'Rejected by owner';
      case 'auto-approved': return 'Auto-approved within limits';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {pendingChanges.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Approval</div>
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
              {pendingChanges.filter(c => c.status === 'approved' || c.status === 'auto-approved').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {pendingChanges.filter(c => c.status === 'rejected').length}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* My Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Price Change Requests
          </CardTitle>
          <CardDescription>
            Track your pricing change requests and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingChanges.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Requests</p>
              <p>You haven't submitted any pricing changes yet.</p>
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
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1 capitalize">
                            {change.serviceType.replace('-', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getStatusDescription(change.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Submitted {formatTimeAgo(change.requestedAt)} • Effective {new Date(change.effectiveDate).toLocaleDateString()}
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

                    {/* Status-specific messaging */}
                    {change.status === 'pending' && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Your request is awaiting owner approval. You'll be notified once it's reviewed.
                        </AlertDescription>
                      </Alert>
                    )}

                    {change.status === 'rejected' && change.rejectionReason && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">Rejected:</div>
                          <div className="mt-1">{change.rejectionReason}</div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {change.status === 'auto-approved' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          This change was automatically approved as it falls within your delegation limits.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedChange(change)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Status
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Status Details</DialogTitle>
                            <DialogDescription>
                              Complete information for {change.itemName}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedChange && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-medium">Request ID:</div>
                                  <div className="text-muted-foreground">{selectedChange.id}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Service Type:</div>
                                  <div className="text-muted-foreground capitalize">{selectedChange.serviceType.replace('-', ' ')}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Current Status:</div>
                                  <div className="text-muted-foreground">
                                    <Badge variant={getStatusColor(selectedChange.status)}>
                                      {selectedChange.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">Submitted Date:</div>
                                  <div className="text-muted-foreground">{new Date(selectedChange.requestedAt).toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Effective Date:</div>
                                  <div className="text-muted-foreground">{new Date(selectedChange.effectiveDate).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Priority Level:</div>
                                  <div className="text-muted-foreground">
                                    <Badge variant="outline" className={getPriorityColor(getPriorityLevel(selectedChange))}>
                                      {getPriorityLevel(selectedChange)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {selectedChange.roomType && selectedChange.roomType.length > 0 && (
                                <div>
                                  <div className="font-medium text-sm">Room Type Restrictions:</div>
                                  <div className="flex gap-2 mt-1">
                                    {selectedChange.roomType.map(type => (
                                      <Badge key={type} variant="outline">{type}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedChange.rejectionReason && (
                                <div>
                                  <div className="font-medium text-sm">Rejection Reason:</div>
                                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mt-1">
                                    {selectedChange.rejectionReason}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <div className="text-sm text-muted-foreground">
                        {change.status === 'pending' && 'Waiting for owner approval...'}
                        {change.status === 'approved' && `Approved ${change.approvedAt ? formatTimeAgo(change.approvedAt) : ''}`}
                        {change.status === 'rejected' && 'Request denied'}
                        {change.status === 'auto-approved' && 'Applied automatically'}
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