import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, CreditCard, Zap, Loader2 } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';
import { usePricingPlans } from '@/hooks/usePricingPlans';

interface PlanConfirmationStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export function PlanConfirmationStep({ data, updateData }: PlanConfirmationStepProps) {
  const { plans, loading, error } = usePricingPlans();

  const selectPlan = (plan: any) => {
    updateData({
      plan: {
        id: plan.id,
        name: plan.name,
        trialDays: plan.trial_days || 14,
      },
    });
  };

  const formatPrice = (price: number) => {
    return `₦${Number(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading available plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Failed to load pricing plans: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Confirm Your Subscription Plan</h3>
        <p className="text-muted-foreground">
          Start with a free trial, upgrade or downgrade anytime
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-md relative ${
              data.plan?.id === plan.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => selectPlan(plan)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="pb-3">
              <CardTitle className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {plan.max_rooms <= 25 && <Clock className="h-5 w-5" />}
                  {plan.max_rooms > 25 && plan.max_rooms <= 75 && <Zap className="h-5 w-5" />}
                  {plan.max_rooms > 75 && <CreditCard className="h-5 w-5" />}
                  <span>{plan.name}</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(plan.price_monthly)}
                </div>
                <div className="text-sm text-muted-foreground">
                  per month
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                {plan.description}
              </p>
              
              {plan.trial_days && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-primary">
                    {plan.trial_days}-Day Free Trial
                  </div>
                  <div className="text-xs text-muted-foreground">
                    No credit card required
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Up to {plan.max_rooms} rooms</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Up to {plan.max_staff} staff members</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Complete hotel management system</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">QR code services</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">POS system integration</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.plan && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">
                  {data.plan.name} Plan Selected
                </div>
                <div className="text-sm text-green-600">
                  {data.plan.trialDays && `Start with ${data.plan.trialDays} days free trial. `}
                  You can change your plan anytime from the billing dashboard.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button variant="link" className="text-sm">
          Need help choosing? Contact our sales team
        </Button>
      </div>
    </div>
  );
}