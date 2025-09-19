import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CreditCard, 
  X, 
  AlertTriangle,
  CheckCircle,
  Zap,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { usePricingPlans } from '@/hooks/usePricingPlans';

interface TrialDashboardBannerProps {
  onUpgradeClick?: () => void;
  showInDashboard?: boolean;
}

export function TrialDashboardBanner({ onUpgradeClick, showInDashboard = false }: TrialDashboardBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { trial, loading } = useTrialStatus();
  const { plans } = usePricingPlans();

  if (loading || !trial || dismissed || trial.status !== 'active') {
    return null;
  }

  const currentPlan = plans.find(p => p.id === trial.plan_id);
  const trialProgress = trial.days_remaining / 14 * 100; // Assuming 14-day trial
  
  const getUrgencyLevel = () => {
    if (trial.days_remaining <= 1) return 'critical';
    if (trial.days_remaining <= 3) return 'urgent';
    if (trial.days_remaining <= 7) return 'warning';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  const getVariantAndColors = () => {
    switch (urgency) {
      case 'critical':
        return {
          variant: 'destructive' as const,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-900',
          progressColor: 'bg-red-500'
        };
      case 'urgent':
        return {
          variant: 'destructive' as const,
          bgColor: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-900',
          progressColor: 'bg-orange-500'
        };
      case 'warning':
        return {
          variant: 'default' as const,
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-900',
          progressColor: 'bg-yellow-500'
        };
      default:
        return {
          variant: 'default' as const,
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-900',
          progressColor: 'bg-blue-500'
        };
    }
  };

  const { variant, bgColor, textColor, progressColor } = getVariantAndColors();

  const getMessage = () => {
    if (urgency === 'critical') {
      return {
        title: 'Trial Ending Today!',
        message: `Your ${trial.plan_name} trial ends in ${trial.days_remaining} day${trial.days_remaining === 1 ? '' : 's'}. Upgrade now to avoid losing access.`,
        cta: 'Upgrade Now'
      };
    }
    
    if (urgency === 'urgent') {
      return {
        title: 'Trial Ending Soon',
        message: `Only ${trial.days_remaining} days left in your ${trial.plan_name} trial.`,
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
      title: 'Free Trial Active',
      message: `You're enjoying the ${trial.plan_name} trial with ${trial.days_remaining} days remaining.`,
      cta: 'Upgrade Early'
    };
  };

  const { title, message, cta } = getMessage();

  if (showInDashboard) {
    // Compact banner for dashboard header
    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Clock className={`h-5 w-5 ${urgency === 'critical' || urgency === 'urgent' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium ${textColor}`}>{title}</h3>
                <Badge variant="outline" className="text-xs">
                  {trial.plan_name} Trial
                </Badge>
              </div>
              <p className={`text-sm ${textColor} mb-2`}>{message}</p>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${trialProgress}%` }}
                  />
                </div>
                <span className={`text-xs ${textColor} font-medium`}>
                  {trial.days_remaining} days
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={onUpgradeClick}
              size="sm"
              className={urgency === 'critical' || urgency === 'urgent' ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-primary'}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {cta}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full banner for layout header
  return (
    <Alert variant={variant} className="border-0 rounded-none">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            <Badge variant="secondary" className="text-xs">
              {trial.plan_name} Trial
            </Badge>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm">{message}</span>
            
            {currentPlan && (
              <div className="text-xs text-muted-foreground">
                After trial: ₦{currentPlan.price.toLocaleString()}/month
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onUpgradeClick}
            size="sm"
            className={urgency === 'critical' || urgency === 'urgent' ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-primary'}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {cta}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}