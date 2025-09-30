import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Banknote,
  Building,
  Receipt,
  Eye,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { usePOSApi, type Order } from '@/hooks/usePOS';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';

export default function PaymentPage() {
  const { orders, isLoading, processPayment } = usePOSApi();
  const { enabledMethods, loading: methodsLoading } = usePaymentMethodsContext();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Show empty state if no payment methods configured
  if (methodsLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            Loading payment methods...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enabledMethods.length === 0) {
    return (
      <div className="p-6">
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Payment Methods Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure payment methods before processing POS payments.
              </p>
              <Button onClick={() => window.location.href = '/financials'}>
                Configure Payment Methods
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter orders that need payment processing
  const unpaidOrders = orders.filter(order => 
    order.payment_status === 'unpaid' && 
    ['delivered', 'ready', 'out_for_delivery'].includes(order.status)
  );

  const chargedOrders = orders.filter(order => order.payment_status === 'charged');
  const paidOrders = orders.filter(order => order.payment_status === 'paid');

  const handlePayment = async () => {
    if (selectedOrder && paymentAmount > 0) {
      await processPayment(selectedOrder.id, paymentMethod, paymentAmount);
      setShowPaymentDialog(false);
      setSelectedOrder(null);
      setPaymentAmount(0);
      setCashReceived(0);
    }
  };

  const initiatePayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentAmount(order.total_amount);
    // Set first available method or credit/card type as default
    const creditMethod = enabledMethods.find(m => m.type === 'credit');
    setPaymentMethod(creditMethod?.id || enabledMethods[0]?.id || '');
    setShowPaymentDialog(true);
  };

  const getPaymentMethodIcon = (methodId: string) => {
    const method = enabledMethods.find(m => m.id === methodId);
    if (!method) return <DollarSign className="h-4 w-4" />;
    
    switch (method.icon) {
      case 'Building': return <Building className="h-4 w-4" />;
      case 'CreditCard': return <CreditCard className="h-4 w-4" />;
      case 'Banknote': return <Banknote className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const calculateChange = () => {
    const method = enabledMethods.find(m => m.id === paymentMethod);
    if (method?.type === 'cash' && cashReceived > paymentAmount) {
      return cashReceived - paymentAmount;
    }
    return 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Payment & Billing</h1>
          <p className="text-muted-foreground mt-1">
            Process payments and manage billing for restaurant orders
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                <p className="text-2xl font-bold text-red-600">{unpaidOrders.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Room Charges</p>
                <p className="text-2xl font-bold text-blue-600">{chargedOrders.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Orders</p>
                <p className="text-2xl font-bold text-green-600">{paidOrders.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{(paidOrders.reduce((sum, order) => sum + order.total_amount, 0) / 100).toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Pending Payments ({unpaidOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {unpaidOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{order.order_number}</span>
                        <Badge variant="destructive">Unpaid</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.room_id ? `Room ${order.room_id}` : order.guest_name}
                      </p>
                      <p className="font-semibold">₦{(order.total_amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm"
                        onClick={() => initiatePayment(order)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
                {unpaidOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>All orders have been paid!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {[...chargedOrders, ...paidOrders]
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 10)
                  .map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{order.order_number}</span>
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {order.payment_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.room_id ? `Room ${order.room_id}` : order.guest_name}
                      </p>
                      <p className="font-semibold">₦{(order.total_amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Order:</span>
                      <span className="font-medium">{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{selectedOrder.room_id ? `Room ${selectedOrder.room_id}` : selectedOrder.guest_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>{selectedOrder.items.length}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₦{(selectedOrder.total_amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(method.id)}
                          {method.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Amount */}
              <div>
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={(paymentAmount / 100).toFixed(2)}
                  onChange={(e) => setPaymentAmount(Math.round(Number(e.target.value) * 100))}
                />
              </div>

              {/* Cash Payment Details */}
              {enabledMethods.find(m => m.id === paymentMethod)?.type === 'cash' && (
                <div>
                  <Label htmlFor="cashReceived">Cash Received (₦)</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    step="0.01"
                    value={(cashReceived / 100).toFixed(2)}
                    onChange={(e) => setCashReceived(Math.round(Number(e.target.value) * 100))}
                  />
                  {calculateChange() > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Change: ₦{(calculateChange() / 100).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  disabled={isLoading || paymentAmount <= 0 || (enabledMethods.find(m => m.id === paymentMethod)?.type === 'cash' && cashReceived < paymentAmount)}
                >
                  {getPaymentMethodIcon(paymentMethod)}
                  <span className="ml-2">Process Payment</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}