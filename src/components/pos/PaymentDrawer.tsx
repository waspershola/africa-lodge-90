import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  CreditCard, 
  Banknote, 
  Hotel, 
  Receipt, 
  DollarSign,
  Calculator,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import RoleGuard from './RoleGuard';
import { usePOSApi, type Order } from '@/hooks/usePOS';
import { useToast } from '@/hooks/use-toast';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { usePaymentValidation } from '@/hooks/usePaymentValidation';

interface PaymentDrawerProps {
  order: Order;
  trigger: React.ReactNode;
}

export default function PaymentDrawer({ order, trigger }: PaymentDrawerProps) {
  const { processPayment } = usePOSApi();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const { enabledMethods, getMethodById, calculateFees } = usePaymentMethodsContext();
  const { validatePaymentMethod, getPaymentTotal } = usePaymentValidation();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - order.total_amount);
  };

  const handlePayment = async () => {
    if (!paymentMethodId) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePaymentMethod(paymentMethodId)) {
      return;
    }

    const method = getMethodById(paymentMethodId);
    if (!method) return;

    // Check if cash payment has sufficient amount
    if (method.type === 'cash') {
      const received = parseFloat(cashReceived) || 0;
      if (received < order.total_amount) {
        toast({
          title: "Insufficient Payment",
          description: "Cash received is less than the order total.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const paymentTotal = getPaymentTotal(order.total_amount, paymentMethodId);
      
      // PHASE 2: POS payments are processed immediately
      await processPayment(order.id, paymentMethodId, paymentTotal.total);
      
      toast({
        title: "Payment Processed",
        description: `Payment of ₦${paymentTotal.total.toLocaleString()} processed successfully${paymentTotal.fees > 0 ? ` (includes ₦${paymentTotal.fees.toLocaleString()} fee)` : ''}.`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'Hotel': return <Hotel className="h-5 w-5" />;
      case 'CreditCard': return <CreditCard className="h-5 w-5" />;
      case 'Banknote': return <Banknote className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const selectedMethod = getMethodById(paymentMethodId);
  const paymentTotal = paymentMethodId ? getPaymentTotal(order.total_amount, paymentMethodId) : null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Process Payment - Order #{order.order_number}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Order Number:</span>
                <Badge variant="outline">{order.order_number}</Badge>
              </div>
              
              {order.room_id && (
                <div className="flex justify-between items-center">
                  <span>Room:</span>
                  <Badge variant="secondary">Room {order.room_id}</Badge>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Source:</span>
                <Badge variant="outline" className="capitalize">{order.source}</Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.qty}x {item.menu_item.name}</span>
                      {item.modifiers.length > 0 && (
                        <div className="text-muted-foreground">
                          {item.modifiers.map(mod => mod.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">
                      ${((item.qty * item.menu_item.base_price + 
                          item.modifiers.reduce((sum, mod) => sum + mod.price_delta, 0)) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Subtotal:</span>
                <span>₦{order.total_amount.toLocaleString()}</span>
              </div>

              {paymentTotal && paymentTotal.fees > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Payment Fee:</span>
                    <span>₦{paymentTotal.fees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>₦{paymentTotal.total.toLocaleString()}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethodId} 
                onValueChange={setPaymentMethodId}
                className="space-y-3"
              >
                {enabledMethods.map(method => (
                  <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer flex-1">
                      {getPaymentMethodIcon(method.icon)}
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {method.type === 'cash' && 'Cash transaction'}
                          {method.type === 'pos' && 'POS terminal payment'}
                          {method.type === 'digital' && 'Digital payment'}
                          {method.type === 'transfer' && 'Bank transfer'}
                          {method.type === 'credit' && 'Charge to folio'}
                        </div>
                      </div>
                      {method.fees && (method.fees.percentage > 0 || method.fees.fixed > 0) && (
                        <Badge variant="outline" className="text-xs">
                          {method.fees.percentage > 0 && `${method.fees.percentage}%`}
                          {method.fees.percentage > 0 && method.fees.fixed > 0 && ' + '}
                          {method.fees.fixed > 0 && `₦${method.fees.fixed}`}
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <RoleGuard requiredRole={['MANAGER', 'OWNER']}>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Payment Methods
                  </Button>
                </div>
              </RoleGuard>

              {/* Cash Amount Input */}
              {selectedMethod?.type === 'cash' && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cash-amount">Cash Received</Label>
                    <Input
                      id="cash-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>
                  
                  {cashReceived && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Cash Received:</span>
                        <span className="font-medium">${parseFloat(cashReceived).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Order Total:</span>
                        <span className="font-medium">₦{(paymentTotal?.total || order.total_amount).toLocaleString()}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-bold">
                        <span>Change Due:</span>
                        <span className={calculateChange() > 0 ? 'text-green-600' : 'text-red-600'}>
                          ₦{calculateChange().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handlePayment}
              disabled={
                isProcessing || 
                !paymentMethodId || 
                (selectedMethod?.type === 'cash' && parseFloat(cashReceived) < (paymentTotal?.total || order.total_amount))
              }
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}