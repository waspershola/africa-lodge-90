import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, LogIn, Mail, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useMultiTenantAuth';
import { ForgotPasswordDialog } from './ForgotPasswordDialog';
import { supabaseApi } from '@/lib/supabase-api';
import { useAuditLog } from '@/hooks/useAuditLog';
import { AuthAlert, InlineError } from '@/components/ui/auth-alert';
import { AuthErrorHandler } from '@/lib/errorHandler';
import { AuthError, FormErrors } from '@/types/auth-errors';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onSuccess?: () => void;
  showCard?: boolean;
  compact?: boolean;
}

export function LoginForm({ onSuccess, showCard = true, compact = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { logEvent } = useAuditLog();
  const security = useAuthSecurity({
    maxFailedAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    rateLimitWindow: 5,
  });

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    const emailError = AuthErrorHandler.validateEmail(email);
    if (emailError) {
      errors[emailError.field] = emailError.message;
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for account lockout
    if (security.isAccountLocked()) {
      const timeRemaining = security.formatTimeRemaining();
      setAuthError({
        code: 'RATE_LIMITED',
        message: `Account temporarily locked. Try again in ${timeRemaining}.`,
        retryAfter: security.getTimeUntilUnlock(),
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    setFormErrors({});

    try {
      // Detect suspicious activity
      const suspiciousCheck = security.detectSuspiciousActivity(email);
      if (suspiciousCheck.suspicious) {
        console.warn('Suspicious login activity detected:', suspiciousCheck.reasons);
      }

      await login(email, password);
      
      // Record successful login
      await security.recordSuccessfulLogin(email);
      
      AuthErrorHandler.showSuccessToast('Welcome back!', '✅ Login Successful');
      onSuccess?.();
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Record failed attempt with security tracking
      await security.recordFailedAttempt(email, err.message || 'Unknown error');
      
      const authError = AuthErrorHandler.parseSupabaseError(err);
      setAuthError(authError);
      AuthErrorHandler.showErrorToast(authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await supabaseApi.auth.resetPassword(email);
      await logEvent({ 
        action: 'PASSWORD_RESET_REQUESTED',
        resource_type: 'AUTH',
        metadata: { email }
      });
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send password reset email' 
      };
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
        <AuthAlert 
          error={authError} 
          onRetry={() => {
            setAuthError(null);
            security.resetSecurityMetrics();
          }}
          onContactSupport={() => {
            window.location.href = '/support';
          }}
        />
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) {
                setFormErrors(prev => ({ ...prev, email: '' }));
              }
            }}
            placeholder="Enter your email"
            required
              disabled={isLoading || security.isAccountLocked()}
              className={cn(
                "pl-9",
                formErrors.email && 'border-destructive focus-visible:ring-destructive',
                authError?.code === 'INVALID_CREDENTIALS' && 'animate-pulse'
              )}
            autoComplete="email"
          />
        </div>
        <InlineError error={formErrors.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
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
            placeholder="Enter your password"
            required
            disabled={isLoading || security.isAccountLocked()}
            className={cn(
              "pl-9 pr-10",
              formErrors.password && 'border-destructive focus-visible:ring-destructive',
              authError?.code === 'INVALID_CREDENTIALS' && 'animate-pulse'
            )}
            autoComplete="current-password"
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
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        <InlineError error={formErrors.password} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="link"
          className={cn(
            "px-0 font-normal text-sm transition-colors",
            (authError?.code === 'INVALID_CREDENTIALS' || authError?.code === 'USER_NOT_FOUND') && 
            'text-primary font-medium animate-pulse'
          )}
          onClick={() => setShowForgotPassword(true)}
        >
          Forgot your password?
        </Button>
        
            {security.metrics.failedAttempts > 0 && security.metrics.failedAttempts < 5 && (
              <span className="text-xs text-muted-foreground">
                {5 - security.metrics.failedAttempts} attempts remaining
              </span>
            )}
            
            {security.isAccountLocked() && (
              <span className="text-xs text-destructive font-medium">
                Account locked for {security.formatTimeRemaining()}
              </span>
            )}
      </div>

      <Button 
        type="submit" 
        className="w-full font-semibold" 
        disabled={isLoading || security.isAccountLocked() || Object.keys(formErrors).length > 0}
        size={compact ? "sm" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : security.isAccountLocked() ? (
          `Locked (${security.formatTimeRemaining()})`
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>

      {!compact && (
        <div className="text-center space-y-3 mt-6">
          {/* Emergency Access Portal Link */}
          <div className="border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/emergency-access-portal'}
              disabled={isLoading}
              className="text-xs gap-2 text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <Shield className="h-3 w-3" />
              Platform Owner Emergency Access
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              For platform owners who cannot access their accounts
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button variant="link" className="p-0 h-auto text-xs">
              Request a demo
            </Button>
          </div>
        </div>
      )}
    </form>
  );

  if (!showCard) {
    return form;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-serif">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {form}
        <ForgotPasswordDialog
          open={showForgotPassword}
          onOpenChange={setShowForgotPassword}
        />
      </CardContent>
    </Card>
  );
}