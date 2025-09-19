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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemporaryPasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userRole: string;
}

export function TemporaryPasswordResetDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userEmail, 
  userRole 
}: TemporaryPasswordResetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const [reason, setReason] = useState('');
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerate = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the password reset",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTempPassword = generateTempPassword();
      setTempPassword(newTempPassword);
      setGenerated(true);
      
      toast({
        title: "Temporary password generated",
        description: "The user will be required to reset on next login"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate temporary password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    toast({
      title: "Copied to clipboard",
      description: "Temporary password copied successfully"
    });
  };

  const handleClose = () => {
    setTempPassword('');
    setGenerated(false);
    setReason('');
    setExpiryHours('24');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Generate Temporary Password
          </DialogTitle>
          <DialogDescription>
            Generate a temporary password for {userEmail} ({userRole})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!generated ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Reset</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., User forgot password, security breach, etc."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expires in (hours)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    min="1"
                    max="168"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password will expire in {expiryHours} hours
                  </p>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  The user will receive an email with the temporary password and will be 
                  required to reset it upon next login.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate}
                  className="flex-1"
                  disabled={loading || !reason.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Password'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>

                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={tempPassword}
                        readOnly
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Important:</strong> This password expires in {expiryHours} hours. 
                    The user must reset it on their next login.
                  </AlertDescription>
                </Alert>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}