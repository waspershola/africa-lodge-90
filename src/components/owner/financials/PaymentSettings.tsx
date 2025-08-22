import { useState } from "react";
import { CreditCard, Settings, Plus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentGateway {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'digital' | 'cash';
  status: 'active' | 'inactive' | 'pending';
  fees: {
    percentage: number;
    fixed: number;
  };
  lastTransaction: string;
}

const mockGateways: PaymentGateway[] = [
  {
    id: '1',
    name: 'Stripe',
    type: 'card',
    status: 'active',
    fees: { percentage: 2.9, fixed: 0.30 },
    lastTransaction: '2 hours ago'
  },
  {
    id: '2',
    name: 'Square POS',
    type: 'card',
    status: 'active',
    fees: { percentage: 2.6, fixed: 0.10 },
    lastTransaction: '1 hour ago'
  },
  {
    id: '3',
    name: 'Bank Transfer',
    type: 'bank',
    status: 'active',
    fees: { percentage: 0.5, fixed: 2.00 },
    lastTransaction: '3 days ago'
  },
  {
    id: '4',
    name: 'PayPal',
    type: 'digital',
    status: 'inactive',
    fees: { percentage: 3.4, fixed: 0.30 },
    lastTransaction: 'Never'
  }
];

export default function PaymentSettings() {
  const [gateways, setGateways] = useState<PaymentGateway[]>(mockGateways);
  const [autoCharging, setAutoCharging] = useState(true);
  const [depositRequired, setDepositRequired] = useState(true);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-accent text-accent">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return <CreditCard className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Payment Gateway Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Gateways</CardTitle>
            <Check className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {gateways.filter(g => g.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {gateways.length} configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2.1%</div>
            <p className="text-xs text-muted-foreground">
              + $0.23 per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success</CardTitle>
            <Check className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">98.7%</div>
            <p className="text-xs text-muted-foreground">
              Success rate this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateways */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Gateways</CardTitle>
              <CardDescription>Configure and manage payment processing methods</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Gateway
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gateways.map((gateway) => (
              <div key={gateway.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getTypeIcon(gateway.type)}
                  <div>
                    <div className="font-medium">{gateway.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {gateway.fees.percentage}% + ${gateway.fees.fixed}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {getStatusBadge(gateway.status)}
                    <div className="text-xs text-muted-foreground mt-1">
                      Last: {gateway.lastTransaction}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Charges Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Extra Charges & Fees</CardTitle>
            <CardDescription>Configure additional charges and service fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="late-checkout">Late Checkout Fee</Label>
                  <Input id="late-checkout" placeholder="$25.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="damage-deposit">Damage Deposit</Label>
                  <Input id="damage-deposit" placeholder="$100.00" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cleaning-fee">Deep Cleaning Fee</Label>
                  <Input id="cleaning-fee" placeholder="$50.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pet-fee">Pet Fee (per night)</Label>
                  <Input id="pet-fee" placeholder="$15.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resort-fee">Resort Fee</Label>
                  <Input id="resort-fee" placeholder="$30.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-fee">Premium WiFi</Label>
                  <Input id="wifi-fee" placeholder="$10.00" />
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-charge Extra Services</Label>
                <p className="text-sm text-muted-foreground">Automatically charge for consumed services</p>
              </div>
              <Switch checked={autoCharging} onCheckedChange={setAutoCharging} />
            </div>
          </CardContent>
        </Card>

        {/* Taxes & Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Taxes & Policies</CardTitle>
            <CardDescription>Configure tax rates and payment policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city-tax">City Tax Rate (%)</Label>
                  <Input id="city-tax" placeholder="8.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-tax">Service Tax Rate (%)</Label>
                  <Input id="service-tax" placeholder="12.0" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-percentage">Required Deposit (%)</Label>
                <Input id="deposit-percentage" placeholder="25" />
                <p className="text-xs text-muted-foreground">Percentage of total booking amount</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation-policy">Cancellation Policy</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible (24h before)</SelectItem>
                    <SelectItem value="moderate">Moderate (7 days before)</SelectItem>
                    <SelectItem value="strict">Strict (14 days before)</SelectItem>
                    <SelectItem value="super-strict">Super Strict (30 days before)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Deposit</Label>
                  <p className="text-sm text-muted-foreground">Collect deposit at booking</p>
                </div>
                <Switch checked={depositRequired} onCheckedChange={setDepositRequired} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Accept Cash Payments</Label>
                  <p className="text-sm text-muted-foreground">Allow cash payments at front desk</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payment gateway configurations are encrypted and stored securely. Changes to critical settings require owner approval and may take up to 24 hours to process.
        </AlertDescription>
      </Alert>
    </div>
  );
}