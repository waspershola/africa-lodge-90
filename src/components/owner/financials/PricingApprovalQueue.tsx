import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  Settings
} from 'lucide-react';
import { PricingChange, DelegationRule } from '@/types/pricing';

interface PricingApprovalQueueProps {
  pendingChanges: PricingChange[];
  delegationRules: DelegationRule[];
  onApprove: (changeId: string) => void;
  onReject: (changeId: string, reason: string) => void;
  onUpdateDelegationRules: (rules: DelegationRule[]) => void;
}

export default function PricingApprovalQueue({ 
  pendingChanges, 
  delegationRules,
  onApprove, 
  onReject,
  onUpdateDelegationRules
}: PricingApprovalQueueProps) {
  const [selectedChange, setSelectedChange] = useState<PricingChange | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'auto-approved': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (change: PricingChange) => {
    const percentage = Math.abs(change.changePercentage);
    if (percentage > 25) return 'text-red-600';
    if (percentage > 15) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getPriorityLevel = (change: PricingChange) => {
    const percentage = Math.abs(change.changePercentage);
    if (percentage > 25) return 'high';
    if (percentage > 15) return 'medium';
    return 'low';
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const handleApprove = (changeId: string) => {
    onApprove(changeId);
    toast({
      title: "Price Change Approved",
      description: "The pricing change has been approved and will take effect immediately.",
    });
  };

  const handleReject = (changeId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this change.",
        variant: "destructive",
      });
      return;
    }
    
    onReject(changeId, rejectionReason);
    setRejectionReason('');
    setIsRejecting(false);
    toast({
      title: "Price Change Rejected",
      description: "The manager has been notified of the rejection.",
    });
  };

  const pendingCount = pendingChanges.filter(c => c.status === 'pending').length;
  const highPriorityCount = pendingChanges.filter(c => 
    c.status === 'pending' && getPriorityLevel(c) === 'high'
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending Approvals</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{highPriorityCount}</div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {pendingChanges.filter(c => c.changeAmount > 0).length}
            </div>
            <div className="text-sm text-muted-foreground">Price Increases</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {pendingChanges.length > 0 ? formatTimeAgo(
                pendingChanges.sort((a, b) => 
                  new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
                )[0]?.requestedAt || ''
              ) : 'None'}
            </div>
            <div className="text-sm text-muted-foreground">Oldest Request</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals ({pendingCount})</TabsTrigger>
          <TabsTrigger value="delegation">Delegation Rules</TabsTrigger>
          <TabsTrigger value="history">Approval History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Price Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingChanges.filter(c => c.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No pending price changes require your approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingChanges
                    .filter(c => c.status === 'pending')
                    .sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime())
                    .map((change) => (
                    <div key={change.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{change.itemName}</h4>
                            <Badge variant={getStatusColor(change.status)}>
                              {change.status}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(change)}>
                              {getPriorityLevel(change)} priority
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {change.serviceType}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Requested by {change.requestedBy}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{formatTimeAgo(change.requestedAt)}</div>
                          <div>Effective {new Date(change.effectiveDate).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Current Price</div>
                          <div className="font-medium">₦{change.currentPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Proposed Price</div>
                          <div className="font-medium">₦{change.proposedPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Change Impact</div>
                          <div className={`font-medium flex items-center gap-1 ${
                            change.changeAmount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {change.changeAmount > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {change.changeAmount > 0 ? '+' : ''}₦{change.changeAmount.toLocaleString()}
                            <span className="text-xs">
                              ({change.changeAmount > 0 ? '+' : ''}{change.changePercentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {change.reason && (
                        <div className="bg-muted p-3 rounded-md">
                          <div className="text-sm text-muted-foreground mb-1">Justification:</div>
                          <div className="text-sm">{change.reason}</div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedChange(change)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Price Change Details</DialogTitle>
                            </DialogHeader>
                            {selectedChange && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Service Type</Label>
                                    <div className="text-sm">{selectedChange.serviceType}</div>
                                  </div>
                                  <div>
                                    <Label>Item Name</Label>
                                    <div className="text-sm">{selectedChange.itemName}</div>
                                  </div>
                                  <div>
                                    <Label>Requested By</Label>
                                    <div className="text-sm">{selectedChange.requestedBy}</div>
                                  </div>
                                  <div>
                                    <Label>Request Date</Label>
                                    <div className="text-sm">{new Date(selectedChange.requestedAt).toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <Label>Current Price</Label>
                                    <div className="text-sm">₦{selectedChange.currentPrice.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <Label>Proposed Price</Label>
                                    <div className="text-sm">₦{selectedChange.proposedPrice.toLocaleString()}</div>
                                  </div>
                                </div>
                                <div>
                                  <Label>Justification</Label>
                                  <div className="text-sm bg-muted p-3 rounded-md">{selectedChange.reason}</div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Price Change</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                                <Textarea
                                  id="rejection-reason"
                                  placeholder="Please provide a reason for rejecting this price change..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsRejecting(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleReject(change.id)}>
                                  Reject Change
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button size="sm" onClick={() => handleApprove(change.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delegation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manager Delegation Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Delegation Rules</h3>
                <p className="text-muted-foreground mb-4">
                  Configure automatic approval limits for managers by service type and amount.
                </p>
                <Button>
                  Configure Delegation Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingChanges
                  .filter(c => c.status !== 'pending')
                  .slice(0, 10)
                  .map((change) => (
                  <div key={change.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{change.itemName}</div>
                      <div className="text-sm text-muted-foreground">
                        {change.serviceType} • {change.requestedBy}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(change.status)}>
                        {change.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {change.approvedAt ? formatTimeAgo(change.approvedAt) : formatTimeAgo(change.requestedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}