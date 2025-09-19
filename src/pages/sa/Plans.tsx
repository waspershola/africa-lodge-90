import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Save, Check, X, CreditCard, Users, Zap, TrendingUp, 
  Mail, AlertTriangle, DollarSign, Calendar, BarChart3,
  Download, Upload, Target, Percent, Timer
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, usePlanMetrics, 
  useSendInvoiceReminder, useCheckSubscriptionExpiry, useTenants, useUpdateTenant
} from '@/hooks/useApi';
import type { Plan } from '@/lib/supabase-api';

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

const planFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  maxRooms: z.number().min(1, 'Max rooms must be at least 1'),
  trialDays: z.number().min(0, 'Trial days must be positive'),
  billingCycle: z.enum(['monthly', 'yearly']),
  popular: z.boolean(),
  features: z.object({
    frontDesk: z.boolean(),
    localPayments: z.boolean(),
    basicReports: z.boolean(),
    emailNotifications: z.boolean(),
    offlineSync: z.boolean(),
    posIntegration: z.boolean(),
    roomServiceQR: z.boolean(),
    whatsappNotifications: z.boolean(),
    powerTracking: z.boolean(),
    kioskCheckin: z.boolean(),
    multiProperty: z.boolean(),
    advancedAnalytics: z.boolean()
  })
});

