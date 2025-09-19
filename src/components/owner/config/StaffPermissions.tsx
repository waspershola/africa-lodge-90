import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { HotelConfiguration } from '@/types/configuration';
import { Shield, DollarSign, Percent, RefreshCw, Settings, AlertTriangle } from 'lucide-react';

interface StaffPermissionsProps {
  config: HotelConfiguration['permissions'];
  onUpdate: (updates: Partial<HotelConfiguration['permissions']>) => Promise<boolean>;
  loading: boolean;
}

export const StaffPermissions = ({ config, onUpdate, loading }: StaffPermissionsProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(config);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await onUpdate(formData);
      if (success) {
        toast({
          title: "Permissions Updated",
          description: "Staff permission settings have been saved.",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save permission settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof HotelConfiguration['permissions'], value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Staff Permissions Matrix</h3>
        <p className="text-sm text-muted-foreground">
          Define approval requirements and permission levels for different operations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Financial Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Controls
              <Badge variant="outline" className="ml-2">Owner Approval Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pricing_approval">Pricing Changes Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  All room rate and service price changes must be approved by owner
                </p>
              </div>
              <Switch
                id="pricing_approval"
                checked={formData.pricing_changes_require_approval}
                onCheckedChange={(checked) => updateField('pricing_changes_require_approval', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="service_price_approval">Service Price Edits Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Changes to restaurant, spa, and other service prices need approval
                </p>
              </div>
              <Switch
                id="service_price_approval"
                checked={formData.service_price_edits_require_approval}
                onCheckedChange={(checked) => updateField('service_price_edits_require_approval', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="manager_override">Manager Can Override Rates</Label>
                <p className="text-sm text-muted-foreground">
                  Allow managers to override room rates during booking (within limits)
                </p>
              </div>
              <Switch
                id="manager_override"
                checked={formData.manager_can_override_rates}
                onCheckedChange={(checked) => updateField('manager_can_override_rates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Approval Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Approval Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_threshold">Discount Approval Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">₦</span>
                  <Input
                    id="discount_threshold"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.discount_approval_threshold}
                    onChange={(e) => updateField('discount_approval_threshold', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Discounts above this amount require owner approval
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund_threshold">Refund Approval Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">₦</span>
                  <Input
                    id="refund_threshold"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.refund_approval_threshold}
                    onChange={(e) => updateField('refund_approval_threshold', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Refunds above this amount require owner approval
                </p>
              </div>
            </div>

            {/* Threshold Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Current Thresholds</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Discount limit (Manager):</span>
                  <span className="font-medium">{formatCurrency(formData.discount_approval_threshold)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refund limit (Manager):</span>
                  <span className="font-medium">{formatCurrency(formData.refund_approval_threshold)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permission Matrix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permission Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Action</th>
                    <th className="text-center py-2">Staff</th>
                    <th className="text-center py-2">Manager</th>
                    <th className="text-center py-2">Owner</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="py-3">Check-in / Check-out</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Process Payments</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Small Discounts (&lt; {formatCurrency(formData.discount_approval_threshold)})</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Large Discounts (≥ {formatCurrency(formData.discount_approval_threshold)})</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">{formData.pricing_changes_require_approval ? '⚠️' : '✅'}</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Pricing Changes</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">{formData.pricing_changes_require_approval ? '⚠️' : '✅'}</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Small Refunds (&lt; {formatCurrency(formData.refund_approval_threshold)})</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">✅</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Large Refunds (≥ {formatCurrency(formData.refund_approval_threshold)})</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">⚠️</td>
                    <td className="text-center">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3">System Configuration</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">❌</td>
                    <td className="text-center">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>✅ = Full Access</span>
                <span>⚠️ = Requires Approval</span>
                <span>❌ = No Access</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Security & Compliance</h4>
                <p className="text-sm text-amber-700 mt-1">
                  These permission settings help maintain financial controls and audit compliance. 
                  Changes to permissions are logged and can be reviewed in the audit section.
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  <strong>Recommendation:</strong> Keep approval requirements enabled for financial operations above significant thresholds.
                </p>
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
          {saving ? 'Saving...' : 'Save Permissions'}
        </Button>
      </div>
    </div>
  );
};