import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Mail, User, MapPin } from 'lucide-react';
import { Plan } from '@/types/tenant';
import { useTenantManagement, CreateTenantData } from '@/hooks/useTenantManagement';

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
}

export function CreateTenantDialog({ open, onOpenChange, plans }: CreateTenantDialogProps) {
  const [formData, setFormData] = useState<CreateTenantData>({
    hotel_name: '',
    location: '',
    plan_id: '',
    owner_email: '',
    owner_name: '',
    subscription_status: 'trialing',
    billing_provider: 'paystack'
  });
  
  const [isTrialing, setIsTrialing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createTenant } = useTenantManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hotel_name || !formData.owner_email || !formData.owner_name || !formData.plan_id) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tenantData: CreateTenantData = {
        ...formData,
        subscription_status: isTrialing ? 'trialing' : 'active',
        billing_provider: isTrialing ? undefined : formData.billing_provider
      };
      
      await createTenant(tenantData);
      
      // Reset form
      setFormData({
        hotel_name: '',
        location: '',
        plan_id: '',
        owner_email: '',
        owner_name: '',
        subscription_status: 'trialing',
        billing_provider: 'paystack'
      });
      setIsTrialing(true);
      
      onOpenChange(false);
    } catch (err) {
      setError('Failed to create tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateTenantData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedPlan = plans.find(p => p.plan_id === formData.plan_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription>
            Add a new hotel to the platform. Owner will receive an invitation email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Hotel Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Hotel Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Hotel Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hotel_name"
                    value={formData.hotel_name}
                    onChange={(e) => updateFormData('hotel_name', e.target.value)}
                    placeholder="Lagos Grand Hotel"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    placeholder="Lagos, Nigeria"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Owner Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="owner_name"
                    value={formData.owner_name}
                    onChange={(e) => updateFormData('owner_name', e.target.value)}
                    placeholder="John Doe"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="owner_email">Owner Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="owner_email"
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => updateFormData('owner_email', e.target.value)}
                    placeholder="owner@hotel.com"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Subscription Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan_id">Plan *</Label>
                <Select value={formData.plan_id} onValueChange={(value) => updateFormData('plan_id', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.plan_id} value={plan.plan_id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{plan.name}</span>
                          <span className="text-muted-foreground ml-2">
                            ₦{plan.price.toLocaleString()}/month
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedPlan && (
                  <div className="text-xs text-muted-foreground">
                    {selectedPlan.room_capacity_min}-{selectedPlan.room_capacity_max === 9999 ? '∞' : selectedPlan.room_capacity_max} rooms • 
                    {selectedPlan.is_trial_allowed ? ` ${selectedPlan.trial_duration_days}-day trial available` : ' No trial'}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Start with Trial</Label>
                  <div className="text-sm text-muted-foreground">
                    {isTrialing ? 'Hotel will start with free trial' : 'Hotel will be billed immediately'}
                  </div>
                </div>
                <Switch
                  checked={isTrialing}
                  onCheckedChange={setIsTrialing}
                  disabled={loading || !selectedPlan?.is_trial_allowed}
                />
              </div>

              {!isTrialing && (
                <div className="space-y-2">
                  <Label htmlFor="billing_provider">Billing Provider</Label>
                  <Select value={formData.billing_provider} onValueChange={(value) => updateFormData('billing_provider', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paystack">Paystack</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="manual">Manual Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tenant'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}