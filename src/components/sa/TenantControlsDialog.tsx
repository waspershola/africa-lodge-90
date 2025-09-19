import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Calendar, 
  Ban, 
  CreditCard, 
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Tenant } from '@/types/tenant';
import { useToast } from '@/hooks/use-toast';

interface TenantControlsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant | null;
  onTenantUpdate: (tenant: Tenant) => void;
}

export function TenantControlsDialog({ 
  open, 
  onOpenChange, 
  tenant,
  onTenantUpdate
}: TenantControlsDialogProps) {
  const [activeTab, setActiveTab] = useState<'extend' | 'suspend' | 'plan'>('extend');
  const [loading, setLoading] = useState(false);
  const [extendDays, setExtendDays] = useState('14');
  const [extendReason, setExtendReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [planChangeReason, setPlanChangeReason] = useState('');
  const { toast } = useToast();

  const availablePlans = [
    { id: 'starter', name: 'Starter Plan', price: '$29/month' },
    { id: 'growth', name: 'Growth Plan', price: '$79/month' },
    { id: 'pro', name: 'Professional Plan', price: '$199/month' },
    { id: 'enterprise', name: 'Enterprise Plan', price: 'Custom' }
  ];

  if (!tenant) return null;

  const handleExtendTrial = async () => {
    if (!extendReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for extending the trial",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(extendDays));
      
      const updatedTenant = {
        ...tenant,
        trial_end: newTrialEnd.toISOString(),
        updated_at: new Date().toISOString()
      };
      
      onTenantUpdate(updatedTenant);
      
      toast({
        title: "Trial extended",
        description: `Trial extended by ${extendDays} days for ${tenant.hotel_name}`
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend trial",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendTenant = async () => {
    if (!suspendReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for suspension",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedTenant = {
        ...tenant,
        subscription_status: 'suspended' as const,
        updated_at: new Date().toISOString()
      };
      
      onTenantUpdate(updatedTenant);
      
      toast({
        title: "Tenant suspended",
        description: `${tenant.hotel_name} has been suspended`,
        variant: "destructive"
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend tenant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!newPlanId || !planChangeReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a plan and provide a reason",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedTenant = {
        ...tenant,
        plan_id: newPlanId,
        subscription_status: 'active' as const,
        updated_at: new Date().toISOString()
      };
      
      onTenantUpdate(updatedTenant);
      
      const planName = availablePlans.find(p => p.id === newPlanId)?.name;
      toast({
        title: "Plan changed",
        description: `${tenant.hotel_name} moved to ${planName}`
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'trialing': return 'bg-warning/10 text-warning border-warning/20';
      case 'expired': return 'bg-danger/10 text-danger border-danger/20';
      case 'suspended': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tenant Controls: {tenant.hotel_name}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2">
              Status: 
              <Badge className={getStatusColor(tenant.subscription_status)}>
                {tenant.subscription_status}
              </Badge>
              Plan: <Badge variant="outline">{tenant.plan_id}</Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'extend' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('extend')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Extend Trial
            </Button>
            <Button
              variant={activeTab === 'suspend' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('suspend')}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
            <Button
              variant={activeTab === 'plan' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab('plan')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
          </div>

          {/* Extend Trial Tab */}
          {activeTab === 'extend' && (
            <div className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Current trial ends: {tenant.trial_end ? new Date(tenant.trial_end).toLocaleDateString() : 'N/A'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="extend-days">Extend by (days)</Label>
                <Input
                  id="extend-days"
                  type="number"
                  min="1"
                  max="365"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="extend-reason">Reason for Extension</Label>
                <Textarea
                  id="extend-reason"
                  placeholder="e.g., Customer requested additional time for evaluation"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleExtendTrial} 
                className="w-full"
                disabled={loading || !extendReason.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extending Trial...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Extend Trial by {extendDays} Days
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Suspend Tenant Tab */}
          {activeTab === 'suspend' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Suspending this tenant will immediately lock all their dashboards and prevent access.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="suspend-reason">Reason for Suspension</Label>
                <Textarea
                  id="suspend-reason"
                  placeholder="e.g., Payment failure, terms violation, customer request"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSuspendTenant} 
                variant="destructive"
                className="w-full"
                disabled={loading || !suspendReason.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suspending...
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend Tenant
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Change Plan Tab */}
          {activeTab === 'plan' && (
            <div className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  Current plan: {tenant.plan_id} → Change to a different plan
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Select New Plan</Label>
                <Select value={newPlanId} onValueChange={setNewPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans
                      .filter(plan => plan.id !== tenant.plan_id)
                      .map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.price}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-reason">Reason for Plan Change</Label>
                <Textarea
                  id="plan-reason"
                  placeholder="e.g., Customer upgrade request, billing adjustment"
                  value={planChangeReason}
                  onChange={(e) => setPlanChangeReason(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleChangePlan} 
                className="w-full"
                disabled={loading || !newPlanId || !planChangeReason.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Plan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Change Plan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}