import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Building, Smartphone, Clock, UserX } from "lucide-react";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useBilling } from "@/hooks/useBilling";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAmount?: number;
  onPaymentSuccess?: (amount: number, method: string) => void;
}

export const PaymentDialog = ({ open, onOpenChange, pendingAmount, onPaymentSuccess }: PaymentDialogProps) => {
  const { folioBalances } = useBilling();
  const { enabledMethods } = usePaymentMethods();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");

  // Filter folios with outstanding balances as pending payments
  const pendingPayments = folioBalances.filter(folio => folio.balance > 0);

  const handleSelectPayment = (payment: any) => {
    setSelectedPayment(payment);
    setAmount(payment.balance.toString());
  };

  const handleProcessPayment = () => {
    const paymentAmount = parseFloat(amount);
    console.log("Processing payment:", {
      payment: selectedPayment,
      method: paymentMethod,
      amount: paymentAmount
    });
    
    // Call success callback if provided
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentAmount, paymentMethod);
    }
    
    onOpenChange(false);
    setSelectedPayment(null);
    setPaymentMethod("");
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Collect Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Pending Payments List */}
          <div className="space-y-4">
            <h3 className="font-medium">Pending Payments</h3>
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
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              {method.icon === 'Banknote' && <Banknote className="h-4 w-4" />}
                              {method.icon === 'CreditCard' && <CreditCard className="h-4 w-4" />}
                              {method.icon === 'Bank' && <Building className="h-4 w-4" />}
                              {method.icon === 'Smartphone' && <Smartphone className="h-4 w-4" />}
                              {method.icon === 'Clock' && <Clock className="h-4 w-4" />}
                              {method.icon === 'UserX' && <UserX className="h-4 w-4" />}
                              {method.name}
                            </div>
                          </SelectItem>
                        ))}
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
                    disabled={!paymentMethod || !amount}
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