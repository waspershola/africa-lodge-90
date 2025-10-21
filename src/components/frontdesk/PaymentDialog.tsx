import React, { useState, useEffect, useCallback } from 'react';
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
import { validatePaymentMethod } from '@/lib/payment-validation';
import { TaxBreakdownDisplay } from './TaxBreakdownDisplay';
import { TaxBreakdownItem } from '@/lib/tax-calculator';
import { supabase } from '@/integrations/supabase/client';
import { mapPaymentMethodWithLogging } from '@/lib/payment-method-mapper';
import { useActiveDepartments, useDefaultDepartment } from '@/hooks/data/useDepartments';
import { useActiveTerminals, useDefaultTerminal } from '@/hooks/data/useTerminals';
import { useGuestWallet } from '@/hooks/useGuestWallet';
import { Wallet } from 'lucide-react';

// Phase 1: Enhanced props interface with security context
interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAmount?: number;
  onPaymentSuccess?: (amount: number, method: string) => void;
  // Scoped payment context with full security validation
  folioId?: string;
  guestId?: string;
  guestName?: string;
  roomNumber?: string;
  tenantId?: string;
  triggerSource?: 'checkout' | 'frontdesk' | 'accounting';
}

export const PaymentDialog = ({ 
  open, 
  onOpenChange, 
  pendingAmount, 
  onPaymentSuccess,
  folioId,
  guestId,
  guestName,
  roomNumber,
  tenantId,
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdownItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Phase 3: Department and Terminal tracking
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('');
  const { departments, options: departmentOptions } = useActiveDepartments();
  const { data: defaultDepartmentId } = useDefaultDepartment();
  const { terminals, options: terminalOptions } = useActiveTerminals(selectedDepartmentId);
  const { data: defaultTerminalId } = useDefaultTerminal(selectedDepartmentId);
  
  // Wallet support
  const { wallet, walletLoading, payFromWallet } = useGuestWallet(guestId);

  // Memoized function to load scoped folio - prevents dependency issues
  const loadScopedFolio = useCallback(async () => {
    if (!folioId || !tenant?.tenant_id || !open || isFetching) {
      return;
    }

    setIsFetching(true);
    setLoadingScoped(true);
    setValidationError(null);
    
    try {
      // Phase 4: Runtime validation for tenant match
      if (tenantId && tenantId !== tenant.tenant_id) {
        setValidationError('Invalid folio reference - tenant mismatch');
        toast.error('Security Error: Invalid folio access attempt');
        onOpenChange(false);
        return;
      }

      const folio = await getFolioBalance(folioId, tenant.tenant_id);
      
      if (folio) {
        setScopedFolio(folio);
        setSelectedPayment(folio);
        setAmount(folio.balance.toString());
        
        // Fetch tax breakdown from folio charges
        const { data: charges } = await supabase
          .from('folio_charges')
          .select('base_amount, vat_amount, service_charge_amount, amount')
          .eq('folio_id', folioId);
        
        if (charges && charges.length > 0) {
          const totalBase = charges.reduce((sum, c) => sum + (c.base_amount || c.amount), 0);
          const totalVat = charges.reduce((sum, c) => sum + (c.vat_amount || 0), 0);
          const totalService = charges.reduce((sum, c) => sum + (c.service_charge_amount || 0), 0);
          
          const breakdown: TaxBreakdownItem[] = [
            { type: 'base', label: 'Subtotal', amount: totalBase }
          ];
          
          if (totalVat > 0) {
            breakdown.push({ type: 'vat', label: 'VAT', amount: totalVat });
          }
          
          if (totalService > 0) {
            breakdown.push({ type: 'service', label: 'Service Charge', amount: totalService });
          }
          
          setTaxBreakdown(breakdown);
        }
      } else {
        setValidationError('Folio not found');
        toast.error('Folio not found or access denied');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error loading scoped folio:', error);
      const errorMessage = error.message || 'Failed to load folio details';
      setValidationError(errorMessage);
      toast.error(errorMessage);
      onOpenChange(false);
    } finally {
      setLoadingScoped(false);
      setIsFetching(false);
    }
  }, [folioId, tenant?.tenant_id, tenantId, open, isFetching, getFolioBalance, onOpenChange]);

  // Phase 2 & 4: Load scoped folio with enhanced security validation
  useEffect(() => {
    loadScopedFolio();
  }, [open, folioId]);
  
  // Phase 3: Auto-select default department and terminal
  useEffect(() => {
    if (open && !selectedDepartmentId && defaultDepartmentId) {
      setSelectedDepartmentId(defaultDepartmentId);
    }
  }, [open, defaultDepartmentId, selectedDepartmentId]);
  
  useEffect(() => {
    if (selectedDepartmentId && !selectedTerminalId && defaultTerminalId) {
      setSelectedTerminalId(defaultTerminalId);
    }
  }, [selectedDepartmentId, defaultTerminalId, selectedTerminalId]);

  // Phase 4: Determine which folios to show (scoped or all)
  const pendingPayments = folioId 
    ? (scopedFolio ? [scopedFolio] : [])
    : folioBalances.filter(folio => folio.balance > 0);

  const handleSelectPayment = (payment: any) => {
    setSelectedPayment(payment);
    setAmount(payment.balance.toString());
  };

  // Phase 1: Dynamic payment method mapping using centralized utility
  const mapPaymentMethod = (method: any): string => {
    console.log('[Payment Mapping] Input:', { methodId: method.id, methodName: method.name, methodType: method.type });
    
    // Try to map from type first, fallback to name
    const inputToMap = method.type || method.name;
    const mappedMethod = mapPaymentMethodWithLogging(inputToMap, 'PaymentDialog');
    
    console.log('[Payment Mapping] Output:', { mappedMethod });
    return mappedMethod;
  };

  const handleProcessPayment = async () => {
    if (isProcessing) return; // Prevent double-clicks
    
    // Set processing state immediately to prevent race conditions
    setIsProcessing(true);
    
    console.log('[Payment Process] Starting payment:', { 
      paymentMethodId, 
      amount, 
      selectedPayment: selectedPayment?.folio_id,
      folioId 
    });

    if (!paymentMethodId || !amount || !selectedPayment) {
      toast.error("Please select a payment method and enter an amount");
      setIsProcessing(false);
      return;
    }

    const paymentAmount = parseFloat(amount);
    const method = getMethodById(paymentMethodId);
    
    if (!method) {
      console.error('[Payment Process] Method not found:', paymentMethodId);
      toast.error("Invalid payment method");
      setIsProcessing(false);
      return;
    }

    if (!method.enabled) {
      toast.error(`${method.name} is currently disabled`);
      setIsProcessing(false);
      return;
    }

    // Wallet payment: Check balance and process via wallet
    if (method.type === 'wallet') {
      if (!guestId) {
        toast.error("Guest ID required for wallet payments");
        setIsProcessing(false);
        return;
      }

      if (!wallet || wallet.balance < paymentAmount) {
        const availableBalance = wallet?.balance || 0;
        const shortfall = paymentAmount - availableBalance;
        toast.error(
          availableBalance > 0 
            ? `Insufficient wallet balance. Available: ₦${availableBalance.toLocaleString()}, Required: ₦${paymentAmount.toLocaleString()}, Shortfall: ₦${shortfall.toLocaleString()}. Please select another payment method or reduce the amount.`
            : "Insufficient wallet balance. Please select another payment method."
        );
        setIsProcessing(false);
        return;
      }

      try {
        // Pay from wallet
        await payFromWallet({
          amount: paymentAmount,
          description: `Payment for folio ${selectedPayment.folio_number}`,
          referenceType: 'folio',
          referenceId: selectedPayment.folio_id
        });

        // Record the payment in the system
        await createPayment({
          folio_id: selectedPayment.folio_id,
          amount: paymentAmount,
          payment_method: 'Wallet',
          payment_method_id: paymentMethodId,
          department_id: selectedDepartmentId || undefined,
          terminal_id: selectedTerminalId || undefined,
          payment_source: triggerSource === 'checkout' ? 'frontdesk' : 
                         (triggerSource === 'accounting' ? 'frontdesk' : triggerSource)
        });

        toast.success(`Payment of ₦${paymentAmount.toLocaleString()} processed from wallet`);
        
        if (onPaymentSuccess) {
          await onPaymentSuccess(paymentAmount, method.name);
        }
        
        setTimeout(() => {
          onOpenChange(false);
          setSelectedPayment(null);
          setPaymentMethodId("");
          setAmount("");
        }, 1000);
      } catch (error: any) {
        console.error('[Payment Process] Wallet payment error:', error);
        toast.error(error.message || "Failed to process wallet payment");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // PHASE 1: Enforce terminal requirement for POS payments
    if (method.type === 'pos' && !selectedTerminalId) {
      toast.error("POS payments require a terminal selection");
      setIsProcessing(false);
      return;
    }

    const fees = calculateFees(paymentAmount, paymentMethodId);
    const dbPaymentMethod = mapPaymentMethod(method);

    console.log('[Payment Process] Creating payment:', {
      folio_id: selectedPayment.folio_id,
      amount: paymentAmount,
      payment_method: dbPaymentMethod,
      payment_method_id: paymentMethodId
    });
    try {
      await createPayment({
        folio_id: selectedPayment.folio_id,
        amount: paymentAmount,
        payment_method: dbPaymentMethod,
        payment_method_id: paymentMethodId,
        // Phase 3: Include department and terminal context
        department_id: selectedDepartmentId || undefined,
        terminal_id: selectedTerminalId || undefined,
        payment_source: triggerSource === 'checkout' ? 'frontdesk' : 
                       (triggerSource === 'accounting' ? 'frontdesk' : triggerSource)
      });

      console.log('[Payment Process] Payment successful');
      toast.success(`Payment of ₦${paymentAmount.toLocaleString()} recorded via ${method.name}`);
      
      if (onPaymentSuccess) {
        await onPaymentSuccess(paymentAmount, method.name);
      }
      
      // Auto-close after longer delay to allow parent refresh to complete
      setTimeout(() => {
        onOpenChange(false);
        setSelectedPayment(null);
        setPaymentMethodId("");
        setAmount("");
      }, 1000);
    } catch (error: any) {
      console.error('[Payment Process] Error:', error);
      toast.error(error.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] w-[95vw] sm:w-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
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
        </div>
        
        <div className="flex-1 overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-6 h-full">
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
                  <CardContent className="p-4 space-y-3">
                    <div className="text-sm font-medium">Selected Payment</div>
                    <div>
                      <div>Room {selectedPayment.room_number} • {selectedPayment.guest_name}</div>
                      <div className="text-lg font-bold text-primary">
                        ₦{selectedPayment.balance.toLocaleString()}
                      </div>
                    </div>
                    
                    {taxBreakdown.length > 1 && (
                      <div className="pt-2">
                        <TaxBreakdownDisplay
                          breakdown={taxBreakdown}
                          totalAmount={selectedPayment.balance}
                          currency="NGN"
                          showZeroRates={false}
                          className="border-0 shadow-none"
                        />
                      </div>
                    )}
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
                               case 'Wallet': return <Wallet className="h-4 w-4" />;
                               default: return <CreditCard className="h-4 w-4" />;
                             }
                           };
                           
                           return (
                             <SelectItem key={method.id} value={method.id}>
                               <div className="flex items-center gap-2">
                                 <IconComponent />
                                 {method.name}
                                 {method.type === 'wallet' && wallet && (
                                   <span className="text-xs text-muted-foreground ml-2">
                                     (Balance: ₦{wallet.balance.toFixed(2)})
                                   </span>
                                 )}
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
                  
                  {/* Phase 3: Department Selection */}
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Phase 3: Terminal Selection */}
                  {selectedDepartmentId && (
                    <div>
                      <Label htmlFor="terminal">Terminal / POS</Label>
                      <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select terminal" />
                        </SelectTrigger>
                        <SelectContent>
                          {terminalOptions.map((terminal) => (
                            <SelectItem key={terminal.value} value={terminal.value}>
                              <div className="flex flex-col">
                                <span>{terminal.label}</span>
                                {terminal.location && (
                                  <span className="text-xs text-muted-foreground">
                                    {terminal.location}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleProcessPayment}
                    disabled={!paymentMethodId || !amount || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Process Payment'
                    )}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
