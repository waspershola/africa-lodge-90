import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Building, CreditCard, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTemplates, usePlans, useCreateTenant } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const Wizard = () => {
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const createTenant = useCreateTenant();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    // Step 1: Hotel Information
    hotelName: '',
    slug: '',
    contactEmail: '',
    city: '',
    totalRooms: '',
    
    // Step 2: Template Selection
    templateId: '',
    
    // Step 3: Plan Selection
    planId: '',
    
    // Step 4: Owner Setup
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    
    // Step 5: Configuration
    offlineWindowHours: '24',
    customSettings: ''
  });

  const steps = [
    { id: 1, title: 'Hotel Information', icon: Building },
    { id: 2, title: 'Template Selection', icon: Settings },
    { id: 3, title: 'Plan Selection', icon: CreditCard },
    { id: 4, title: 'Owner Setup', icon: User },
    { id: 5, title: 'Review & Create', icon: CheckCircle }
  ];

  if (templatesLoading || plansLoading) return <LoadingState />;

  const handleInputChange = (field: string, value: string) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from hotel name
    if (field === 'hotelName') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setWizardData(prev => ({ ...prev, slug }));
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const tenantData = {
      name: wizardData.hotelName,
      slug: wizardData.slug,
      contactEmail: wizardData.contactEmail,
      city: wizardData.city,
      totalRooms: parseInt(wizardData.totalRooms),
      templateId: wizardData.templateId,
      plan: wizardData.planId,
      offlineWindowHours: parseInt(wizardData.offlineWindowHours),
      ownerUserId: 'new-owner-' + Date.now(),
      ownerDetails: {
        name: wizardData.ownerName,
        email: wizardData.ownerEmail,
        phone: wizardData.ownerPhone
      }
    };

    createTenant.mutate(tenantData as any);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.hotelName && wizardData.contactEmail && wizardData.city && wizardData.totalRooms;
      case 2:
        return wizardData.templateId;
      case 3:
        return wizardData.planId;
      case 4:
        return wizardData.ownerName && wizardData.ownerEmail;
      default:
        return true;
    }
  };

  const selectedTemplate = templates?.data?.find((t: any) => t.id === wizardData.templateId);
  const selectedPlan = plans?.data?.find((p: any) => p.id === wizardData.planId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tenant Setup Wizard</h1>
        <p className="text-muted-foreground">Create a new hotel tenant with guided setup</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                isActive ? 'border-primary text-primary' :
                'border-muted text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-primary' : 
                  isCompleted ? 'text-foreground' : 
                  'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 mx-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Hotel Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Hotel Information</h2>
                <p className="text-muted-foreground">Enter basic information about the hotel</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input 
                    id="hotelName"
                    value={wizardData.hotelName}
                    onChange={(e) => handleInputChange('hotelName', e.target.value)}
                    placeholder="Grand Palace Hotel"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input 
                    id="slug"
                    value={wizardData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="grand-palace-hotel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input 
                    id="contactEmail"
                    type="email"
                    value={wizardData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="admin@grandpalace.com"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city"
                    value={wizardData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Lagos"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="totalRooms">Total Rooms</Label>
                <Input 
                  id="totalRooms"
                  type="number"
                  value={wizardData.totalRooms}
                  onChange={(e) => handleInputChange('totalRooms', e.target.value)}
                  placeholder="120"
                  className="max-w-xs"
                />
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Template Selection</h2>
                <p className="text-muted-foreground">Choose a template that matches your hotel type</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.data?.map((template: any) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      wizardData.templateId === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleInputChange('templateId', template.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="secondary">{template.category}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Room Types:</span>
                          <span>{template.roomTypes?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Features:</span>
                          <span>{template.features?.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Plan Selection</h2>
                <p className="text-muted-foreground">Choose a subscription plan for the hotel</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans?.data?.map((plan: any) => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      wizardData.planId === plan.id ? 'ring-2 ring-primary' : ''
                    } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
                    onClick={() => handleInputChange('planId', plan.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {plan.popular && <Badge className="bg-yellow-400 text-yellow-900">Popular</Badge>}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">₦{plan.price?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Max Rooms:</span>
                          <span>{plan.maxRooms === 999 ? 'Unlimited' : plan.maxRooms}</span>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(plan.features).map(([feature, enabled]: [string, any]) => (
                            <div key={feature} className="flex justify-between text-sm">
                              <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                              <span>{enabled ? '✓' : '✗'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Owner Setup */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Owner Setup</h2>
                <p className="text-muted-foreground">Create the hotel owner/admin account</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Full Name</Label>
                  <Input 
                    id="ownerName"
                    value={wizardData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">Email Address</Label>
                  <Input 
                    id="ownerEmail"
                    type="email"
                    value={wizardData.ownerEmail}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                    placeholder="john@grandpalace.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ownerPhone">Phone Number</Label>
                <Input 
                  id="ownerPhone"
                  value={wizardData.ownerPhone}
                  onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                  placeholder="+234 123 456 7890"
                  className="max-w-xs"
                />
              </div>

              <div>
                <Label htmlFor="offlineWindowHours">Offline Window (Hours)</Label>
                <Select 
                  value={wizardData.offlineWindowHours}
                  onValueChange={(value) => handleInputChange('offlineWindowHours', value)}
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Review & Create</h2>
                <p className="text-muted-foreground">Review the configuration and create the tenant</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hotel Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{wizardData.hotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slug:</span>
                      <span className="font-medium">{wizardData.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span className="font-medium">{wizardData.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rooms:</span>
                      <span className="font-medium">{wizardData.totalRooms}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="font-medium">{selectedTemplate?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">{selectedPlan?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="font-medium">{wizardData.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Offline Window:</span>
                      <span className="font-medium">{wizardData.offlineWindowHours}h</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={createTenant.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                Create Tenant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wizard;