// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Wallet, 
  Banknote,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface PendingPayment {
  id: string;
  tenant_id: string;
  folio_id: string;
  amount: number;
  payment_method_id: string;
  reference_number?: string | null;
  notes?: string | null;
  status: string;
  payment_status: string;
  is_verified: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  processed_by?: string | null;
  folios?: {
    folio_number: string;
    reservations?: {
      guest_name: string;
      rooms?: {
        room_number: string;
      };
    };
  };
  payment_methods?: {
    name: string;
    type: string;
    icon: string;
  };
}

export function PendingPaymentVerification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');

  // Fetch pending payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pending-payments', user?.tenant_id, statusFilter],
    queryFn: async () => {
      if (!user?.tenant_id) return [];

      let query = supabase
        .from('payments')
        .select(`
          *,
          folios:folio_id (
            folio_number,
            reservations:reservation_id (
              guest_name,
              rooms:room_id (
                room_number
              )
            )
          ),
          payment_methods:payment_method_id (
            name,
            type,
            icon
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('is_verified', false).eq('status', 'pending');
      } else if (statusFilter === 'verified') {
        query = query.eq('is_verified', true);
      } else if (statusFilter === 'rejected') {
        query = query.eq('status', 'rejected');
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as PendingPayment[];
    },
    enabled: !!user?.tenant_id,
  });

  // Verify payment
  const verifyPayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .update({
          is_verified: true,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          status: 'completed',
          payment_status: 'completed',
        })
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast.success('Payment verified successfully');
      setSelectedPayment(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to verify payment: ${error.message}`);
    },
  });

  // Reject payment
  const rejectPayment = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          payment_status: 'failed',
          is_verified: false,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast.success('Payment rejected');
      setSelectedPayment(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject payment: ${error.message}`);
    },
  });

  const getPaymentIcon = (type?: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'wallet':
        return <Wallet className="h-4 w-4 text-purple-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleReject = () => {
    if (!selectedPayment || !rejectionReason.trim()) return;
    rejectPayment.mutate({
      paymentId: selectedPayment.id,
      reason: rejectionReason,
    });
  };

  const stats = {
    pending: payments.filter((p) => p.status === 'pending' && !p.is_verified).length,
    verified: payments.filter((p) => p.is_verified).length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Verification</h1>
        <p className="text-muted-foreground">Review and verify guest payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No payments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getPaymentIcon(payment.payment_methods?.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">₦{payment.amount.toFixed(2)}</h3>
                            <Badge variant={payment.is_verified ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Room {payment.folios?.reservations?.rooms?.room_number} •{' '}
                              {payment.folios?.reservations?.guest_name}
                            </p>
                            <p>
                              {payment.payment_methods?.name} •{' '}
                              {new Date(payment.created_at).toLocaleString()}
                            </p>
                            {payment.reference_number && (
                              <p className="font-mono text-xs">Ref: {payment.reference_number}</p>
                            )}
                            {payment.rejection_reason && (
                              <p className="text-red-600 text-xs">Reason: {payment.rejection_reason}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {!payment.is_verified && payment.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => verifyPayment.mutate(payment.id)}
                              disabled={verifyPayment.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRejectDialog(true);
                              }}
                              disabled={rejectPayment.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please provide a reason for rejecting this payment. The guest will be notified.
            </AlertDescription>
          </Alert>

          <div className="py-4">
            <Label>Rejection Reason *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Invalid reference number, amount mismatch, etc."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectPayment.isPending}
            >
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