type PlanFormData = z.infer<typeof planFormSchema>;

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export default function Plans() {
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const { data: plansData, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = usePlans();
  const { data: metricsData, isLoading: metricsLoading } = usePlanMetrics();
  const { data: expiryData } = useCheckSubscriptionExpiry();
  const { data: tenantsData, refetch: refetchTenants } = useTenants();

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const sendInvoiceReminder = useSendInvoiceReminder();
  const updateTenant = useUpdateTenant();

  const createForm = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: 'NGN',
      maxRooms: 25,
      trialDays: 14,
      billingCycle: 'monthly',
      popular: false,
      features: {
        frontDesk: true,
        localPayments: true,
        basicReports: false,
        emailNotifications: false,
        offlineSync: false,
        posIntegration: false,
        roomServiceQR: false,
        whatsappNotifications: false,
        powerTracking: false,
        kioskCheckin: false,
        multiProperty: false,
        advancedAnalytics: false
      }
    }
  });

  const editForm = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema)
  });

  if (plansLoading) return <LoadingState message="Loading plans..." />;
  if (plansError) return <ErrorState message="Failed to load plans" onRetry={refetchPlans} />;

  const plans = plansData?.data || [];
  const metrics = metricsData?.data;
  const expiry = expiryData?.data;
  const tenants = tenantsData?.data || [];

  const handleCreatePlan = async (data: PlanFormData) => {
    try {
      await createPlan.mutateAsync(data);
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan.id);
    editForm.reset({
      currency: 'USD',
      name: plan.name,
      description: plan.description || '',
      price: plan.price || plan.price_monthly,
      maxRooms: plan.maxRooms || plan.max_rooms,
      trialDays: plan.trialDays || plan.trial_days || 0,
      billingCycle: (plan.billingCycle || 'monthly') as 'monthly' | 'yearly',
      features: typeof plan.features === 'object' ? plan.features as any : {}
    });
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    
    try {
      const data = editForm.getValues();
      await updatePlan.mutateAsync({
        id: editingPlan,
        ...data
      });
      setEditingPlan(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
  };

  const handleDelete = async (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deletePlan.mutateAsync(planId);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleSendReminder = async (tenantId: string, type: 'overdue' | 'upcoming') => {
    try {
      await sendInvoiceReminder.mutateAsync({ tenantId, type });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSuspendTenant = async (tenantId: string) => {
    if (confirm('Are you sure you want to suspend this tenant? They will lose access to the platform.')) {
      try {
        await updateTenant.mutateAsync({
          id: tenantId,
          status: 'suspended'
        });
        refetchTenants();
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const overdueTenantsCount = tenants.filter(t => t.billingStatus === 'overdue' && t.status !== 'suspended').length;

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Plans & Subscriptions</h1>
            <p className="text-muted-foreground">Manage subscription plans, billing, and feature toggles</p>
          </div>
          <div className="flex gap-3">
            {overdueTenantsCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {overdueTenantsCount} Overdue
              </Badge>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Plan</DialogTitle>
                  <DialogDescription>
                    Configure a new subscription plan with features and pricing
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreatePlan)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Premium" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NGN">NGN (₦)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe this plan..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={createForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="35000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="maxRooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Rooms</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="25" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="trialDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trial Days</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="14" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="billingCycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Features</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(featureLabels).map(([key, label]) => (
                          <FormField
                            key={key}
                            control={createForm.control}
                            name={`features.${key as keyof typeof featureLabels}`}
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-3 rounded-lg border border-border">
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  {label}
                                </FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={createForm.control}
                      name="popular"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div>
                            <FormLabel className="text-sm font-medium cursor-pointer">
                              Mark as Popular
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              This plan will be highlighted for customers
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPlan.isPending}
                        className="bg-gradient-primary shadow-luxury hover:shadow-hover"
                      >
                        {createPlan.isPending ? 'Creating...' : 'Create Plan'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="expiry">Expiry Alerts</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid gap-6">
              {plans.map((plan) => {
                const isEditing = editingPlan === plan.id;

                return (
                  <Card key={plan.id} className={`modern-card ${plan.popular ? 'ring-2 ring-accent' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="display-heading text-xl">{plan.name}</CardTitle>
                              {plan.popular && (
                                <Badge className="bg-gradient-accent text-accent-foreground">
                                  Most Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(plan)}
                              >
                                Edit Plan
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(plan.id)}
                              >
                                Delete
                              </Button>
                            </>
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
                      {isEditing ? (
                        <Form {...editForm}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField
                              control={editForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Monthly Price (₦)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="maxRooms"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Rooms</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="trialDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Trial Days</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="billingCycle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Billing Cycle</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">Features</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {Object.entries(featureLabels).map(([key, label]) => (
                                <FormField
                                  key={key}
                                  control={editForm.control}
                                  name={`features.${key as keyof typeof featureLabels}`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-between p-3 rounded-lg border border-border">
                                      <FormLabel className="text-sm font-medium cursor-pointer">
                                        {label}
                                      </FormLabel>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </Form>
                      ) : (
                        <>
                          {/* Plan Overview */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Monthly Price</Label>
                              <div className="text-2xl font-bold text-primary">
                                ₦{plan.price.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Max Rooms</Label>
                              <div className="text-2xl font-bold text-accent">
                                {plan.maxRooms === 999 ? 'Unlimited' : plan.maxRooms}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Trial Period</Label>
                              <div className="text-xl font-bold text-primary">
                                {plan.trialDays} days
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Billing</Label>
                              <div className="text-xl font-bold capitalize">
                                {plan.billingCycle}
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              Enabled Features
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
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            {metricsLoading ? (
              <LoadingState message="Loading metrics..." />
            ) : (
              <div className="grid gap-6">
                {/* Plan Adoption */}
                <Card className="modern-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Plan Adoption & Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics?.adoption || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="planName" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === 'revenue' ? `₦${value.toLocaleString()}` : value,
                            name === 'revenue' ? 'Revenue' : 'Subscribers'
                          ]}
                        />
                        <Bar dataKey="subscribers" fill="hsl(var(--primary))" />
                        <Bar dataKey="revenue" fill="hsl(var(--accent))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Trends */}
                <Card className="modern-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Monthly Revenue Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics?.revenue || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                        <Line type="monotone" dataKey="starter" stroke={CHART_COLORS[0]} strokeWidth={2} />
                        <Line type="monotone" dataKey="growth" stroke={CHART_COLORS[1]} strokeWidth={2} />
                        <Line type="monotone" dataKey="pro" stroke={CHART_COLORS[2]} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Trial Conversions */}
                  <Card className="modern-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Trial Conversions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {metrics?.trialConversions?.map((plan, index) => (
                          <div key={plan.planName} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{plan.planName}</span>
                              <span className="font-medium">{plan.conversionRate}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${plan.conversionRate}%`,
                                  backgroundColor: CHART_COLORS[index]
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{plan.conversions} conversions</span>
                              <span>{plan.trials} trials</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Churn Rates */}
                  <Card className="modern-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        Churn Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {metrics?.churn?.map((plan, index) => (
                          <div key={plan.planName} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{plan.planName}</span>
                              <span className="font-medium text-destructive">{plan.churnRate}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-destructive h-2 rounded-full" 
                                style={{ width: `${plan.churnRate}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{plan.churned} churned</span>
                              <span>{plan.retained} retained</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid gap-6">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Billing Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenants.filter(t => t.billingStatus === 'overdue' && t.status !== 'suspended').map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div>
                          <h4 className="font-medium">{tenant.name}</h4>
                          <p className="text-sm text-muted-foreground">Plan: {tenant.plan} • Overdue</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(tenant.id, 'overdue')}
                            disabled={sendInvoiceReminder.isPending}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Reminder
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSuspendTenant(tenant.id)}
                            disabled={updateTenant.isPending}
                          >
                            {updateTenant.isPending ? 'Suspending...' : 'Suspend'}
                          </Button>
                        </div>
                      </div>
                    ))}

                    {tenants.filter(t => t.billingStatus === 'active' && t.status !== 'suspended').slice(0, 3).map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium">{tenant.name}</h4>
                          <p className="text-sm text-muted-foreground">Plan: {tenant.plan} • Next billing in 15 days</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(tenant.id, 'upcoming')}
                          disabled={sendInvoiceReminder.isPending}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Notice
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expiry Alerts Tab */}
          <TabsContent value="expiry" className="space-y-6">
            {expiry && (
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="modern-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{expiry.expired?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Expired Subscriptions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="modern-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                          <Timer className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{expiry.expiringSoon?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Expiring Soon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="modern-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                          <Check className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{expiry.totalChecked - (expiry.expired?.length || 0) - (expiry.expiringSoon?.length || 0)}</p>
                          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {expiry.suspensionRequired > 0 && (
                  <Card className="modern-card border-destructive">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Action Required: {expiry.suspensionRequired} Tenants Need Suspension
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        The following tenants have expired subscriptions and should be suspended:
                      </p>
                      <div className="space-y-2">
                        {expiry.expired?.map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                            <div>
                              <h4 className="font-medium">{tenant.name}</h4>
                              <p className="text-sm text-muted-foreground">Plan: {tenant.plan} • Status: {tenant.billingStatus}</p>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleSuspendTenant(tenant.id)}
                              disabled={updateTenant.isPending}
                            >
                              {updateTenant.isPending ? 'Suspending...' : 'Suspend Now'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}