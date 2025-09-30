import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Building, Smartphone, Clock, UserX, DollarSign, Info, Loader2 } from 'lucide-react';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

// Phase 1: Enhanced props interface with security context
interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAmount?: number;
  onPaymentSuccess?: (amount: number, method: string) => void;
  // Scoped payment context
  folioId?: string;
  guestName?: string;
  roomNumber?: string;
  triggerSource?: 'checkout' | 'frontdesk' | 'accounting';
}

export const PaymentDialog = ({ 
  open, 
  onOpenChange, 
  pendingAmount, 
  onPaymentSuccess,
  folioId,
  guestName,
  roomNumber,
  triggerSource = 'frontdesk'
}: PaymentDialogProps) => {
  const { folioBalances, createPayment, getFolioBalance } = useBilling();
  const { enabledMethods, getMethodById, calculateFees } = usePaymentMethodsContext();
  const { tenant } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [scopedFolio, setScopedFolio] = useState<any>(null);
  const [loadingScoped, setLoadingScoped] = useState(false);

  // Phase 2 & 4: Load scoped folio if folioId provided
  useEffect(() => {
    const loadScopedFolio = async () => {
      if (folioId && tenant?.tenant_id && open) {
        setLoadingScoped(true);
        try {
          const folio = await getFolioBalance(folioId, tenant.tenant_id);
          if (folio) {
            setScopedFolio(folio);
            setSelectedPayment(folio);
            setAmount(folio.balance.toString());
          } else {
            toast.error('Folio not found');
            onOpenChange(false);
          }
        } catch (error) {
          console.error('Error loading scoped folio:', error);
          toast.error('Failed to load folio details');
          onOpenChange(false);
        } finally {
          setLoadingScoped(false);
        }
      }
    };

    loadScopedFolio();
  }, [folioId, tenant?.tenant_id, open, getFolioBalance]);

  // Phase 4: Determine which folios to show (scoped or all)
  const pendingPayments = folioId 
    ? (scopedFolio ? [scopedFolio] : [])
    : folioBalances.filter(folio => folio.balance > 0);

  const handleSelectPayment = (payment: any) => {
    setSelectedPayment(payment);
    setAmount(payment.balance.toString());
  };

  // Map payment method names to database values
  const mapPaymentMethod = (methodName: string): string => {
    const normalized = methodName.toLowerCase();
    if (normalized.includes('cash')) return 'cash';
    if (normalized.includes('card') || normalized.includes('credit card')) return 'card';
    if (normalized.includes('transfer') || normalized.includes('bank')) return 'transfer';
    if (normalized.includes('credit')) return 'credit';
    if (normalized.includes('complimentary')) return 'complimentary';
    return 'cash'; // Default fallback
  };

  const handleProcessPayment = async () => {
    if (!paymentMethodId || !amount || !selectedPayment) {
      toast.error("Please select a payment method and enter an amount");
      return;
    }

    const paymentAmount = parseFloat(amount);
    const method = getMethodById(paymentMethodId);
    
    if (!method) {
      toast.error("Invalid payment method");
      return;
    }

    if (!method.enabled) {
      toast.error(`${method.name} is currently disabled`);
      return;
    }

    const fees = calculateFees(paymentAmount, paymentMethodId);
    const dbPaymentMethod = mapPaymentMethod(method.name);

    try {
      await createPayment({
        folio_id: selectedPayment.folio_id,
        amount: paymentAmount,
        payment_method: dbPaymentMethod,
        payment_method_id: paymentMethodId
      });

      toast.success(`Payment of ₦${paymentAmount.toLocaleString()} recorded via ${method.name}`);
      
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentAmount, method.name);
      }
      
      onOpenChange(false);
      setSelectedPayment(null);
      setPaymentMethodId("");
      setAmount("");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {/* Phase 5: Dynamic modal title based on context */}
            {folioId && roomNumber && guestName 
              ? `Collect Payment for Room ${roomNumber} (${guestName})`
              : 'Pending Guest Payments'
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Pending Payments List */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {folioId ? 'Folio Details' : 'Pending Payments'}
            </h3>
            
            {/* Phase 2: Loading state for scoped folio */}
            {loadingScoped ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-sm">Fetching folio balance...</span>
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No outstanding bills for this guest.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pendingPayments.map((payment) => (
                  <Card 
                    key={payment.folio_id}
                    className={`cursor-pointer transition-colors ${
                      selectedPayment?.folio_id === payment.folio_id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectPayment(payment)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">Room {payment.room_number}</div>
                          <div className="text-sm text-muted-foreground">{payment.guest_name}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {payment.folio_number}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₦{payment.balance.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            Outstanding
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Payment Processing */}
          <div className="space-y-4">
            <h3 className="font-medium">Process Payment</h3>
            
            {selectedPayment ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium">Selected Payment</div>
                    <div className="mt-2">
                      <div>Room {selectedPayment.room_number} • {selectedPayment.guest_name}</div>
                      <div className="text-lg font-bold text-primary">
                        ₦{selectedPayment.balance.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="method">Payment Method</Label>
                    <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                         {enabledMethods.map((method) => {
                           const IconComponent = () => {
                             switch (method.icon) {
                               case 'Banknote': return <Banknote className="h-4 w-4" />;
                               case 'CreditCard': return <CreditCard className="h-4 w-4" />;
                               case 'Building': return <Building className="h-4 w-4" />;
                               case 'Smartphone': return <Smartphone className="h-4 w-4" />;
                               case 'Clock': return <Clock className="h-4 w-4" />;
                               case 'UserX': return <UserX className="h-4 w-4" />;
                               default: return <CreditCard className="h-4 w-4" />;
                             }
                           };
                           
                           return (
                             <SelectItem key={method.id} value={method.id}>
                               <div className="flex items-center gap-2">
                                 <IconComponent />
                                 {method.name}
                                 {method.fees && method.fees.percentage > 0 && (
                                   <span className="text-xs text-muted-foreground ml-2">
                                     (+{method.fees.percentage}%)
                                   </span>
                                 )}
                               </div>
                             </SelectItem>
                           );
                         })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleProcessPayment}
                    disabled={!paymentMethodId || !amount}
                    className="flex-1"
                  >
                    Process Payment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a payment from the list to process
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
