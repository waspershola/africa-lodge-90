import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useBilling } from '@/hooks/useBilling';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';

export default function PaymentsOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('today');
  
  const { billingStats, payments, loading, error } = useBilling();
  const { enabledMethods, loading: methodsLoading } = usePaymentMethodsContext();

  if (loading || methodsLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  
  // Fallback if no payment methods configured
  if (!methodsLoading && enabledMethods.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">No Payment Methods Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure payment methods to start accepting payments from guests.
            </p>
            <Button onClick={() => window.location.href = '/financials'}>
              Configure Payment Methods
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate payment summary from real data
  const paymentSummary = {
    totalToday: billingStats?.totalRevenue || 0,
    totalCount: payments.length,
    byMethod: billingStats?.todaysCashflow || {}
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      (searchTerm.toLowerCase());
    
    const matchesMethod = filterMethod === 'all' || payment.payment_method === filterMethod;
    
    return matchesSearch && matchesMethod;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800 border-green-200';
      case 'card': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transfer': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pos': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'wallet': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(paymentSummary.byMethod).map(([method, amount]) => (
          <Card key={method} className="luxury-card">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold">₦{(Number(amount) / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground capitalize">{method}</div>
                <Badge className={`mt-2 ${getMethodColor(method)}`}>
                  {payments.filter(p => p.payment_method === method).length} payments
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments by guest, room, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {enabledMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Today's Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success">₦{(paymentSummary.totalToday / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-muted-foreground">Total Collected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{paymentSummary.totalCount}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">₦{paymentSummary.totalCount > 0 ? Math.round(paymentSummary.totalToday / paymentSummary.totalCount / 1000) : 0}K</div>
              <div className="text-sm text-muted-foreground">Average Transaction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold">Payment #{payment.id.slice(-8)}</div>
                    <div className="text-sm text-muted-foreground">
                      {payment.reference || 'No reference'} • {payment.folio_id.slice(-8)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">₦{payment.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(payment.created_at), 'MMM d, HH:mm')}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Badge className={getMethodColor(payment.payment_method)}>
                      {payment.payment_method.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>

                  <Button variant="outline" size="sm">
                    View Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payments found for the selected criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}