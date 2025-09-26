import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Eye, EyeOff, CheckCircle, Key } from 'lucide-react';
import { useAuth } from '@/hooks/useMultiTenantAuth';
import { AuthAlert, InlineError } from '@/components/ui/auth-alert';
import { PasswordStrength } from '@/components/ui/password-strength';
import { AuthErrorHandler } from '@/lib/errorHandler';
import { AuthError, FormErrors } from '@/types/auth-errors';
import { cn } from '@/lib/utils';

interface PasswordResetFormProps {
  token?: string;
  onSuccess?: () => void;
  showCard?: boolean;
}

export function PasswordResetForm({ 
  token, 
  onSuccess, 
  showCard = true 
}: PasswordResetFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  // Validate token on mount
  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setAuthError(AuthErrorHandler.createError('INVALID_TOKEN'));
      setIsValidToken(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      // Token validation logic would go here
      // For now, assume valid if token exists
      setIsValidToken(true);
    } catch (error: any) {
      setAuthError(AuthErrorHandler.createError('TOKEN_EXPIRED'));
      setIsValidToken(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Password validation
    const passwordError = AuthErrorHandler.validatePassword(password);
    if (passwordError) {
      errors[passwordError.field] = passwordError.message;
    }
    
    // Confirm password validation
    const confirmError = AuthErrorHandler.validatePasswordConfirmation(
      password, 
      confirmPassword
    );
    if (confirmError) {
      errors[confirmError.field] = confirmError.message;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setFormErrors({});

    try {
      // Call reset password function
      await resetPassword(password);
      
      setSuccess(true);
      AuthErrorHandler.showSuccessToast(
        'Your password has been updated successfully. You can now sign in.',
        '✅ Password Reset Complete'
      );
      
      // Redirect to login after success
      setTimeout(() => {
        onSuccess?.();
        window.location.href = '/auth?tab=login';
      }, 2000);
      
    } catch (err: any) {
      console.error('Password reset error:', err);
      const authError = AuthErrorHandler.parseSupabaseError(err);
      setAuthError(authError);
      AuthErrorHandler.showErrorToast(authError);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Validating reset link...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Invalid token state
  if (isValidToken === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-serif text-destructive">
            Invalid Reset Link
          </CardTitle>
          <CardDescription className="text-center">
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthAlert error={authError} />
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Password reset links expire after 1 hour for security reasons.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth/forgot-password'}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-12">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Password Reset Successful!</h3>
          <p className="text-muted-foreground mb-6">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Button 
            onClick={() => window.location.href = '/auth?tab=login'}
            className="w-full"
          >
            Continue to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthAlert 
        error={authError}
        onRetry={() => {
          setAuthError(null);
          setFormErrors({});
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formErrors.password) {
                setFormErrors(prev => ({ ...prev, password: '' }));
              }
            }}
            placeholder="Enter your new password"
            required
            disabled={isLoading}
            className={cn(
              "pl-9 pr-10",
              formErrors.password && 'border-destructive focus-visible:ring-destructive'
            )}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <InlineError error={formErrors.password} />
        {password && (
          <PasswordStrength password={password} className="mt-2" />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formErrors.confirmPassword) {
                setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
              }
            }}
            placeholder="Confirm your new password"
            required
            disabled={isLoading}
            className={cn(
              "pl-9 pr-10",
              formErrors.confirmPassword && 'border-destructive focus-visible:ring-destructive'
            )}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <InlineError error={formErrors.confirmPassword} />
      </div>

      <Button 
        type="submit" 
        className="w-full font-semibold" 
        disabled={isLoading || Object.keys(formErrors).length > 0}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            <Key className="mr-2 h-4 w-4" />
            Update Password
          </>
        )}
      </Button>

      <div className="text-center">
        <Button 
          variant="link" 
          type="button"
          onClick={() => window.location.href = '/auth?tab=login'}
          className="text-sm"
        >
          Back to Sign In
        </Button>
      </div>
    </form>
  );

  if (!showCard) {
    return form;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-serif">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        {form}
      </CardContent>
    </Card>
  );
}