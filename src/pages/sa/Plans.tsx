import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Check, X, CreditCard, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { usePlans, useUpdatePlan } from '@/hooks/useApi';
import type { Plan } from '@/lib/api/mockAdapter';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const featureLabels = {
  frontDesk: 'Front Desk Management',
  localPayments: 'Local Payments (POS/Cash/Transfer)',
  basicReports: 'Basic Reports & Analytics',
  emailNotifications: 'Email Notifications',
  offlineSync: 'Offline Synchronization',
  posIntegration: 'POS Integration',
  roomServiceQR: 'Room Service QR Codes',
  whatsappNotifications: 'WhatsApp Notifications',
  powerTracking: 'Power & Fuel Tracking',
  kioskCheckin: 'Kiosk Self Check-in',
  multiProperty: 'Multi-Property Management',
  advancedAnalytics: 'Advanced Analytics & AI'
};

export default function Plans() {
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Plan>>({});

  const { data: plansData, isLoading, error, refetch } = usePlans();
  const updatePlan = useUpdatePlan();

  if (isLoading) return <LoadingState message="Loading plans..." />;
  if (error) return <ErrorState message="Failed to load plans" onRetry={refetch} />;

  const plans = plansData?.data || [];

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan.id);
    setEditData(plan);
  };

  const handleSave = async () => {
    if (!editingPlan || !editData) return;
    
    try {
      await updatePlan.mutateAsync({
        id: editingPlan,
        data: editData,
      });
      setEditingPlan(null);
      setEditData({});
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setEditData({});
  };

  const updateFeature = (feature: string, enabled: boolean) => {
    setEditData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled
      }
    }));
  };

  const updatePrice = (price: number) => {
    setEditData(prev => ({
      ...prev,
      price
    }));
  };

  const updateMaxRooms = (maxRooms: number) => {
    setEditData(prev => ({
      ...prev,
      maxRooms
    }));
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <div>
          <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans and feature toggles</p>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <motion.div variants={fadeIn} className="grid gap-6">
        {plans.map((plan) => {
          const isEditing = editingPlan === plan.id;
          const currentPlan = isEditing ? { ...plan, ...editData } : plan;

          return (
            <Card key={plan.id} className={`modern-card ${plan.popular ? 'ring-2 ring-accent' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="display-heading text-xl">{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-gradient-accent text-accent-foreground mt-1">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(plan)}
                      >
                        Edit Plan
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updatePlan.isPending}
                          className="bg-gradient-primary shadow-luxury hover:shadow-hover"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {updatePlan.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`price-${plan.id}`}>Monthly Price (NGN)</Label>
                    {isEditing ? (
                      <Input
                        id={`price-${plan.id}`}
                        type="number"
                        value={currentPlan.price}
                        onChange={(e) => updatePrice(parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-primary mt-1">
                        ₦{plan.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`rooms-${plan.id}`}>Max Rooms</Label>
                    {isEditing ? (
                      <Input
                        id={`rooms-${plan.id}`}
                        type="number"
                        value={currentPlan.maxRooms}
                        onChange={(e) => updateMaxRooms(parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-accent mt-1">
                        {plan.maxRooms === 999 ? 'Unlimited' : plan.maxRooms}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label className="text-base font-medium">Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {Object.entries(featureLabels).map(([key, label]) => {
                      const isEnabled = currentPlan.features?.[key as keyof typeof currentPlan.features];
                      
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-accent' : 'bg-muted-foreground'}`} />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                          {isEditing ? (
                            <Switch
                              checked={isEnabled || false}
                              onCheckedChange={(checked) => updateFeature(key, checked)}
                            />
                          ) : (
                            <div>
                              {isEnabled ? (
                                <Check className="h-4 w-4 text-accent" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feature Gates Preview */}
                {!isEditing && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      UI Components Enabled
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(plan.features)
                        .filter(([_, enabled]) => enabled)
                        .map(([feature, _]) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {featureLabels[feature as keyof typeof featureLabels]}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </motion.div>
    </motion.div>
  );
}