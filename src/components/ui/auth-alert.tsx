import { AlertCircle, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AuthError, AuthErrorCode } from '@/types/auth-errors';
import { cn } from '@/lib/utils';

interface AuthAlertProps {
  error?: AuthError | null;
  success?: string | null;
  className?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showAnimation?: boolean;
}

const ERROR_VARIANTS: Record<AuthErrorCode, {
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'destructive';
  bgColor: string;
  textColor: string;
}> = {
  INVALID_CREDENTIALS: { icon: XCircle, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
  USER_NOT_FOUND: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
  ACCOUNT_INACTIVE: { icon: Shield, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  ACCOUNT_SUSPENDED: { icon: Shield, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
  EMAIL_ALREADY_EXISTS: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  INVALID_TOKEN: { icon: XCircle, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
  TOKEN_EXPIRED: { icon: Clock, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  WEAK_PASSWORD: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  PASSWORD_MISMATCH: { icon: XCircle, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
  MISSING_FIELD: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  INVALID_EMAIL: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  RATE_LIMITED: { icon: Clock, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  INVITE_EXPIRED: { icon: Clock, variant: 'destructive', bgColor: 'bg-warning/10', textColor: 'text-warning' },
  SERVER_ERROR: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
  NETWORK_ERROR: { icon: AlertCircle, variant: 'destructive', bgColor: 'bg-destructive/10', textColor: 'text-destructive' },
};

export function AuthAlert({
  error,
  success,
  className,
  onRetry,
  onContactSupport,
  showAnimation = true,
}: AuthAlertProps) {
  if (!error && !success) return null;

  if (success) {
    return (
      <Alert
        className={cn(
          'border-success/20 bg-success/10 text-success mb-4 transition-all duration-300',
          showAnimation && 'animate-fade-in',
          className
        )}
      >
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success font-medium">
          {success}
        </AlertDescription>
      </Alert>
    );
  }

  if (!error) return null;

  const config = ERROR_VARIANTS[error.code];
  const IconComponent = config.icon;

  return (
    <Alert
      className={cn(
        'mb-4 transition-all duration-300 border-l-4',
        config.bgColor,
        config.textColor,
        showAnimation && 'animate-fade-in',
        className
      )}
      variant={config.variant}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.textColor)} />
        <div className="flex-1 space-y-2">
          <AlertDescription className={cn('font-medium', config.textColor)}>
            {error.message}
          </AlertDescription>
          
          {error.details && (
            <p className={cn('text-sm opacity-80', config.textColor)}>
              {error.details}
            </p>
          )}

          {error.retryAfter && (
            <p className={cn('text-sm opacity-80', config.textColor)}>
              Please wait {error.retryAfter} seconds before trying again.
            </p>
          )}

          <div className="flex gap-2 mt-3">
            {onRetry && ['SERVER_ERROR', 'NETWORK_ERROR'].includes(error.code) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                Try Again
              </Button>
            )}

            {error.supportContact && onContactSupport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onContactSupport}
                className="text-xs"
              >
                Contact Support
              </Button>
            )}

            {error.code === 'USER_NOT_FOUND' && (
              <Button
                variant="link"
                size="sm"
                className="text-xs p-0"
                onClick={() => window.location.href = '/auth?tab=signup'}
              >
                Create Account Instead
              </Button>
            )}

            {['TOKEN_EXPIRED', 'INVITE_EXPIRED'].includes(error.code) && (
              <Button
                variant="link"
                size="sm"
                className="text-xs p-0"
                onClick={() => window.location.href = '/auth/forgot-password'}
              >
                Request New Link
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

interface InlineErrorProps {
  error?: string | null;
  className?: string;
  showIcon?: boolean;
}

export function InlineError({ error, className, showIcon = true }: InlineErrorProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-destructive mt-1 animate-fade-in',
        className
      )}
    >
      {showIcon && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      <span>{error}</span>
    </div>
  );
}

interface SuccessMessageProps {
  message?: string | null;
  className?: string;
}

export function SuccessMessage({ message, className }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-success mt-1 animate-fade-in',
        className
      )}
    >
      <CheckCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}