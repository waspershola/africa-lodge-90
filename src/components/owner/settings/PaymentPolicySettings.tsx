import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { usePaymentPolicies, useCreatePaymentPolicy, useUpdatePaymentPolicy, CreatePaymentPolicyData } from '@/hooks/usePaymentPolicies';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useToast } from '@/hooks/use-toast';

interface PaymentPolicyFormData extends CreatePaymentPolicyData {
  id?: string;
}

export default function PaymentPolicySettings() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PaymentPolicyFormData | null>(null);
  const [formData, setFormData] = useState<PaymentPolicyFormData>({
    policy_name: '',
    deposit_percentage: 30,
    payment_timing: 'at_booking',
    requires_deposit: true,
    auto_cancel_hours: 24,
    payment_methods_accepted: ['cash', 'card'],
    late_payment_fee: 0,
    is_default: false
  });

  const { data: policies = [], isLoading } = usePaymentPolicies();
  const { enabledMethods, getMethodIcon } = usePaymentMethods();
  const createPolicy = useCreatePaymentPolicy();
  const updatePolicy = useUpdatePaymentPolicy();
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      policy_name: '',
      deposit_percentage: 30,
      payment_timing: 'at_booking',
      requires_deposit: true,
      auto_cancel_hours: 24,
      payment_methods_accepted: ['cash', 'card'],
      late_payment_fee: 0,
      is_default: false
    });
    setEditingPolicy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPolicy?.id) {
        await updatePolicy.mutateAsync({
          id: editingPolicy.id,
          ...formData
        });
      } else {
        await createPolicy.mutateAsync(formData);
      }
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save payment policy:', error);
    }
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setFormData({
      id: policy.id,
      policy_name: policy.policy_name,
      deposit_percentage: policy.deposit_percentage,
      payment_timing: policy.payment_timing,
      requires_deposit: policy.requires_deposit,
      auto_cancel_hours: policy.auto_cancel_hours,
      payment_methods_accepted: Array.isArray(policy.payment_methods_accepted) 
        ? policy.payment_methods_accepted 
        : JSON.parse(policy.payment_methods_accepted || '[]'),
      late_payment_fee: policy.late_payment_fee,
      is_default: policy.is_default
    });
    setShowDialog(true);
  };

  const handleMethodToggle = (methodId: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods_accepted: prev.payment_methods_accepted.includes(methodId)
        ? prev.payment_methods_accepted.filter(m => m !== methodId)
        : [...prev.payment_methods_accepted, methodId]
    }));
  };

  if (isLoading) {
    return <div className="p-6">Loading payment policies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Policies</h2>
          <p className="text-muted-foreground">
            Configure payment requirements and policies for reservations
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy ? 'Edit Payment Policy' : 'Create Payment Policy'}
              </DialogTitle>
              <DialogDescription>
                Define payment requirements and accepted methods for reservations.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="policy_name">Policy Name</Label>
                  <Input
                    id="policy_name"
                    value={formData.policy_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, policy_name: e.target.value }))}
                    placeholder="e.g., Standard Policy"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_timing">Payment Timing</Label>
                  <Select 
                    value={formData.payment_timing} 
                    onValueChange={(value: 'at_booking' | 'at_checkin' | 'flexible') => 
                      setFormData(prev => ({ ...prev, payment_timing: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="at_booking">At Booking</SelectItem>
                      <SelectItem value="at_checkin">At Check-in</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_deposit"
                  checked={formData.requires_deposit}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_deposit: checked }))}
                />
                <Label htmlFor="requires_deposit">Require deposit payment</Label>
              </div>

              {formData.requires_deposit && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="deposit_percentage">Deposit Percentage</Label>
                    <Input
                      id="deposit_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.deposit_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, deposit_percentage: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto_cancel_hours">Auto-cancel after (hours)</Label>
                    <Input
                      id="auto_cancel_hours"
                      type="number"
                      min="0"
                      value={formData.auto_cancel_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, auto_cancel_hours: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Accepted Payment Methods</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {enabledMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <Switch
                        id={method.id}
                        checked={formData.payment_methods_accepted.includes(method.id)}
                        onCheckedChange={() => handleMethodToggle(method.id)}
                      />
                      <Label htmlFor={method.id} className="flex items-center gap-2">
                        {method.icon}
                        {method.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="late_payment_fee">Late Payment Fee (₦)</Label>
                <Input
                  id="late_payment_fee"
                  type="number"
                  min="0"
                  value={formData.late_payment_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, late_payment_fee: Number(e.target.value) }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Set as default policy</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPolicy.isPending || updatePolicy.isPending}>
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {policy.policy_name}
                    {policy.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {policy.requires_deposit ? (
                      `${policy.deposit_percentage}% deposit required ${policy.payment_timing.replace('_', ' ')}`
                    ) : (
                      `No deposit required • Payment ${policy.payment_timing.replace('_', ' ')}`
                    )}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!policy.is_default && (
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Payment Methods</div>
                    <div className="text-xs text-muted-foreground">
                      {Array.isArray(policy.payment_methods_accepted) 
                        ? policy.payment_methods_accepted.join(', ')
                        : JSON.parse(policy.payment_methods_accepted || '[]').join(', ')}
                    </div>
                  </div>
                </div>

                {policy.auto_cancel_hours > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Auto-cancel</div>
                      <div className="text-xs text-muted-foreground">
                        After {policy.auto_cancel_hours} hours
                      </div>
                    </div>
                  </div>
                )}

                {policy.late_payment_fee > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Late Fee</div>
                      <div className="text-xs text-muted-foreground">
                        ₦{policy.late_payment_fee.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {policies.length === 0 && (
          <Card className="text-center p-12">
            <CardContent>
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment Policies</h3>
              <p className="text-muted-foreground mb-4">
                Create your first payment policy to start accepting reservations with specific payment requirements.
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Policy
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}