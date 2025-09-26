import { Loader2, Shield, Lock, Key, Mail, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

interface AuthLoadingStateProps {
  message: string;
  icon?: 'security' | 'auth' | 'key' | 'mail' | 'user';
  className?: string;
}

export function AuthLoadingState({ 
  message, 
  icon = 'auth', 
  className 
}: AuthLoadingStateProps) {
  const icons = {
    security: Shield,
    auth: Lock,
    key: Key,
    mail: Mail,
    user: User,
  };

  const IconComponent = icons[icon];

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <div className="w-6 h-6 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center">
                <LoadingSpinner size="sm" className="text-primary" />
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <p className="font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              Please wait a moment...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FormLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function FormLoadingOverlay({ 
  isLoading, 
  message = 'Processing...', 
  children 
}: FormLoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-3 text-sm font-medium">
            <LoadingSpinner size="sm" />
            {message}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgressDotsProps {
  count?: number;
  activeIndex?: number;
  className?: string;
}

export function ProgressDots({ 
  count = 3, 
  activeIndex = 0, 
  className 
}: ProgressDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            index === activeIndex 
              ? 'bg-primary scale-125' 
              : 'bg-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}