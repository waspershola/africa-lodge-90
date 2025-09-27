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
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuthAlert, InlineError } from '@/components/ui/auth-alert';
import { AuthErrorHandler } from '@/lib/errorHandler';
import { AuthError, FormErrors } from '@/types/auth-errors';
import { cn } from '@/lib/utils';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    const emailError = AuthErrorHandler.validateEmail(email);
    if (emailError) {
      errors[emailError.field] = emailError.message;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setAuthError(null);
    setFormErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSent(true);
      AuthErrorHandler.showSuccessToast(
        'Password reset instructions have been sent to your email.',
        '📧 Reset Link Sent'
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      const authError = AuthErrorHandler.parseSupabaseError(err);
      setAuthError(authError);
      AuthErrorHandler.showErrorToast(authError);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setAuthError(null);
    setFormErrors({});
    setSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            {sent 
              ? "Check your email for reset instructions"
              : "Enter your email address and we'll send you a reset link"
            }
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-success mx-auto" />
                <div>
                  <h3 className="font-semibold">Email sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent password reset instructions to {email}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthAlert 
              error={authError}
              onRetry={() => {
                setAuthError(null);
                setFormErrors({});
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={cn(
                    "pl-10",
                    formErrors.email && 'border-destructive focus-visible:ring-destructive'
                  )}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <InlineError error={formErrors.email} />
              <p className="text-xs text-muted-foreground">
                We'll send you a secure link to reset your password
              </p>
            </div>

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
                type="submit" 
                className="flex-1"
                disabled={loading || !email || Object.keys(formErrors).length > 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}