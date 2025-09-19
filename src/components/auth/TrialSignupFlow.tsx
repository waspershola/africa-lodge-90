import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Building2, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import { usePricingPlans } from '@/hooks/usePricingPlans';

interface TrialSignupData {
  hotel_name: string;
  owner_name: string;
  email: string;
  phone: string;
  location: string;
  plan_id: string;
  password: string;
  confirm_password: string;
}

interface TrialSignupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlanId?: string;
}

export function TrialSignupFlow({ open, onOpenChange, selectedPlanId }: TrialSignupFlowProps) {
  const [step, setStep] = useState<'plan' | 'details' | 'success'>('plan');
  const [formData, setFormData] = useState<TrialSignupData>({
    hotel_name: '',
    owner_name: '',
    email: '',
    phone: '',
    location: '',
    plan_id: selectedPlanId || '',
    password: '',
    confirm_password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { plans } = usePricingPlans();

  const selectedPlan = plans.find(p => p.id === formData.plan_id);

  const handlePlanSelect = (planId: string) => {
    setFormData(prev => ({ ...prev, plan_id: planId }));
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.hotel_name || !formData.owner_name || !formData.email || !formData.plan_id) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call to create trial account
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would:
      // 1. Create Supabase Auth user
      // 2. Insert tenant record with trial status
      // 3. Send welcome email
      // 4. Redirect to dashboard with trial banner
      
      console.log('Trial signup:', formData);
      setStep('success');
    } catch (err) {
      setError('Failed to create trial account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof TrialSignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (step === 'success') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle>Welcome to LuxuryHotelSaaS!</DialogTitle>
            <DialogDescription>
              Your 14-day free trial has started. Check your email for login details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-left">
              <h4 className="font-medium mb-2">What's Next?</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Access your owner dashboard</li>
                <li>• Set up your hotel configuration</li>
                <li>• Invite your team members</li>
                <li>• Explore all features</li>
              </ul>
            </div>
            
            <Button 
              className="w-full bg-gradient-primary"
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/owner-dashboard';
              }}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {step === 'plan' ? 'Choose Your Plan' : 'Complete Your Setup'}
          </DialogTitle>
          <DialogDescription>
            {step === 'plan' 
              ? 'Start your free trial today. No credit card required.'
              : `Setting up your ${selectedPlan?.name} plan trial`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'plan' && (
          <div className="grid gap-4">
            {plans.filter(p => p.trial_enabled).map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-md ${plan.popular ? 'ring-2 ring-accent' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && (
                  <div className="bg-accent text-accent-foreground text-center py-2 text-sm font-medium">
                    Most Popular Choice
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.popular && <Star className="h-4 w-4 text-accent" />}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">₦{plan.price.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">/month</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {plan.trial_duration_days}-day free trial
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {plan.room_capacity_min}-{plan.room_capacity_max === 9999 ? '∞' : plan.room_capacity_max} rooms
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Selected Plan Summary */}
            {selectedPlan && (
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{selectedPlan.name} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan.trial_duration_days}-day free trial, then ₦{selectedPlan.price.toLocaleString()}/month
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setStep('plan')}
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Hotel Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Hotel Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_name">Hotel Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hotel_name"
                      value={formData.hotel_name}
                      onChange={(e) => updateFormData('hotel_name', e.target.value)}
                      placeholder="Your Hotel Name"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      placeholder="City, Country"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Your Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => updateFormData('owner_name', e.target.value)}
                      placeholder="Your full name"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+234 xxx xxx xxxx"
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="font-medium">Create Password</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Create a strong password"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => updateFormData('confirm_password', e.target.value)}
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('plan')}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-gradient-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}