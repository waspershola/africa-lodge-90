import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Smartphone, Building, Clock, UserX, Plus, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  type: 'pos' | 'digital' | 'transfer' | 'cash' | 'credit';
  icon: string;
  enabled: boolean;
  fees?: {
    percentage: number;
    fixed: number;
  };
  config?: any;
}

const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'cash',
    icon: 'Banknote',
    enabled: true
  },
  {
    id: 'card_pos',
    name: 'Card (POS Terminal)',
    type: 'pos',
    icon: 'CreditCard',
    enabled: true,
    fees: { percentage: 1.5, fixed: 0 }
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'transfer',
    icon: 'ArrowRightLeft',
    enabled: true,
    fees: { percentage: 0, fixed: 25 }
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    type: 'transfer',
    icon: 'Smartphone',
    enabled: true,
    fees: { percentage: 1.0, fixed: 0 }
  },
  {
    id: 'corporate_account',
    name: 'Corporate Account',
    type: 'credit',
    icon: 'Building',
    enabled: true,
    fees: { percentage: 0, fixed: 0 }
  },
  {
    id: 'debtor',
    name: 'Debtor Account',
    type: 'credit',
    icon: 'UserX',
    enabled: true
  }
];

export default function PaymentMethodsConfig() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({
    name: '',
    type: 'pos' as PaymentMethod['type'],
    fees: { percentage: 0, fixed: 0 }
  });
  const { toast } = useToast();

  const toggleMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
    toast({
      title: "Payment method updated",
      description: "Changes have been saved successfully."
    });
  };

  const addPaymentMethod = () => {
    if (!newMethod.name) return;
    
    const method: PaymentMethod = {
      id: `custom-${Date.now()}`,
      name: newMethod.name,
      type: newMethod.type,
      icon: 'CreditCard',
      enabled: true,
      fees: newMethod.fees
    };

    setPaymentMethods(methods => [...methods, method]);
    setNewMethod({ name: '', type: 'pos', fees: { percentage: 0, fixed: 0 } });
    setIsAddingMethod(false);
    toast({
      title: "Payment method added",
      description: `${method.name} has been configured successfully.`
    });
  };

  const removeMethod = (id: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
    toast({
      title: "Payment method removed",
      description: "The payment method has been deleted."
    });
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'pos':
        return <CreditCard className="h-4 w-4" />;
      case 'digital':
        return <Smartphone className="h-4 w-4" />;
      case 'transfer':
        return <Building className="h-4 w-4" />;
      case 'credit':
        return <Clock className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'pos':
        return 'bg-blue-100 text-blue-800';
      case 'digital':
        return 'bg-green-100 text-green-800';
      case 'transfer':
        return 'bg-purple-100 text-purple-800';
      case 'credit':
        return 'bg-orange-100 text-orange-800';
      case 'cash':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMethods.filter(m => m.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {paymentMethods.length} configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POS Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMethods.filter(m => m.type === 'pos' && m.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">POS terminals active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Options</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentMethods.filter(m => m.type === 'credit' && m.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">Credit/Debt options</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Fees</CardTitle>
            <Smartphone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.67%</div>
            <p className="text-xs text-muted-foreground">+ ₦33 per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Configuration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Methods Configuration</CardTitle>
              <CardDescription>Manage payment methods available to your front desk staff</CardDescription>
            </div>
            <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="method-name">Payment Method Name</Label>
                    <Input
                      id="method-name"
                      value={newMethod.name}
                      onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                      placeholder="e.g., Zenith Bank POS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method-type">Type</Label>
                    <Select
                      value={newMethod.type}
                      onValueChange={(value: PaymentMethod['type']) => setNewMethod({ ...newMethod, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pos">POS Terminal</SelectItem>
                        <SelectItem value="digital">Digital Payment</SelectItem>
                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit">Credit/Debt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fee-percentage">Fee Percentage (%)</Label>
                      <Input
                        id="fee-percentage"
                        type="number"
                        step="0.01"
                        value={newMethod.fees.percentage}
                        onChange={(e) => setNewMethod({
                          ...newMethod,
                          fees: { ...newMethod.fees, percentage: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fee-fixed">Fixed Fee (₦)</Label>
                      <Input
                        id="fee-fixed"
                        type="number"
                        value={newMethod.fees.fixed}
                        onChange={(e) => setNewMethod({
                          ...newMethod,
                          fees: { ...newMethod.fees, fixed: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingMethod(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addPaymentMethod}>Add Method</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getMethodIcon(method.type)}
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getTypeColor(method.type)}>
                        {method.type.toUpperCase()}
                      </Badge>
                      {method.fees && (
                        <span className="text-sm text-muted-foreground">
                          {method.fees.percentage}% + ₦{method.fees.fixed}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => toggleMethod(method.id)}
                  />
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    {method.id.startsWith('custom-') && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}