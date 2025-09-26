import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Mail, Lock, User, Eye, EyeOff, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthAlert, InlineError } from '@/components/ui/auth-alert';
import { PasswordStrength } from '@/components/ui/password-strength';
import { AuthErrorHandler } from '@/lib/errorHandler';
import { AuthError, FormErrors } from '@/types/auth-errors';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SignupFormProps {
  inviteToken?: string;
  onSuccess?: () => void;
  showCard?: boolean;
  compact?: boolean;
}

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

export function SignupForm({ 
  inviteToken, 
  onSuccess, 
  showCard = true, 
  compact = false 
}: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organization: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);
  const { toast } = useToast();

  // Validate invite token on mount
  useEffect(() => {
    if (inviteToken) {
      validateInviteToken();
    }
  }, [inviteToken]);

  const validateInviteToken = async () => {
    setIsValidatingInvite(true);
    try {
      // Validate invite token logic would go here
      // For now, assume valid
      setInviteData({ valid: true, organization: 'Invited Organization' });
    } catch (error: any) {
      setAuthError(AuthErrorHandler.createError('INVITE_EXPIRED'));
    } finally {
      setIsValidatingInvite(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Email validation
    const emailError = AuthErrorHandler.validateEmail(formData.email);
    if (emailError) {
      errors[emailError.field] = emailError.message;
    }
    
    // Password validation
    const passwordError = AuthErrorHandler.validatePassword(formData.password);
    if (passwordError) {
      errors[passwordError.field] = passwordError.message;
    }
    
    // Confirm password validation
    const confirmError = AuthErrorHandler.validatePasswordConfirmation(
      formData.password, 
      formData.confirmPassword
    );
    if (confirmError) {
      errors[confirmError.field] = confirmError.message;
    }
    
    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof SignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            organization: formData.organization,
            invite_token: inviteToken
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) {
        const authError = AuthErrorHandler.parseSupabaseError(error);
        setAuthError(authError);
        AuthErrorHandler.showErrorToast(authError);
      } else {
        AuthErrorHandler.showSuccessToast(
          'Please check your email to verify your account.',
          '📧 Account Created Successfully'
        );
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      const authError = AuthErrorHandler.parseSupabaseError(err);
      setAuthError(authError);
      AuthErrorHandler.showErrorToast(authError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingInvite) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </div>
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

      {inviteData && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-medium">You're invited to join</span>
            <span className="text-primary font-semibold">{inviteData.organization}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            First Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="John"
              required
              disabled={isLoading}
              className={cn(
                "pl-9",
                formErrors.firstName && 'border-destructive focus-visible:ring-destructive'
              )}
              autoComplete="given-name"
            />
          </div>
          <InlineError error={formErrors.firstName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Last Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Doe"
              required
              disabled={isLoading}
              className={cn(
                "pl-9",
                formErrors.lastName && 'border-destructive focus-visible:ring-destructive'
              )}
              autoComplete="family-name"
            />
          </div>
          <InlineError error={formErrors.lastName} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john@example.com"
            required
            disabled={isLoading || !!inviteToken}
            className={cn(
              "pl-9",
              formErrors.email && 'border-destructive focus-visible:ring-destructive'
            )}
            autoComplete="email"
          />
        </div>
        <InlineError error={formErrors.email} />
      </div>

      {!inviteToken && (
        <div className="space-y-2">
          <Label htmlFor="organization" className="text-sm font-medium">
            Organization <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="organization"
              type="text"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              placeholder="Your Hotel or Company"
              disabled={isLoading}
              className="pl-9"
              autoComplete="organization"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a strong password"
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
        {formData.password && (
          <PasswordStrength password={formData.password} className="mt-2" />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
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
        size={compact ? "sm" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Account
          </>
        )}
      </Button>

      {!compact && (
        <div className="text-center space-y-3 mt-6">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => window.location.href = '/auth?tab=login'}
            >
              Sign in instead
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Button variant="link" className="p-0 h-auto text-xs">
              Terms of Service
            </Button>{' '}
            and{' '}
            <Button variant="link" className="p-0 h-auto text-xs">
              Privacy Policy
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
        <CardTitle className="text-2xl text-center font-serif">
          {inviteToken ? 'Complete Your Invitation' : 'Create Your Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {inviteToken 
            ? 'Fill in your details to join the platform'
            : 'Get started with your luxury hotel management platform'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {form}
      </CardContent>
    </Card>
  );
}