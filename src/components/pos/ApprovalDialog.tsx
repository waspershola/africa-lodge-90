import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X, 
  User,
  DollarSign,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ApprovalRequest {
  id: string;
  type: 'price_change' | 'void_order' | 'menu_availability' | 'refund';
  requestor_id: string;
  requestor_name: string;
  entity_id: string;
  entity_name: string;
  current_value: any;
  requested_value: any;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  urgency: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApprovalRequest;
  onApprove: (requestId: string, approverNotes?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  canApprove: boolean;
}

export default function ApprovalDialog({ 
  isOpen, 
  onClose, 
  request, 
  onApprove, 
  onReject, 
  canApprove 
}: ApprovalDialogProps) {
  const { toast } = useToast();
  const [approverNotes, setApproverNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_change': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'void_order': return <X className="h-5 w-5 text-red-500" />;
      case 'menu_availability': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'refund': return <DollarSign className="h-5 w-5 text-orange-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'orange';
      default: return 'secondary';
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request.id, approverNotes);
      toast({
        title: "Request Approved",
        description: "The approval request has been processed successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Unable to process approval request.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this request.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(request.id, rejectionReason);
      toast({
        title: "Request Rejected",
        description: "The request has been rejected and the requestor has been notified.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: "Unable to process rejection.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatValue = (value: any, type: string) => {
    if (type === 'price_change' && typeof value === 'number') {
      return `₦${(value / 100).toFixed(2)}`;
    }
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(request.type)}
            Approval Request - {request.type.replace('_', ' ').toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Request Details
                <Badge variant={getUrgencyColor(request.urgency) as any}>
                  {request.urgency} priority
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Requestor</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{request.requestor_name}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Request Time</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(request.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Item/Entity</Label>
                <p className="mt-1 font-medium">{request.entity_name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Change Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requested Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Label className="text-sm font-medium text-red-700">Current Value</Label>
                  <p className="mt-1 font-mono text-red-900">
                    {formatValue(request.current_value, request.type)}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Label className="text-sm font-medium text-green-700">Requested Value</Label>
                  <p className="mt-1 font-mono text-green-900">
                    {formatValue(request.requested_value, request.type)}
                  </p>
                </div>
              </div>

              {/* Price change specific info */}
              {request.type === 'price_change' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price Change</span>
                    <span className={`font-bold ${
                      request.requested_value > request.current_value ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {request.requested_value > request.current_value ? '+' : ''}
                      ₦{((request.requested_value - request.current_value) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Actions */}
          {canApprove && request.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manager Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="approver-notes">Approval Notes (Optional)</Label>
                  <Textarea
                    id="approver-notes"
                    placeholder="Add any notes or conditions for this approval..."
                    value={approverNotes}
                    onChange={(e) => setApproverNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Provide a clear reason for rejecting this request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleReject()}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Request
                  </Button>
                  <Button 
                    onClick={() => handleApprove()}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Display for non-pending requests */}
          {request.status !== 'pending' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {request.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium capitalize">
                    Request {request.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}