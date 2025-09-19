import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, CreditCard, Zap } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface PlanConfirmationStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 15000,
    currency: 'NGN',
    billing: 'monthly',
    trialDays: 7,
    description: 'Perfect for small boutique hotels',
    features: [
      'Up to 15 rooms',
      'Basic POS system',
      'Guest management',
      'Mobile QR services',
      'Email support',
    ],
    limitations: [
      'Limited to 2 staff accounts',
      'Basic reporting only',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 35000,
    currency: 'NGN',
    billing: 'monthly',
    trialDays: 14,
    description: 'Most popular for growing hotels',
    features: [
      'Up to 75 rooms',
      'Advanced POS & inventory',
      'Staff management',
      'Advanced QR services',
      'Financial reporting',
      'Phone & email support',
      'Multi-location support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 75000,
    currency: 'NGN',
    billing: 'monthly',
    trialDays: 30,
    description: 'For large hotels and chains',
    features: [
      'Unlimited rooms',
      'Full POS & inventory suite',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 priority support',
      'White-label options',
    ],
  },
];

export function PlanConfirmationStep({ data, updateData }: PlanConfirmationStepProps) {
  const selectPlan = (plan: typeof plans[0]) => {
    updateData({
      plan: {
        id: plan.id,
        name: plan.name,
        trialDays: plan.trialDays,
      },
    });
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${price.toLocaleString()}`;
  };

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
                  {plan.id === 'starter' && <Clock className="h-5 w-5" />}
                  {plan.id === 'growth' && <Zap className="h-5 w-5" />}
                  {plan.id === 'enterprise' && <CreditCard className="h-5 w-5" />}
                  <span>{plan.name}</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(plan.price, plan.currency)}
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
              
              {plan.trialDays && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-primary">
                    {plan.trialDays}-Day Free Trial
                  </div>
                  <div className="text-xs text-muted-foreground">
                    No credit card required
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {plan.limitations && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Limitations:
                  </div>
                  <div className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        • {limitation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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