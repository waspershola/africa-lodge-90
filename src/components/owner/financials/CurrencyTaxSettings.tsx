import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent, Globe, Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { type CurrencyTaxSettings } from "@/hooks/useCurrency";

interface CurrencyTaxSettingsProps {
  onSettingsChange?: (settings: CurrencyTaxSettings) => void;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];

export default function CurrencyTaxSettings({ onSettingsChange }: CurrencyTaxSettingsProps) {
  const [settings, setSettings] = useState<CurrencyTaxSettings>({
    currency: {
      code: "USD",
      symbol: "$",
      name: "US Dollar"
    },
    taxes: {
      vatEnabled: false,
      vatRate: 0,
      serviceChargeEnabled: false,
      serviceChargeRate: 0,
      cityTaxEnabled: false,
      cityTaxAmount: 0,
      touristTaxEnabled: false,
      touristTaxAmount: 0,
    },
    priceDisplay: {
      showTaxInclusive: true,
      showTaxBreakdown: false,
    }
  });

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      const newSettings = {
        ...settings,
        currency
      };
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
    }
  };

  const handleTaxChange = (taxType: keyof typeof settings.taxes, value: number | boolean) => {
    const newSettings = {
      ...settings,
      taxes: {
        ...settings.taxes,
        [taxType]: value
      }
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleDisplayChange = (displayType: keyof typeof settings.priceDisplay, value: boolean) => {
    const newSettings = {
      ...settings,
      priceDisplay: {
        ...settings.priceDisplay,
        [displayType]: value
      }
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const calculateSamplePrice = (basePrice: number) => {
    let totalPrice = basePrice;
    let breakdown = [];

    if (settings.taxes.vatEnabled && settings.taxes.vatRate > 0) {
      const vatAmount = (basePrice * settings.taxes.vatRate) / 100;
      totalPrice += vatAmount;
      breakdown.push(`VAT (${settings.taxes.vatRate}%): ${settings.currency.symbol}${vatAmount.toFixed(2)}`);
    }

    if (settings.taxes.serviceChargeEnabled && settings.taxes.serviceChargeRate > 0) {
      const serviceAmount = (basePrice * settings.taxes.serviceChargeRate) / 100;
      totalPrice += serviceAmount;
      breakdown.push(`Service (${settings.taxes.serviceChargeRate}%): ${settings.currency.symbol}${serviceAmount.toFixed(2)}`);
    }

    if (settings.taxes.cityTaxEnabled && settings.taxes.cityTaxAmount > 0) {
      totalPrice += settings.taxes.cityTaxAmount;
      breakdown.push(`City Tax: ${settings.currency.symbol}${settings.taxes.cityTaxAmount.toFixed(2)}`);
    }

    if (settings.taxes.touristTaxEnabled && settings.taxes.touristTaxAmount > 0) {
      totalPrice += settings.taxes.touristTaxAmount;
      breakdown.push(`Tourist Tax: ${settings.currency.symbol}${settings.taxes.touristTaxAmount.toFixed(2)}`);
    }

    return { totalPrice, breakdown };
  };

  const samplePrice = calculateSamplePrice(100);

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Currency and tax settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Currency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hotel Currency</Label>
              <Select value={settings.currency.code} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{currency.symbol}</span>
                        <span>{currency.name} ({currency.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Currency:</span>
                <Badge variant="outline" className="font-mono">
                  {settings.currency.symbol} {settings.currency.code}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Price Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Tax-Inclusive Prices</Label>
                <p className="text-sm text-muted-foreground">Display final prices including taxes</p>
              </div>
              <Switch
                checked={settings.priceDisplay.showTaxInclusive}
                onCheckedChange={(checked) => handleDisplayChange("showTaxInclusive", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Tax Breakdown</Label>
                <p className="text-sm text-muted-foreground">Display individual tax components</p>
              </div>
              <Switch
                checked={settings.priceDisplay.showTaxBreakdown}
                onCheckedChange={(checked) => handleDisplayChange("showTaxBreakdown", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Tax Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* VAT/Sales Tax */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>VAT/Sales Tax</Label>
                <p className="text-sm text-muted-foreground">Percentage-based tax on room rate</p>
              </div>
              <Switch
                checked={settings.taxes.vatEnabled}
                onCheckedChange={(checked) => handleTaxChange("vatEnabled", checked)}
              />
            </div>
            {settings.taxes.vatEnabled && (
              <div className="space-y-2">
                <Label>VAT Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.taxes.vatRate}
                  onChange={(e) => handleTaxChange("vatRate", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 7.5"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Service Charge */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Service Charge</Label>
                <p className="text-sm text-muted-foreground">Additional service fee percentage</p>
              </div>
              <Switch
                checked={settings.taxes.serviceChargeEnabled}
                onCheckedChange={(checked) => handleTaxChange("serviceChargeEnabled", checked)}
              />
            </div>
            {settings.taxes.serviceChargeEnabled && (
              <div className="space-y-2">
                <Label>Service Charge Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.taxes.serviceChargeRate}
                  onChange={(e) => handleTaxChange("serviceChargeRate", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 10"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* City Tax */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>City Tax</Label>
                <p className="text-sm text-muted-foreground">Fixed amount per night</p>
              </div>
              <Switch
                checked={settings.taxes.cityTaxEnabled}
                onCheckedChange={(checked) => handleTaxChange("cityTaxEnabled", checked)}
              />
            </div>
            {settings.taxes.cityTaxEnabled && (
              <div className="space-y-2">
                <Label>City Tax Amount ({settings.currency.symbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.taxes.cityTaxAmount}
                  onChange={(e) => handleTaxChange("cityTaxAmount", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 5.00"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Tourist Tax */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tourist Tax</Label>
                <p className="text-sm text-muted-foreground">Fixed amount per guest per night</p>
              </div>
              <Switch
                checked={settings.taxes.touristTaxEnabled}
                onCheckedChange={(checked) => handleTaxChange("touristTaxEnabled", checked)}
              />
            </div>
            {settings.taxes.touristTaxEnabled && (
              <div className="space-y-2">
                <Label>Tourist Tax Amount ({settings.currency.symbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.taxes.touristTaxAmount}
                  onChange={(e) => handleTaxChange("touristTaxAmount", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 3.00"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Price Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Sample calculation for a {settings.currency.symbol}100.00 room rate:
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Room Rate:</span>
                <span className="font-mono">{settings.currency.symbol}100.00</span>
              </div>
              
              {samplePrice.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm text-muted-foreground">
                  <span>{item.split(':')[0]}:</span>
                  <span className="font-mono">{item.split(':')[1]}</span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total Price:</span>
                <span className="font-mono">{settings.currency.symbol}{samplePrice.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="bg-gradient-primary">
          Save Currency & Tax Settings
        </Button>
      </div>
    </div>
  );
}