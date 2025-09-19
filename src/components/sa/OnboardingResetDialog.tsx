import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RotateCcw, 
  User, 
  Building2, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: {
    tenant_id: string;
    hotel_name: string;
    owner_email: string;
    subscription_status: string;
    setup_completed: boolean;
    onboarding_step?: string;
  };
}

export function OnboardingResetDialog({ 
  open, 
  onOpenChange, 
  tenant 
}: OnboardingResetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleReset = async () => {
    if (!tenant || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for resetting onboarding.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to reset onboarding
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would:
      // 1. Update tenant: setup_completed = false, onboarding_step = 'hotel_information'
      // 2. Clear any cached onboarding progress
      // 3. Send notification to owner
      // 4. Log the reset action in audit trail
      
      console.log('Onboarding reset:', {
        tenant_id: tenant.tenant_id,
        reason,
        reset_by: 'super_admin',
        timestamp: new Date().toISOString()
      });

      // Clear localStorage for this tenant (temporary solution)
      Object.keys(localStorage).forEach(key => {
        if (key.includes('onboarding_')) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: "Onboarding Reset Successfully",
        description: `${tenant.hotel_name}'s onboarding has been reset. Owner will need to complete setup again.`,
      });

      onOpenChange(false);
      setReason('');
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Unable to reset onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-warning" />
            <span>Reset Onboarding Process</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="border-warning/20 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>Warning:</strong> This action will reset the hotel's onboarding process. 
              The owner will need to complete the entire setup wizard again.
            </AlertDescription>
          </Alert>

          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Tenant Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Hotel Name</Label>
                  <div className="text-sm text-muted-foreground">{tenant.hotel_name}</div>
                </div>
                <div>
                  <Label className="font-medium">Owner Email</Label>
                  <div className="text-sm text-muted-foreground">{tenant.owner_email}</div>
                </div>
                <div>
                  <Label className="font-medium">Subscription Status</Label>
                  <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {tenant.subscription_status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Setup Status</Label>
                  <div className="flex items-center space-x-2">
                    {tenant.setup_completed ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Completed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-danger" />
                        <span className="text-sm text-danger">Incomplete</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {tenant.onboarding_step && (
                <div>
                  <Label className="font-medium flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Current Step</span>
                  </Label>
                  <div className="text-sm text-muted-foreground capitalize">
                    {tenant.onboarding_step.replace('_', ' ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reset Reason */}
          <div>
            <Label htmlFor="reset-reason">Reason for Reset *</Label>
            <Textarea
              id="reset-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the onboarding needs to be reset (e.g., configuration errors, owner request, system issues...)"
              className="mt-1"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              This reason will be logged in the audit trail and may be visible to the tenant owner.
            </p>
          </div>

          {/* Impact Notice */}
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800 text-base">Reset Impact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-700 space-y-2">
              <p>• All onboarding progress will be cleared</p>
              <p>• Owner will be redirected to step 1 on next login</p>
              <p>• Any saved configuration will be lost</p>
              <p>• Owner will receive a notification about the reset</p>
              <p>• This action is logged in the audit trail</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={loading || !reason.trim()}
            className="min-w-32"
          >
            {loading ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Onboarding
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}