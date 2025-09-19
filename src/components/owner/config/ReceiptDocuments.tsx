import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { HotelConfiguration } from '@/types/configuration';
import { FileText, Printer, QrCode, PenTool } from 'lucide-react';

interface ReceiptDocumentsProps {
  config: HotelConfiguration['documents'];
  onUpdate: (updates: Partial<HotelConfiguration['documents']>) => Promise<boolean>;
  loading: boolean;
}

const RECEIPT_TEMPLATES = [
  { value: 'A4', label: 'A4 Standard', description: 'Full-size documents for formal receipts' },
  { value: 'thermal_80mm', label: '80mm Thermal', description: 'Standard POS thermal printer' },
  { value: 'thermal_58mm', label: '58mm Thermal', description: 'Compact thermal printer' },
  { value: 'half_page', label: 'Half Page', description: 'A5 size for compact receipts' },
];

export const ReceiptDocuments = ({ config, onUpdate, loading }: ReceiptDocumentsProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(config);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onUpdate(formData);
      if (success) {
        toast({
          title: "Document Settings Saved",
          description: "Receipt and document settings have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save document settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof HotelConfiguration['documents'], value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateNextInvoiceNumber = () => {
    const currentYear = new Date().getFullYear();
    return `${formData.invoice_prefix}-${currentYear}-001`;
  };

  const generateNextReceiptNumber = () => {
    const currentYear = new Date().getFullYear();
    return `${formData.receipt_prefix}-${currentYear}-001`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Receipts & Documents</h3>
        <p className="text-sm text-muted-foreground">
          Configure receipt templates, numbering, and document settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Receipt Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Receipt Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Default Template</Label>
              <Select
                value={formData.default_receipt_template}
                onValueChange={(value: any) => updateField('default_receipt_template', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_TEMPLATES.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      <div className="space-y-1">
                        <div className="font-medium">{template.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Template Preview</Label>
              <div className="mt-2">
                {formData.default_receipt_template === 'A4' && (
                  <div className="w-full h-32 bg-white border rounded flex items-center justify-center">
                    <div className="text-center text-sm text-gray-600">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      A4 Standard Receipt
                      <div className="text-xs">210mm × 297mm</div>
                    </div>
                  </div>
                )}
                {formData.default_receipt_template.includes('thermal') && (
                  <div className="w-24 h-32 bg-white border rounded flex items-center justify-center">
                    <div className="text-center text-xs text-gray-600">
                      <FileText className="h-6 w-6 mx-auto mb-1" />
                      Thermal
                      <div className="text-xs">
                        {formData.default_receipt_template === 'thermal_80mm' ? '80mm' : '58mm'}
                      </div>
                    </div>
                  </div>
                )}
                {formData.default_receipt_template === 'half_page' && (
                  <div className="w-3/4 h-24 bg-white border rounded flex items-center justify-center">
                    <div className="text-center text-sm text-gray-600">
                      <FileText className="h-6 w-6 mx-auto mb-1" />
                      Half Page (A5)
                      <div className="text-xs">148mm × 210mm</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Numbering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Numbering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                <Input
                  id="invoice_prefix"
                  value={formData.invoice_prefix}
                  onChange={(e) => updateField('invoice_prefix', e.target.value)}
                  placeholder="GP-INV"
                />
                <p className="text-xs text-muted-foreground">
                  Next: {generateNextInvoiceNumber()}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt_prefix">Receipt Prefix</Label>
                <Input
                  id="receipt_prefix"
                  value={formData.receipt_prefix}
                  onChange={(e) => updateField('receipt_prefix', e.target.value)}
                  placeholder="GP-RCP"
                />
                <p className="text-xs text-muted-foreground">
                  Next: {generateNextReceiptNumber()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Additional Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="digital_signature">Digital Signature</Label>
                <p className="text-sm text-muted-foreground">
                  Include digital signature on official documents
                </p>
              </div>
              <Switch
                id="digital_signature"
                checked={formData.digital_signature_enabled}
                onCheckedChange={(checked) => updateField('digital_signature_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="include_qr">QR Code on Receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Include QR code for payment verification and feedback
                </p>
              </div>
              <Switch
                id="include_qr"
                checked={formData.include_qr_code}
                onCheckedChange={(checked) => updateField('include_qr_code', checked)}
              />
            </div>

            {formData.include_qr_code && (
              <div className="ml-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">QR Code Features</span>
                </div>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Payment verification link</li>
                  <li>• Guest feedback portal</li>
                  <li>• Transaction details lookup</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Document Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Receipt Format</h4>
                <div className="text-sm space-y-1 font-mono bg-gray-50 p-3 rounded">
                  <div className="text-center font-bold">GRAND PALACE LAGOS</div>
                  <div className="text-center text-xs">123 Victoria Island, Lagos</div>
                  <div className="text-center text-xs">Tel: +234 123 456 7890</div>
                  <div className="border-t my-2"></div>
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span>{generateNextReceiptNumber()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>19/01/2025</span>
                  </div>
                  <div className="border-t my-2"></div>
                  <div>Room Service ........... ₦15,000</div>
                  <div>VAT (7.5%) .............. ₦1,125</div>
                  <div className="border-t my-1"></div>
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span>₦16,125</span>
                  </div>
                  <div className="text-center text-xs mt-2">
                    Thank you for choosing Grand Palace Lagos
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Invoice Format</h4>
                <div className="text-sm space-y-1 font-mono bg-gray-50 p-3 rounded">
                  <div className="text-center font-bold">INVOICE</div>
                  <div className="text-center">{generateNextInvoiceNumber()}</div>
                  <div className="border-t my-2"></div>
                  <div>Guest: John Smith</div>
                  <div>Room: 205</div>
                  <div>Stay: 15/01 - 18/01/2025</div>
                  <div className="border-t my-2"></div>
                  <div>Room Charges (3 nights) .. ₦75,000</div>
                  <div>Room Service ............. ₦12,500</div>
                  <div>Extra Towels ............ ₦2,000</div>
                  <div className="border-t my-1"></div>
                  <div>Subtotal ................ ₦89,500</div>
                  <div>VAT (7.5%) .............. ₦6,713</div>
                  <div className="border-t my-1"></div>
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span>₦96,213</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="min-w-32"
        >
          {saving ? 'Saving...' : 'Save Document Settings'}
        </Button>
      </div>
    </div>
  );
};