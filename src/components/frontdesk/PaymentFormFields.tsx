import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, Building, CreditCard, Smartphone, Wallet, Info } from 'lucide-react';
import { usePaymentMethodsContext } from '@/contexts/PaymentMethodsContext';
import { useActiveDepartments, useDefaultDepartment } from '@/hooks/data/useDepartments';
import { useActiveTerminals, useDefaultTerminal } from '@/hooks/data/useTerminals';
import { useGuestWallet } from '@/hooks/useGuestWallet';
import { useEffect } from 'react';

interface PaymentFormFieldsProps {
  amount: string;
  onAmountChange: (value: string) => void;
  paymentMethodId: string;
  onPaymentMethodChange: (value: string) => void;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  terminalId: string;
  onTerminalChange: (value: string) => void;
  guestId?: string;
  totalAmount?: number;
  showTotalHint?: boolean;
  amountLabel?: string;
  amountHint?: string;
}

export const PaymentFormFields = ({
  amount,
  onAmountChange,
  paymentMethodId,
  onPaymentMethodChange,
  departmentId,
  onDepartmentChange,
  terminalId,
  onTerminalChange,
  guestId,
  totalAmount,
  showTotalHint = false,
  amountLabel = "Amount",
  amountHint
}: PaymentFormFieldsProps) => {
  const { enabledMethods, getMethodById, calculateFees } = usePaymentMethodsContext();
  const { departments, options: departmentOptions } = useActiveDepartments();
  const { data: defaultDepartmentId } = useDefaultDepartment();
  const { terminals, options: terminalOptions } = useActiveTerminals(departmentId);
  const { data: defaultTerminalId } = useDefaultTerminal(departmentId);
  const { wallet, walletLoading } = useGuestWallet(guestId);

  const selectedMethod = getMethodById(paymentMethodId);
  const requiresTerminal = selectedMethod?.type === 'pos';
  const isWalletPayment = selectedMethod?.type === 'wallet';

  // Auto-select default department
  useEffect(() => {
    if (!departmentId && defaultDepartmentId) {
      onDepartmentChange(defaultDepartmentId);
    }
  }, [defaultDepartmentId, departmentId, onDepartmentChange]);

  // Auto-select default terminal when department changes
  useEffect(() => {
    if (departmentId && !terminalId && defaultTerminalId) {
      onTerminalChange(defaultTerminalId);
    }
  }, [departmentId, defaultTerminalId, terminalId, onTerminalChange]);

  const getPaymentMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote': return <Banknote className="h-4 w-4" />;
      case 'CreditCard': return <CreditCard className="h-4 w-4" />;
      case 'Building': return <Building className="h-4 w-4" />;
      case 'Smartphone': return <Smartphone className="h-4 w-4" />;
      case 'Wallet': return <Wallet className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="amount">{amountLabel}</Label>
        {amountHint && (
          <p className="text-xs text-muted-foreground mt-1">{amountHint}</p>
        )}
        <div className="relative mt-1">
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Enter amount"
            className={showTotalHint && totalAmount ? "pr-24" : ""}
          />
          {showTotalHint && totalAmount && totalAmount > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              / ₦{totalAmount.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="payment-method">Payment Method</Label>
        <Select value={paymentMethodId} onValueChange={onPaymentMethodChange}>
          <SelectTrigger id="payment-method" className="mt-1">
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            {enabledMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(method.icon)}
                  <span>{method.name}</span>
                  {method.type === 'wallet' && wallet && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      ₦{wallet.balance.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {isWalletPayment && wallet && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-muted/50 rounded-md">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <div>Current wallet balance: <span className="font-medium">₦{wallet.balance.toLocaleString()}</span></div>
              {parseFloat(amount) > wallet.balance && (
                <div className="text-destructive mt-1">Insufficient wallet balance</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="department">Department</Label>
        <Select value={departmentId} onValueChange={onDepartmentChange}>
          <SelectTrigger id="department" className="mt-1">
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

      {requiresTerminal && (
        <div>
          <Label htmlFor="terminal">Terminal / POS</Label>
          <Select value={terminalId} onValueChange={onTerminalChange}>
            <SelectTrigger id="terminal" className="mt-1">
              <SelectValue placeholder="Select terminal" />
            </SelectTrigger>
            <SelectContent>
              {terminalOptions.map((terminal) => (
                <SelectItem key={terminal.value} value={terminal.value}>
                  {terminal.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!terminalId && (
            <p className="text-xs text-destructive mt-1">Terminal selection required for POS payments</p>
          )}
        </div>
      )}

      {selectedMethod && parseFloat(amount) > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Amount:</span>
                <span className="font-medium">₦{parseFloat(amount).toLocaleString()}</span>
              </div>
              {selectedMethod.fees && (selectedMethod.fees.percentage > 0 || selectedMethod.fees.fixed > 0) && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Processing Fee:</span>
                    <span>₦{calculateFees(parseFloat(amount), paymentMethodId).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t font-medium">
                    <span>Total to Charge:</span>
                    <span>₦{(parseFloat(amount) + calculateFees(parseFloat(amount), paymentMethodId)).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
