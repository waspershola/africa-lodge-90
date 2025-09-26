import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineError, SuccessMessage } from '@/components/ui/auth-alert';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  success?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
  showPasswordToggle?: boolean;
  onPasswordToggle?: (show: boolean) => void;
  showingPassword?: boolean;
  description?: string;
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    label, 
    error, 
    success,
    icon: Icon,
    showPasswordToggle = false,
    onPasswordToggle,
    showingPassword = false,
    description,
    type,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${React.useId()}`;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    
    const actualType = showPasswordToggle && showingPassword ? 'text' : type;
    
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
          </Label>
        )}
        
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          )}
          
          <Input
            id={inputId}
            ref={ref}
            type={actualType}
            className={cn(
              Icon && 'pl-9',
              showPasswordToggle && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              success && 'border-success focus-visible:ring-success',
              className
            )}
            aria-describedby={description ? descriptionId : undefined}
            aria-invalid={!!error}
            aria-errormessage={error ? errorId : undefined}
            {...props}
          />
          
          {showPasswordToggle && onPasswordToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => onPasswordToggle(!showingPassword)}
              tabIndex={-1}
            >
              {showingPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showingPassword ? 'Hide password' : 'Show password'}
              </span>
            </Button>
          )}
        </div>
        
        <InlineError error={error} />
        <SuccessMessage message={success} />
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';