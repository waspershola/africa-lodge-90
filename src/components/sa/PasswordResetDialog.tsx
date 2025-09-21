import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { TenantWithOwner } from '@/services/tenantService';

interface PasswordResetDialogProps {
  tenant: TenantWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  isLoading?: boolean;
}

export function PasswordResetDialog({ 
  tenant, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: PasswordResetDialogProps) {
  const [confirmation, setConfirmation] = useState('');

  const handleSubmit = () => {
    if (!tenant?.owner_email || confirmation !== tenant.owner_email) return;
    onConfirm(tenant.owner_email);
  };

  const isFormValid = confirmation === tenant?.owner_email;

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-500" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Generate a temporary password for <strong>{tenant.owner_name || 'the owner'}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This will force the user to change their password on next login.
            A temporary password will be sent via email.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">{tenant.owner_name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground">{tenant.owner_email}</div>
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
            className="flex-1"
          >
            {isLoading ? 'Sending...' : 'Reset Password'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}