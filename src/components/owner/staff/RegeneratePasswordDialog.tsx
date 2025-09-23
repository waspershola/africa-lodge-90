import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  RotateCcw,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useStaffInvites } from '@/hooks/useStaffInvites';

interface RegeneratePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string;
}

export function RegeneratePasswordDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName
}: RegeneratePasswordDialogProps) {
  console.log('RegeneratePasswordDialog props:', { open, userId, userEmail, userName });
  const { resetUserPassword, isLoading } = useStaffInvites();
  const [result, setResult] = useState<{
    success: boolean;
    temp_password?: string;
    error?: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegenerate = async () => {
    console.log('handleRegenerate called for user:', userId, userName);
    try {
      console.log('About to call resetUserPassword...');
      const response = await resetUserPassword(userId);
      console.log('resetUserPassword response:', response);
      setResult(response);
      
      if (response.success) {
        toast.success(`New temporary password generated for ${userName}`);
      } else {
        toast.error(response.error || 'Failed to regenerate password');
      }
    } catch (error: any) {
      console.error('Error in handleRegenerate:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to regenerate password'
      });
      toast.error(error.message || 'Failed to regenerate password');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Password copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleClose = () => {
    setResult(null);
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Regenerate Access
          </DialogTitle>
          <DialogDescription>
            Generate a new temporary password for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will generate a new temporary password for <strong>{userEmail}</strong> and 
                  attempt to send it via email. The user will be required to change it on next login.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRegenerate} 
                  disabled={isLoading}
                  className="bg-gradient-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Generate New Password
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {result.success ? (
                <>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      New temporary password generated successfully for {userName}
                    </AlertDescription>
                  </Alert>

                  {result.temp_password && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Temporary Password
                        </CardTitle>
                        <CardDescription>
                          Share this password with {userName}. They will be required to change it on first login.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <code className="flex-1 font-mono text-sm">
                            {showPassword ? result.temp_password : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.temp_password!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Password expires in 24 hours
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.error || 'Failed to generate new password'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Done
                </Button>
                {!result.success && (
                  <Button onClick={handleRegenerate} disabled={isLoading}>
                    Try Again
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}