import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { HotelConfiguration, AVAILABLE_CURRENCIES } from '@/types/configuration';
import { DollarSign, Percent, AlertTriangle } from 'lucide-react';

interface CurrencyFinancialsProps {
  currencyConfig: HotelConfiguration['currency'];
  taxConfig: HotelConfiguration['tax'];
  onUpdateCurrency: (updates: Partial<HotelConfiguration['currency']>) => Promise<boolean>;
  onUpdateTax: (updates: Partial<HotelConfiguration['tax']>) => Promise<boolean>;
  loading: boolean;
}

export const CurrencyFinancials = ({ 
  currencyConfig, 
  taxConfig, 
  onUpdateCurrency, 
  onUpdateTax, 
  loading 
}: CurrencyFinancialsProps) => {
  const { toast } = useToast();
  const { data: tenantInfo } = useTenantInfo();
  const [currencyData, setCurrencyData] = useState(currencyConfig);
  const [taxData, setTaxData] = useState(taxConfig);
  const [saving, setSaving] = useState(false);

  // Load tenant currency when available
  useEffect(() => {
    if (tenantInfo?.currency && currencyConfig) {
      const currency = AVAILABLE_CURRENCIES.find(c => c.code === tenantInfo.currency);
      if (currency) {
        setCurrencyData(prev => ({
          ...prev,
          default_currency: currency.code,
          currency_symbol: currency.symbol
        }));
      }
    }
  }, [tenantInfo, currencyConfig]);

  const handleSaveCurrency = async () => {
    setSaving(true);
    try {
      const success = await onUpdateCurrency(currencyData);
      if (success) {
        toast({
          title: "Currency Settings Saved",
          description: "Currency and formatting preferences have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save currency settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTax = async () => {
    setSaving(true);
    try {
      const success = await onUpdateTax(taxData);
      if (success) {
        toast({
          title: "Tax Settings Saved",
          description: "Tax and service charge settings have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save tax settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      setCurrencyData(prev => ({
        ...prev,
        default_currency: currency.code,
        currency_symbol: currency.symbol
      }));
    }
  };

  const formatPreview = (amount: number) => {
    const { currency_symbol, symbol_position, thousand_separator, decimal_separator } = currencyData;
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: currencyData.decimal_places,
      maximumFractionDigits: currencyData.decimal_places
    }).replace(/,/g, thousand_separator).replace(/\./g, decimal_separator);

    return symbol_position === 'before' ? `${currency_symbol}${formatted}` : `${formatted}${currency_symbol}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Currency & Financial Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure currency display and tax calculations system-wide
        </p>
      </div>

      <div className="grid gap-6">
        {/* Currency Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Settings
              <Badge variant="outline" className="ml-2">System-wide</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={currencyData.default_currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.name} ({currency.symbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol_position">Symbol Position</Label>
                <Select
                  value={currencyData.symbol_position}
                  onValueChange={(value: any) => setCurrencyData(prev => ({ ...prev, symbol_position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Before Amount (₦25,000)</SelectItem>
                    <SelectItem value="after">After Amount (25,000₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="decimal_places">Decimal Places</Label>
                <Select
                  value={currencyData.decimal_places.toString()}
                  onValueChange={(value) => setCurrencyData(prev => ({ ...prev, decimal_places: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (25,000)</SelectItem>
                    <SelectItem value="2">2 (25,000.00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thousand_separator">Thousands Separator</Label>
                <Select
                  value={currencyData.thousand_separator}
                  onValueChange={(value: any) => setCurrencyData(prev => ({ ...prev, thousand_separator: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Comma (25,000)</SelectItem>
                    <SelectItem value=".">Period (25.000)</SelectItem>
                    <SelectItem value=" ">Space (25 000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimal_separator">Decimal Separator</Label>
                <Select
                  value={currencyData.decimal_separator}
                  onValueChange={(value: any) => setCurrencyData(prev => ({ ...prev, decimal_separator: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=".">Period (25,000.00)</SelectItem>
                    <SelectItem value=",">Comma (25,000,00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 space-y-1">
                <div>Small amount: {formatPreview(1250.50)}</div>
                <div>Large amount: {formatPreview(125000.00)}</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveCurrency}
                disabled={saving || loading}
                className="min-w-32"
              >
                {saving ? 'Saving...' : 'Save Currency'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tax Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Tax & Service Charges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                  <Input
                    id="vat_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxData.vat_rate}
                    onChange={(e) => setTaxData(prev => ({ ...prev, vat_rate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tax_inclusive"
                    checked={taxData.tax_inclusive}
                    onCheckedChange={(checked) => setTaxData(prev => ({ ...prev, tax_inclusive: checked }))}
                  />
                  <Label htmlFor="tax_inclusive">VAT Inclusive in displayed prices</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service_charge_rate">Service Charge Rate (%)</Label>
                  <Input
                    id="service_charge_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxData.service_charge_rate}
                    onChange={(e) => setTaxData(prev => ({ ...prev, service_charge_rate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="service_charge_inclusive"
                    checked={taxData.service_charge_inclusive}
                    onCheckedChange={(checked) => setTaxData(prev => ({ ...prev, service_charge_inclusive: checked }))}
                  />
                  <Label htmlFor="service_charge_inclusive">Service charge inclusive in displayed prices</Label>
                </div>
              </div>
            </div>

            {/* Tax Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Bill Calculation Preview</Label>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Amount:</span>
                  <span>{formatPreview(10000)}</span>
                </div>
                {!taxData.tax_inclusive && (
                  <div className="flex justify-between">
                    <span>VAT ({taxData.vat_rate}%):</span>
                    <span>{formatPreview(10000 * (taxData.vat_rate / 100))}</span>
                  </div>
                )}
                {!taxData.service_charge_inclusive && (
                  <div className="flex justify-between">
                    <span>Service Charge ({taxData.service_charge_rate}%):</span>
                    <span>{formatPreview(10000 * (taxData.service_charge_rate / 100))}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span>
                    {formatPreview(
                      10000 + 
                      (taxData.tax_inclusive ? 0 : 10000 * (taxData.vat_rate / 100)) +
                      (taxData.service_charge_inclusive ? 0 : 10000 * (taxData.service_charge_rate / 100))
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <strong className="text-amber-800">Important:</strong>
                <p className="text-amber-700">
                  Tax changes will apply to all new transactions. Existing bills will retain their original tax calculations.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveTax}
                disabled={saving || loading}
                className="min-w-32"
              >
                {saving ? 'Saving...' : 'Save Tax Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};