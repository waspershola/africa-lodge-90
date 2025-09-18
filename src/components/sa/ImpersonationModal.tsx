import { useState } from 'react';
import { AlertTriangle, User, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
  assignedTenants?: string[];
}

interface ImpersonationModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; durationMinutes: number }) => void;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' }
];

export default function ImpersonationModal({ 
  user, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: ImpersonationModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(15);
  const [confirmText, setConfirmText] = useState('');

  const handleSubmit = () => {
    if (!reason.trim() || confirmText !== user?.email) return;
    
    onConfirm({ 
      reason: reason.trim(), 
      durationMinutes: duration 
    });
    
    // Reset form
    setReason('');
    setDuration(15);
    setConfirmText('');
  };

  const isFormValid = reason.trim().length >= 10 && confirmText === user?.email;

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Impersonate User
          </DialogTitle>
          <DialogDescription>
            You are about to impersonate another user. This action will be logged and monitored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="bg-muted/30 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant="secondary">{user.department}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Notice */}
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning mb-1">Security Notice</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• This session will be time-limited and automatically expire</li>
                  <li>• All actions performed will be logged and audited</li>
                  <li>• The user will be notified of this impersonation session</li>
                  <li>• You can stop impersonation at any time</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Impersonation *
              </Label>
              <Textarea
                id="reason"
                placeholder="Explain why you need to impersonate this user (minimum 10 characters)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reason.length}/10 characters minimum
              </p>
            </div>

            <div>
              <Label htmlFor="duration" className="text-sm font-medium">
                Session Duration
              </Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="confirmEmail" className="text-sm font-medium">
                Confirm User Email *
              </Label>
              <Input
                id="confirmEmail"
                placeholder={`Type "${user.email}" to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Type the user's email address to confirm impersonation
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Starting Impersonation...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Start Impersonation
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}