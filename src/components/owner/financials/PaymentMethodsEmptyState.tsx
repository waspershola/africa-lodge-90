import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Building2, Smartphone, Banknote } from "lucide-react";

interface PaymentMethodsEmptyStateProps {
  onAddMethod: () => void;
  onQuickSetup: (scenario: 'urban' | 'business' | 'rural') => void;
}

export function PaymentMethodsEmptyState({ onAddMethod, onQuickSetup }: PaymentMethodsEmptyStateProps) {
  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Configure Your Payment Methods</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Set up the payment methods your hotel accepts. Each hotel has unique payment preferences based on location, banking relationships, and business policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Setup Options */}
          <div>
            <h3 className="font-semibold mb-3 text-center">Quick Setup Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onQuickSetup('urban')}>
                <CardContent className="pt-6 text-center">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Urban Hotel</h4>
                  <p className="text-xs text-muted-foreground">Cash + POS + Digital Wallets</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onQuickSetup('business')}>
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Business Hotel</h4>
                  <p className="text-xs text-muted-foreground">Cash + Bank Transfer + Corporate</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onQuickSetup('rural')}>
                <CardContent className="pt-6 text-center">
                  <Banknote className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Rural Hotel</h4>
                  <p className="text-xs text-muted-foreground">Cash Only</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">What you'll need:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your bank account details for transfers</li>
              <li>POS terminal provider and fee rates</li>
              <li>Digital wallet accounts (Moniepoint, OPay, Palmpay, etc.)</li>
              <li>Transaction fee information from your providers</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onAddMethod} size="lg">
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
