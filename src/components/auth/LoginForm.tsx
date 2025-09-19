import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { supabaseApi } from '@/lib/supabase-api';
import { useAuditLog } from '@/hooks/useAuditLog';

interface LoginFormProps {
  onSuccess?: () => void;
  showCard?: boolean;
  compact?: boolean;
}

export function LoginForm({ onSuccess, showCard = true, compact = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login } = useAuth();
  const auditLog = useAuditLog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the enhanced login function from auth provider (includes audit logging)
      await login(email, password);
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Call success callback
      onSuccess?.();
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      
      // Log failed attempt is handled in MultiTenantAuthProvider
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await supabaseApi.auth.resetPassword(email);
      await auditLog.logPasswordReset(email);
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
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="pl-9"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className="pl-9"
            autoComplete="current-password"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        size={compact ? "sm" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>

      {!compact && (
        <div className="text-center space-y-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowForgotPassword(true)}
            disabled={isLoading}
            className="text-xs"
          >
            Forgot your password?
          </Button>
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
        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to your account to continue
        </p>
      </CardHeader>
      <CardContent>
        {form}
      </CardContent>
    </Card>
  );
}