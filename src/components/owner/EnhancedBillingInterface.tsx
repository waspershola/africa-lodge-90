import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Crown,
  Building
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { usePricingPlans } from '@/hooks/usePricingPlans';

interface BillingTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  plan_name: string;
}

export function EnhancedBillingInterface() {
  const { tenant, trialStatus } = useAuth();
  const { plans, loading: plansLoading } = usePricingPlans();
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock transaction data
  useEffect(() => {
    const mockTransactions: BillingTransaction[] = [
      {
        id: '1',
        amount: 79,
        currency: 'USD',
        status: 'completed',
        date: '2025-09-01',
        description: 'Growth Plan - Monthly Subscription',
        plan_name: 'Growth Plan'
      },
      {
        id: '2',
        amount: 79,
        currency: 'USD',
        status: 'pending',
        date: '2025-10-01',
        description: 'Growth Plan - Monthly Subscription',
        plan_name: 'Growth Plan'
      }
    ];
    
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const currentPlan = plans.find(p => p.id === tenant?.plan_id);
  const isTrialing = tenant?.subscription_status === 'trialing';
  const isExpired = tenant?.subscription_status === 'expired';

  const handlePlanUpgrade = (planId: string) => {
    // In production, this would integrate with Stripe/payment provider
    console.log('Upgrading to plan:', planId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'pending': return 'text-warning';
      case 'failed': return 'text-danger';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending': return <Calendar className="h-4 w-4 text-warning" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-danger" />;
      default: return null;
    }
  };

  if (loading || plansLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial/Subscription Status */}
      {isTrialing && trialStatus && (
        <Alert className={trialStatus.daysRemaining <= 3 ? "border-warning" : ""}>
          <AlertTriangle className={`h-4 w-4 ${trialStatus.daysRemaining <= 3 ? 'text-warning' : 'text-primary'}`} />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                <strong>Trial Status:</strong> {trialStatus.daysRemaining} days remaining
                {trialStatus.daysRemaining <= 3 && " - Upgrade now to continue access!"}
              </p>
              {trialStatus.daysRemaining > 0 && (
                <Progress 
                  value={((14 - trialStatus.daysRemaining) / 14) * 100} 
                  className="w-full h-2"
                />
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Subscription Expired</strong> - Your access has been suspended. 
            Please upgrade to continue using the platform.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your active subscription and billing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{currentPlan.name}</h3>
                  {currentPlan.id === 'growth' && (
                    <Badge variant="secondary">Most Popular</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                <p className="text-lg font-bold text-primary">${currentPlan.price}/month</p>
              </div>
              <div className="text-right space-y-1">
                <Badge className={tenant?.subscription_status === 'active' ? 'bg-success' : 'bg-warning'}>
                  {tenant?.subscription_status}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {(isTrialing || isExpired) && (
            <Button className="w-full" size="lg" onClick={() => handlePlanUpgrade(tenant?.plan_id || 'growth')}>
              <Zap className="mr-2 h-4 w-4" />
              {isExpired ? 'Reactivate Subscription' : 'Upgrade Now'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Available Plans for Upgrade */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Upgrade or downgrade your subscription at any time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter(plan => plan.id !== tenant?.plan_id)
              .map((plan) => (
                <div
                  key={plan.id}
                  className="relative p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  {plan.id === 'growth' && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-gradient-primary">
                        <Crown className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {plan.id === 'pro' && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-gradient-primary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>
                  )}
                  {plan.id === 'enterprise' && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-gradient-primary">
                        <Building className="h-3 w-3 mr-1" />
                        Enterprise
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-primary">${plan.price}</p>
                      <p className="text-sm text-muted-foreground">/month</p>
                    </div>

                    <ul className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handlePlanUpgrade(plan.id)}
                    >
                      {plan.price > (currentPlan?.price || 0) ? 'Upgrade' : 'Downgrade'} to {plan.name}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your billing history and payment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${transaction.amount} {transaction.currency}
                    </p>
                    <p className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}