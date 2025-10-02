import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, Percent, Receipt } from "lucide-react";
import { HotelConfiguration } from "@/types/configuration";
import { useToast } from "@/hooks/use-toast";

interface TaxServiceChargeSettingsProps {
  config: HotelConfiguration;
  onUpdate: (section: keyof HotelConfiguration, updates: any) => Promise<void>;
}

const CHARGE_TYPES = [
  { value: 'room', label: 'Room Charges', description: 'Accommodation and room-related fees' },
  { value: 'food', label: 'Food', description: 'Restaurant and dining charges' },
  { value: 'beverage', label: 'Beverages', description: 'Drinks and bar charges' },
  { value: 'laundry', label: 'Laundry', description: 'Laundry and cleaning services' },
  { value: 'spa', label: 'Spa & Wellness', description: 'Spa treatments and wellness services' },
];

export function TaxServiceChargeSettings({ config, onUpdate }: TaxServiceChargeSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    vat_rate: config.tax?.vat_rate || 7.5,
    service_charge_rate: config.tax?.service_charge_rate || 10.0,
    tax_inclusive: config.tax?.tax_inclusive || false,
    service_charge_inclusive: config.tax?.service_charge_inclusive || false,
    vat_applicable_to: config.tax?.vat_applicable_to || ['room', 'food', 'beverage', 'laundry', 'spa'],
    service_applicable_to: config.tax?.service_applicable_to || ['room', 'food', 'beverage', 'spa'],
    show_tax_breakdown: config.tax?.show_tax_breakdown !== false,
    zero_rate_hidden: config.tax?.zero_rate_hidden !== false,
  });

  const handleRateChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalConfig(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setLocalConfig(prev => ({ ...prev, [field]: checked }));
  };

  const handleChargeTypeToggle = (field: 'vat_applicable_to' | 'service_applicable_to', chargeType: string) => {
    setLocalConfig(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(chargeType)
        ? currentArray.filter(t => t !== chargeType)
        : [...currentArray, chargeType];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate('tax', localConfig);
      toast({
        title: "Settings Saved",
        description: "Tax and service charge settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save tax settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateExample = () => {
    const baseAmount = 10000;
    let total = baseAmount;
    let vatAmount = 0;
    let serviceAmount = 0;

    if (!localConfig.tax_inclusive && localConfig.vat_rate > 0) {
      vatAmount = baseAmount * localConfig.vat_rate / 100;
    }

    if (!localConfig.service_charge_inclusive && localConfig.service_charge_rate > 0) {
      serviceAmount = baseAmount * localConfig.service_charge_rate / 100;
    }

    if (localConfig.tax_inclusive || localConfig.service_charge_inclusive) {
      // For inclusive, show reverse calculation
      return { baseAmount, vatAmount: 0, serviceAmount: 0, total: baseAmount };
    }

    total = baseAmount + vatAmount + serviceAmount;
    return { baseAmount, vatAmount, serviceAmount, total };
  };

  const example = calculateExample();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            VAT Settings
          </CardTitle>
          <CardDescription>
            Configure Value Added Tax (VAT) rates and applicability for different services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vat_rate">VAT Rate (%)</Label>
              <Input
                id="vat_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={localConfig.vat_rate}
                onChange={(e) => handleRateChange('vat_rate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current government VAT rate (typically 5-20%)
              </p>
            </div>

            <div className="space-y-2">
              <Label>VAT Pricing Mode</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Switch
                  id="tax_inclusive"
                  checked={localConfig.tax_inclusive}
                  onCheckedChange={(checked) => handleSwitchChange('tax_inclusive', checked)}
                />
                <Label htmlFor="tax_inclusive" className="cursor-pointer">
                  {localConfig.tax_inclusive ? 'VAT Inclusive' : 'VAT Exclusive'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {localConfig.tax_inclusive 
                  ? 'Prices already include VAT (extract from total)' 
                  : 'VAT added on top of base price'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Apply VAT To</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select which services should have VAT applied
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {CHARGE_TYPES.map((type) => (
                <div key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`vat_${type.value}`}
                    checked={localConfig.vat_applicable_to?.includes(type.value)}
                    onCheckedChange={() => handleChargeTypeToggle('vat_applicable_to', type.value)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`vat_${type.value}`} className="cursor-pointer font-medium">
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Service Charge Settings
          </CardTitle>
          <CardDescription>
            Configure service charge rates and applicability for different services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_charge_rate">Service Charge Rate (%)</Label>
              <Input
                id="service_charge_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={localConfig.service_charge_rate}
                onChange={(e) => handleRateChange('service_charge_rate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Hotel-defined service charge (typically 5-15%)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Service Charge Mode</Label>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Switch
                  id="service_charge_inclusive"
                  checked={localConfig.service_charge_inclusive}
                  onCheckedChange={(checked) => handleSwitchChange('service_charge_inclusive', checked)}
                />
                <Label htmlFor="service_charge_inclusive" className="cursor-pointer">
                  {localConfig.service_charge_inclusive ? 'Service Inclusive' : 'Service Exclusive'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {localConfig.service_charge_inclusive 
                  ? 'Prices already include service charge' 
                  : 'Service charge added on top of base price'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Apply Service Charge To</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select which services should have service charge applied
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {CHARGE_TYPES.map((type) => (
                <div key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`service_${type.value}`}
                    checked={localConfig.service_applicable_to?.includes(type.value)}
                    onCheckedChange={() => handleChargeTypeToggle('service_applicable_to', type.value)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`service_${type.value}`} className="cursor-pointer font-medium">
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Configure how taxes are displayed on receipts and invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="show_tax_breakdown">Show Tax Breakdown</Label>
              <p className="text-sm text-muted-foreground">
                Display detailed tax breakdown on folios and receipts
              </p>
            </div>
            <Switch
              id="show_tax_breakdown"
              checked={localConfig.show_tax_breakdown}
              onCheckedChange={(checked) => handleSwitchChange('show_tax_breakdown', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="zero_rate_hidden">Hide Zero Rates</Label>
              <p className="text-sm text-muted-foreground">
                Hide tax lines when rate is 0% (cleaner display)
              </p>
            </div>
            <Switch
              id="zero_rate_hidden"
              checked={localConfig.zero_rate_hidden}
              onCheckedChange={(checked) => handleSwitchChange('zero_rate_hidden', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Example Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Amount:</span>
            <span className="font-medium">₦{example.baseAmount.toLocaleString()}</span>
          </div>
          {!localConfig.tax_inclusive && example.vatAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>VAT ({localConfig.vat_rate}%):</span>
              <span className="font-medium">₦{example.vatAmount.toLocaleString()}</span>
            </div>
          )}
          {!localConfig.service_charge_inclusive && example.serviceAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Service Charge ({localConfig.service_charge_rate}%):</span>
              <span className="font-medium">₦{example.serviceAmount.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>₦{example.total.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Tax Settings'}
        </Button>
      </div>
    </div>
  );
}
