import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wand2, 
  Building2, 
  User, 
  CreditCard, 
  Palette,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTemplates, useRoles, useCreateTenant, useCreateTenantUser, useImpersonateTenant } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

const steps = [
  { id: 1, name: 'Hotel Details', icon: Building2 },
  { id: 2, name: 'Template Selection', icon: Palette },
  { id: 3, name: 'Owner Setup', icon: User },
  { id: 4, name: 'Plan & Billing', icon: CreditCard },
  { id: 5, name: 'Review & Create', icon: CheckCircle }
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    hotel: {
      name: '',
      slug: '',
      description: '',
      city: '',
      country: '',
      phone: '',
      email: ''
    },
    template: {
      id: '',
      name: ''
    },
    owner: {
      name: '',
      email: '',
      phone: '',
      roleId: ''
    },
    plan: {
      type: 'starter',
      billingCycle: 'monthly'
    }
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<any>(null);
  const { toast } = useToast();

  const { data: templatesData } = useTemplates();
  const { data: rolesData } = useRoles();
  const createTenant = useCreateTenant();
  const createTenantUser = useCreateTenantUser();
  const impersonateTenant = useImpersonateTenant();

  const templates = templatesData?.data || [];
  const roles = rolesData?.data || [];
  const ownerRoles = roles.filter((role: any) => role.name.toLowerCase().includes('owner'));

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleHotelChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, [field]: value }
    }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        hotel: { ...prev.hotel, slug }
      }));
    }
  };

  const handleTemplateSelect = (template: any) => {
    setFormData(prev => ({
      ...prev,
      template: { id: template.id, name: template.name }
    }));
  };

  const handleOwnerChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      owner: { ...prev.owner, [field]: value }
    }));
  };

  const handlePlanChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      plan: { ...prev.plan, [field]: value }
    }));
  };

  const handleCreateTenant = async () => {
    setIsCreating(true);
    try {
      // Create tenant
      const tenantResult = await createTenant.mutateAsync({
        ...formData.hotel,
        plan: formData.plan.type,
        templateId: formData.template.id
      });

      // Create owner user
      await createTenantUser.mutateAsync({
        tenantId: tenantResult.data.id,
        ...formData.owner,
        role: 'owner'
      });

      setCreatedTenant(tenantResult.data);
      toast({ title: "Hotel created successfully!" });
      handleNext();
    } catch (error) {
      toast({ title: "Failed to create hotel", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImpersonate = async () => {
    if (createdTenant) {
      try {
        await impersonateTenant.mutateAsync(createdTenant.id);
        window.open(`/hotel/dashboard?impersonate=${createdTenant.id}`, '_blank');
        toast({ title: "Opening hotel dashboard..." });
      } catch (error) {
        toast({ title: "Failed to open hotel dashboard", variant: "destructive" });
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.hotel.name && formData.hotel.email && formData.hotel.city;
      case 2:
        return formData.template.id;
      case 3:
        return formData.owner.name && formData.owner.email;
      case 4:
        return formData.plan.type;
      default:
        return true;
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="text-3xl font-bold display-heading text-gradient">Tenant Setup Wizard</h1>
        <p className="text-muted-foreground mt-2">Create a new hotel tenant with guided setup</p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div variants={fadeIn}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center gap-3 rounded-lg px-4 py-2 transition-colors
                ${currentStep >= step.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted/30 text-muted-foreground'
                }
              `}>
                <step.icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:block">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <steps.find(s => s.id === currentStep)?.icon className="h-5 w-5 text-primary" />
              {steps.find(s => s.id === currentStep)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Hotel Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hotelName">Hotel Name *</Label>
                    <Input
                      id="hotelName"
                      value={formData.hotel.name}
                      onChange={(e) => handleHotelChange('name', e.target.value)}
                      placeholder="Grand Luxury Hotel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hotelSlug">Slug (URL)</Label>
                    <Input
                      id="hotelSlug"
                      value={formData.hotel.slug}
                      onChange={(e) => handleHotelChange('slug', e.target.value)}
                      placeholder="grand-luxury-hotel"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.hotel.description}
                    onChange={(e) => handleHotelChange('description', e.target.value)}
                    placeholder="Describe the hotel..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.hotel.city}
                      onChange={(e) => handleHotelChange('city', e.target.value)}
                      placeholder="Lagos"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.hotel.country}
                      onChange={(e) => handleHotelChange('country', e.target.value)}
                      placeholder="Nigeria"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Hotel Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.hotel.email}
                      onChange={(e) => handleHotelChange('email', e.target.value)}
                      placeholder="info@grandluxury.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.hotel.phone}
                      onChange={(e) => handleHotelChange('phone', e.target.value)}
                      placeholder="+234 123 456 7890"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Template Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Choose a template that best matches your hotel type. This will set up default pricing, room types, and branding.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template: any) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        formData.template.id === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {template.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Markup: {template.pricing?.markup}%
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {template.roomTypes?.length || 0} room types
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Owner Setup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Set up the hotel owner/admin user who will have full access to the hotel management system.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.owner.name}
                      onChange={(e) => handleOwnerChange('name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerEmail">Owner Email *</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.owner.email}
                      onChange={(e) => handleOwnerChange('email', e.target.value)}
                      placeholder="john@grandluxury.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerPhone">Phone</Label>
                    <Input
                      id="ownerPhone"
                      value={formData.owner.phone}
                      onChange={(e) => handleOwnerChange('phone', e.target.value)}
                      placeholder="+234 123 456 7890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerRole">Role</Label>
                    <Select 
                      value={formData.owner.roleId} 
                      onValueChange={(value) => handleOwnerChange('roleId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerRoles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Plan & Billing */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Choose a subscription plan and billing cycle for the hotel.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['starter', 'growth', 'pro'].map((plan) => (
                    <Card 
                      key={plan} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        formData.plan.type === plan 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handlePlanChange('type', plan)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base capitalize">{plan}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold">
                            ₦{plan === 'starter' ? '25,000' : plan === 'growth' ? '50,000' : '100,000'}
                          </div>
                          <div className="text-sm text-muted-foreground">per month</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select 
                    value={formData.plan.billingCycle} 
                    onValueChange={(value) => handlePlanChange('billingCycle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly (10% discount)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Review & Create */}
            {currentStep === 5 && !createdTenant && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Review the information below and click "Create Hotel" to set up the new tenant.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Hotel Details</h3>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                      <div><strong>Name:</strong> {formData.hotel.name}</div>
                      <div><strong>Slug:</strong> {formData.hotel.slug}</div>
                      <div><strong>Location:</strong> {formData.hotel.city}{formData.hotel.country ? `, ${formData.hotel.country}` : ''}</div>
                      <div><strong>Email:</strong> {formData.hotel.email}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Template</h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <strong>{formData.template.name}</strong>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Owner</h3>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                      <div><strong>Name:</strong> {formData.owner.name}</div>
                      <div><strong>Email:</strong> {formData.owner.email}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Plan</h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <strong className="capitalize">{formData.plan.type}</strong> - {formData.plan.billingCycle}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {currentStep === 5 && createdTenant && (
              <div className="space-y-6 text-center">
                <CheckCircle className="h-16 w-16 text-success mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-success">Hotel Created Successfully!</h3>
                  <p className="text-muted-foreground mt-2">
                    {createdTenant.name} has been set up and is ready to use.
                  </p>
                </div>

                <Alert>
                  <Copy className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hotel URL:</strong> {window.location.origin}/hotel/{createdTenant.slug}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4 justify-center">
                  <Button onClick={handleImpersonate} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Hotel Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Create Another Hotel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      {currentStep < 5 && (
        <motion.div variants={fadeIn} className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          {currentStep === 4 ? (
            <Button
              onClick={handleCreateTenant}
              disabled={!canProceed() || isCreating}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Hotel'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}