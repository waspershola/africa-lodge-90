import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Clock, Banknote, AlertCircle } from 'lucide-react';
import { usePaymentPolicies, usePaymentCalculator } from '@/hooks/usePaymentPolicies';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { usePaymentValidation } from '@/hooks/usePaymentValidation';

interface PaymentOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentOption: 'full' | 'deposit' | 'none', policyId: string, methods: string[]) => void;
  totalAmount: number;
  guestName: string;
  nights: number;
}

export default function PaymentOptionsDialog({
  open,
  onClose,
  onConfirm,
  totalAmount,
  guestName,
  nights
}: PaymentOptionsDialogProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'full' | 'deposit' | 'none'>('deposit');
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['cash']);

  const { data: policies = [] } = usePaymentPolicies();
  const { enabledMethods, getMethodById, calculateFees } = usePaymentMethodsContext();
  const { calculatePayment } = usePaymentCalculator();
  const { formatPrice } = useCurrency();
  const { validatePaymentMethod, getPaymentTotal } = usePaymentValidation();

  const currentPolicy = policies.find(p => p.id === selectedPolicy) || 
                       policies.find(p => p.is_default) || 
                       policies[0];

  const paymentCalc = currentPolicy 
    ? calculatePayment(totalAmount, currentPolicy, paymentOption)
    : { totalAmount, depositAmount: 0, balanceDue: totalAmount };

  const handleConfirm = () => {
    if (currentPolicy) {
      onConfirm(paymentOption, currentPolicy.id, selectedMethods);
      onClose();
    }
  };

  const getPaymentTimingLabel = (timing: string) => {
    switch (timing) {
      case 'at_booking': return 'Payment Required at Booking';
      case 'at_checkin': return 'Payment Due at Check-in';
      case 'flexible': return 'Flexible Payment';
      default: return timing;
    }
  };

  const PaymentOptionCard = ({ 
    option, 
    title, 
    description, 
    amount, 
    icon: Icon,
    disabled = false 
  }: {
    option: 'full' | 'deposit' | 'none';
    title: string;
    description: string;
    amount: number;
    icon: any;
    disabled?: boolean;
  }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        paymentOption === option 
          ? 'ring-2 ring-primary border-primary' 
          : 'hover:border-primary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && setPaymentOption(option)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {paymentOption === option && (
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-2">{description}</CardDescription>
        <div className="font-semibold text-lg">{formatPrice(amount)}</div>
        {option === 'deposit' && amount < totalAmount && (
          <div className="text-sm text-muted-foreground mt-1">
            Balance: {formatPrice(totalAmount - amount)} (due at check-in)
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reservation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Guest: <span className="font-medium">{guestName}</span></div>
                <div>Duration: <span className="font-medium">{nights} nights</span></div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="text-xl font-bold">Total: {formatPrice(totalAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Policy Selection */}
          {policies.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Policy</label>
              <Select 
                value={selectedPolicy || currentPolicy?.id} 
                onValueChange={setSelectedPolicy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map(policy => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.policy_name}
                      {policy.is_default && <Badge className="ml-2" variant="secondary">Default</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Current Policy Info */}
          {currentPolicy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Policy: {currentPolicy.policy_name}
                  {currentPolicy.is_default && <Badge variant="secondary">Default</Badge>}
                </CardTitle>
                <CardDescription>
                  {getPaymentTimingLabel(currentPolicy.payment_timing)}
                  {currentPolicy.auto_cancel_hours > 0 && (
                    <span className="flex items-center gap-1 mt-1 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      Auto-cancel after {currentPolicy.auto_cancel_hours} hours if unpaid
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Payment Options */}
          <div className="space-y-3">
            <h3 className="font-semibold">Choose Payment Option</h3>
            
            <div className="grid gap-3">
              <PaymentOptionCard
                option="full"
                title="Full Payment"
                description="Pay the complete amount now"
                amount={paymentCalc.totalAmount}
                icon={CreditCard}
              />
              
              {currentPolicy?.requires_deposit && (
                <PaymentOptionCard
                  option="deposit"
                  title={`Deposit (${currentPolicy.deposit_percentage}%)`}
                  description="Pay deposit now, balance at check-in"
                  amount={paymentCalc.depositAmount}
                  icon={Banknote}
                />
              )}
              
              <PaymentOptionCard
                option="none"
                title="Pay Later"
                description="No payment now, full amount due at check-in"
                amount={0}
                icon={Clock}
                disabled={currentPolicy?.payment_timing === 'at_booking'}
              />
            </div>
          </div>

          {/* Payment Methods */}
          {paymentOption !== 'none' && (
            <div className="space-y-3">
              <h3 className="font-semibold">Accepted Payment Methods</h3>
              <div className="grid grid-cols-2 gap-2">
                {enabledMethods
                  .filter(method => currentPolicy?.payment_methods_accepted.includes(method.id))
                  .map(method => (
                    <label 
                      key={method.id} 
                      className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes(method.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMethods([...selectedMethods, method.id]);
                          } else {
                            setSelectedMethods(selectedMethods.filter(id => id !== method.id));
                          }
                        }}
                      />
                      <span>{method.name}</span>
                      {method.fees && (method.fees.percentage > 0 || method.fees.fixed > 0) && (
                        <Badge variant="outline" className="text-xs">
                          {method.fees.percentage > 0 && `${method.fees.percentage}%`}
                          {method.fees.percentage > 0 && method.fees.fixed > 0 && ' + '}
                          {method.fees.fixed > 0 && `₦${method.fees.fixed}`}
                        </Badge>
                      )}
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Room Total:</span>
                  <span>{formatPrice(paymentCalc.totalAmount)}</span>
                </div>
                {paymentOption !== 'none' && (
                  <div className="flex justify-between font-semibold">
                    <span>
                      {paymentOption === 'full' ? 'Total Payment:' : 'Deposit Payment:'}
                    </span>
                    <span>{formatPrice(paymentCalc.depositAmount)}</span>
                  </div>
                )}
                {paymentCalc.balanceDue > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Balance Due:</span>
                    <span>{formatPrice(paymentCalc.balanceDue)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Payment Option
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}