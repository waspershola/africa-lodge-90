import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, AlertTriangle, Clock } from 'lucide-react';
import type { TenantWithOwner } from '@/services/tenantService';

interface ImpersonationModalProps {
  tenant: TenantWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: {
    userId: string;
    reason: string;
    duration: number;
  }) => void;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
];

export function ImpersonationModal({ 
  tenant, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: ImpersonationModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(60);
  const [confirmation, setConfirmation] = useState('');

  const handleSubmit = () => {
    if (!tenant?.owner_id || !isFormValid) return;
    
    onConfirm({
      userId: tenant.owner_id,
      reason,
      duration,
    });
  };

  const isFormValid = reason.length >= 10 && confirmation === tenant?.owner_email;

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-orange-500" />
            Impersonate User
          </DialogTitle>
          <DialogDescription>
            You're about to impersonate <strong>{tenant.owner_name || 'the owner'}</strong> for <strong>{tenant.hotel_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Security Warning:</strong> All actions will be logged and audited. 
            Use impersonation only for legitimate support purposes.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">{tenant.owner_name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground">{tenant.owner_email}</div>
            <div className="text-xs text-muted-foreground">Role: Owner</div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Impersonation</Label>
            <Input
              id="reason"
              placeholder="Provide a detailed reason (min 10 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={reason.length > 0 && reason.length < 10 ? 'border-red-300' : ''}
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-xs text-red-600">Reason must be at least 10 characters</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Session Duration</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type the user's email to confirm: <code className="text-xs">{tenant.owner_email}</code>
            </Label>
            <Input
              id="confirmation"
              placeholder="Enter email to confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={confirmation.length > 0 && confirmation !== tenant.owner_email ? 'border-red-300' : ''}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isLoading}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Starting...' : 'Start Impersonation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}