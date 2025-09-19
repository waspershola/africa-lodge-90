import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Building, Smartphone, Clock, UserX } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingAmount?: number;
  onPaymentSuccess?: (amount: number, method: string) => void;
}

const mockPendingPayments = [
  {
    id: 1,
    room: "305",
    guest: "Jane Smith",
    amount: 15000,
    type: "Room Charge",
    dueDate: "2024-08-22"
  },
  {
    id: 2,
    room: "201", 
    guest: "John Doe",
    amount: 25000,
    type: "Deposit",
    dueDate: "2024-08-22"
  },
  {
    id: 3,
    room: "407",
    guest: "Sarah Wilson", 
    amount: 8500,
    type: "Service Charge",
    dueDate: "2024-08-21"
  }
];

export const PaymentDialog = ({ open, onOpenChange, pendingAmount, onPaymentSuccess }: PaymentDialogProps) => {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");

  const handleSelectPayment = (payment: any) => {
    setSelectedPayment(payment);
    setAmount(payment.amount.toString());
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
              {mockPendingPayments.map((payment) => (
                <Card 
                  key={payment.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPayment?.id === payment.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectPayment(payment)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Room {payment.room}</div>
                        <div className="text-sm text-muted-foreground">{payment.guest}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {payment.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₦{payment.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          Due: {payment.dueDate}
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
                      <div>Room {selectedPayment.room} • {selectedPayment.guest}</div>
                      <div className="text-lg font-bold text-primary">
                        ₦{selectedPayment.amount.toLocaleString()}
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
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="moniepoint-pos">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Moniepoint POS
                          </div>
                        </SelectItem>
                        <SelectItem value="opay-pos">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Opay POS
                          </div>
                        </SelectItem>
                        <SelectItem value="transfer">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                        <SelectItem value="paystack">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Paystack Online
                          </div>
                        </SelectItem>
                        <SelectItem value="pay-later">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pay Later
                          </div>
                        </SelectItem>
                        <SelectItem value="debtor">
                          <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4" />
                            Debtor Account
                          </div>
                        </SelectItem>
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