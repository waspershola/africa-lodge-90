import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CreditCard, 
  X, 
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useTrialStatus } from '@/hooks/useTrialStatus';

interface TrialBannerProps {
  onUpgradeClick?: () => void;
  dismissible?: boolean;
}

export function TrialBanner({ onUpgradeClick, dismissible = false }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { trial, loading } = useTrialStatus();

  if (loading || !trial || dismissed) {
    return null;
  }

  const getVariantAndIcon = () => {
    if (trial.is_expired) {
      return {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        urgency: 'expired'
      };
    }
    
    if (trial.days_remaining <= 3) {
      return {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        urgency: 'critical'
      };
    }
    
    if (trial.days_remaining <= 7) {
      return {
        variant: 'default' as const,
        icon: Clock,
        urgency: 'warning'
      };
    }
    
    return {
      variant: 'default' as const,
      icon: CheckCircle,
      urgency: 'normal'
    };
  };

  const { variant, icon: Icon, urgency } = getVariantAndIcon();

  const getMessage = () => {
    if (trial.is_expired) {
      return {
        title: 'Trial Expired',
        message: 'Your trial has ended. Upgrade now to restore access to all features.',
        cta: 'Upgrade Now'
      };
    }
    
    if (urgency === 'critical') {
      return {
        title: 'Trial Ending Soon!',
        message: `Only ${trial.days_remaining} day${trial.days_remaining === 1 ? '' : 's'} left in your ${trial.plan_name} trial.`,
        cta: 'Upgrade Now'
      };
    }
    
    if (urgency === 'warning') {
      return {
        title: 'Trial Reminder',
        message: `${trial.days_remaining} days remaining in your ${trial.plan_name} trial.`,
        cta: 'Upgrade Plan'
      };
    }
    
    return {
      title: 'Trial Active',
      message: `You're on the ${trial.plan_name} trial with ${trial.days_remaining} days remaining.`,
      cta: 'Upgrade Early'
    };
  };

  const { title, message, cta } = getMessage();

  return (
    <Alert variant={variant} className="relative">
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm">{message}</div>
          </div>
          <Badge 
            variant={trial.is_expired ? 'destructive' : 'secondary'}
            className="ml-2"
          >
            {trial.plan_name} Trial
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onUpgradeClick}
            size="sm"
            className={urgency === 'critical' || trial.is_expired ? 'bg-gradient-primary' : ''}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {cta}
          </Button>
          
          {dismissible && !trial.is_expired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}