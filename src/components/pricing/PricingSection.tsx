import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useCurrency } from '@/hooks/useCurrency';

interface PricingSectionProps {
  onPlanSelect?: (planId: string) => void;
}

export function PricingSection({ onPlanSelect }: PricingSectionProps) {
  const [demoVideoUrl, setDemoVideoUrl] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState<string | null>(null);
  
  const { plans, loading } = usePricingPlans();
  const { startTrial } = useTrialStatus();
  const { formatPrice } = useCurrency();

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

  const handlePlanAction = async (planId: string, actionType: 'trial' | 'purchase') => {
    const operationId = crypto.randomUUID();
    console.log(`[PricingSection][${operationId}] Plan action:`, { planId, actionType });
    
    if (actionType === 'trial') {
      setStartingTrial(planId);
      try {
        console.log(`[PricingSection][${operationId}] Starting trial for plan:`, planId);
        await startTrial(planId);
        
        console.log(`[PricingSection][${operationId}] Trial started successfully, redirecting...`);
        // Redirect to appropriate dashboard after trial starts
        window.location.href = '/owner-dashboard';
      } catch (error: any) {
        console.error(`[PricingSection][${operationId}] Failed to start trial:`, {
          error: error.message,
          error_code: error.error_code,
          stack: error.stack
        });
        
        // Error toast already handled by useTrialStatus hook
      } finally {
        setStartingTrial(null);
      }
    } else {
      console.log(`[PricingSection][${operationId}] Proceeding to purchase for plan:`, planId);
      onPlanSelect?.(planId);
    }
  };

  const openDemoVideo = (url: string) => {
    setDemoVideoUrl(url);
  };

  const closeDemoVideo = () => {
    setDemoVideoUrl(null);
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pricing plans...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="pricing" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-gradient mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your hotel. All plans include core features with no hidden fees.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {plans.map((plan) => (
              <motion.div key={plan.id} variants={fadeIn}>
                <Card className={`modern-card relative h-full ${plan.popular ? 'ring-2 ring-accent shadow-accent' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="display-heading text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-primary">
                      {formatPrice(plan.price)}
                      <span className="text-lg font-normal text-muted-foreground">/month</span>
                    </div>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="text-sm text-muted-foreground">
                      {plan.room_capacity_min === plan.room_capacity_max 
                        ? `${plan.room_capacity_min} rooms`
                        : plan.room_capacity_max === 9999
                        ? `${plan.room_capacity_min}+ rooms`
                        : `${plan.room_capacity_min}-${plan.room_capacity_max} rooms`
                      }
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.demo_video_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDemoVideo(plan.demo_video_url!)}
                        className="w-full mb-3"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Watch Demo
                      </Button>
                    )}
                    
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-primary shadow-luxury hover:shadow-hover' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handlePlanAction(
                        plan.id, 
                        plan.trial_enabled ? 'trial' : 'purchase'
                      )}
                      disabled={startingTrial === plan.id}
                    >
                      {startingTrial === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting Trial...
                        </>
                      ) : (
                        plan.cta_text
                      )}
                    </Button>
                    
                    {plan.trial_enabled && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {plan.trial_duration_days}-day free trial • No credit card required
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Video Modal */}
      <Dialog open={!!demoVideoUrl} onOpenChange={closeDemoVideo}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Product Demo</DialogTitle>
          </DialogHeader>
          {demoVideoUrl && (
            <div className="aspect-video">
              <iframe
                src={demoVideoUrl}
                title="Product Demo"
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}