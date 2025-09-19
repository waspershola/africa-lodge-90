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
  CheckCircle
} from 'lucide-react';
import { usePOSApi, type Order } from '@/hooks/usePOSApi';
import { useToast } from '@/hooks/use-toast';

interface PaymentDrawerProps {
  order: Order;
  trigger: React.ReactNode;
}

export default function PaymentDrawer({ order, trigger }: PaymentDrawerProps) {
  const { processPayment } = usePOSApi();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'room_folio' | 'card' | 'cash'>('room_folio');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - order.total_amount);
  };

  const handlePayment = async () => {
    if (paymentMethod === 'cash') {
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
      await processPayment(order.id, paymentMethod, order.total_amount);
      toast({
        title: "Payment Processed",
        description: `Payment of $${(order.total_amount / 100).toFixed(2)} processed successfully.`,
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'room_folio': return <Hotel className="h-5 w-5" />;
      case 'card': return <CreditCard className="h-5 w-5" />;
      case 'cash': return <Banknote className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

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
                <span>Total Amount:</span>
                <span>${(order.total_amount / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as any)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="room_folio" id="room_folio" />
                  <Label htmlFor="room_folio" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Hotel className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Charge to Room</div>
                      <div className="text-sm text-muted-foreground">
                        {order.room_id ? `Room ${order.room_id}` : 'Add to guest folio'}
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-muted-foreground">Process card payment</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-medium">Cash Payment</div>
                      <div className="text-sm text-muted-foreground">Cash transaction</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Cash Amount Input */}
              {paymentMethod === 'cash' && (
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
                        <span className="font-medium">${(order.total_amount / 100).toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-bold">
                        <span>Change Due:</span>
                        <span className={calculateChange() > 0 ? 'text-green-600' : 'text-red-600'}>
                          ${calculateChange().toFixed(2)}
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
              disabled={isProcessing || (paymentMethod === 'cash' && parseFloat(cashReceived) < order.total_amount)}
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