import { AuthErrorHandler } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
}

export function PasswordStrength({ 
  password, 
  className,
  showRequirements = true 
}: PasswordStrengthProps) {
  const strength = AuthErrorHandler.getPasswordStrength(password);
  
  const requirements = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains a number', test: /(?=.*[0-9])/.test(password) },
    { label: 'Contains a symbol', test: /(?=.*[!@#$%^&*])/.test(password) },
    { label: 'Contains uppercase letter', test: /(?=.*[A-Z])/.test(password) },
    { label: 'Contains lowercase letter', test: /(?=.*[a-z])/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            Password Strength
          </span>
          <span 
            className="text-sm font-semibold"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
        
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-300 rounded-full"
            style={{ 
              width: `${(strength.score / 6) * 100}%`,
              backgroundColor: strength.color 
            }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Requirements
          </span>
          <div className="grid grid-cols-1 gap-1">
            {requirements.map((req, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm"
              >
                {req.test ? (
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span 
                  className={cn(
                    'transition-colors',
                    req.test ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}