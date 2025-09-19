import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  CreditCard, 
  User, 
  Palette, 
  FileText, 
  Shield, 
  Eye,
  CheckCircle 
} from 'lucide-react';
import { HotelInformationStep } from './steps/HotelInformationStep';
import { TemplateSelectionStep } from './steps/TemplateSelectionStep';
import { PlanConfirmationStep } from './steps/PlanConfirmationStep';
import { OwnerSetupStep } from './steps/OwnerSetupStep';
import { BrandingStep } from './steps/BrandingStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { PermissionsStep } from './steps/PermissionsStep';
import { AuditTransparencyStep } from './steps/AuditTransparencyStep';
import { ReviewConfirmStep } from './steps/ReviewConfirmStep';
import { useToast } from '@/hooks/use-toast';

export interface OnboardingData {
  hotelInfo: {
    name: string;
    address: string;
    city: string;
    country: string;
    timezone: string;
    phone: string;
    supportEmail: string;
    currency: string;
  };
  template: {
    id: string;
    name: string;
    roomCount: number;
    description: string;
  } | null;
  plan: {
    id: string;
    name: string;
    trialDays?: number;
  } | null;
  owner: {
    name: string;
    email: string;
    phone: string;
    emergencyContact?: string;
  };
  branding: {
    logo?: File;
    primaryColor: string;
    secondaryColor: string;
    receiptFormat: 'pdf' | 'pos' | 'both';
  };
  documents: {
    policies: File[];
    termsAccepted: boolean;
  };
  permissions: {
    staffInvite: string[];
    pricingApproval: string[];
    qrMenuManagement: string[];
  };
  auditAccepted: boolean;
}

const steps = [
  { id: 'hotel', title: 'Hotel Information', icon: Building2 },
  { id: 'template', title: 'Template Selection', icon: MapPin },
  { id: 'plan', title: 'Plan Confirmation', icon: CreditCard },
  { id: 'owner', title: 'Owner Setup', icon: User },
  { id: 'branding', title: 'Branding', icon: Palette },
  { id: 'documents', title: 'Documents & Policies', icon: FileText },
  { id: 'permissions', title: 'Permissions Setup', icon: Shield },
  { id: 'audit', title: 'Audit & Transparency', icon: Eye },
  { id: 'review', title: 'Review & Confirm', icon: CheckCircle },
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    hotelInfo: {
      name: '',
      address: '',
      city: '',
      country: 'Nigeria',
      timezone: 'Africa/Lagos',
      phone: '',
      supportEmail: '',
      currency: 'NGN',
    },
    template: null,
    plan: null,
    owner: {
      name: '',
      email: '',
      phone: '',
    },
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      receiptFormat: 'both',
    },
    documents: {
      policies: [],
      termsAccepted: false,
    },
    permissions: {
      staffInvite: ['OWNER'],
      pricingApproval: ['OWNER', 'MANAGER'],
      qrMenuManagement: ['OWNER', 'MANAGER'],
    },
    auditAccepted: false,
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Hotel Information
        return onboardingData.hotelInfo.name && 
               onboardingData.hotelInfo.address && 
               onboardingData.hotelInfo.city;
      case 1: // Template Selection
        return onboardingData.template !== null;
      case 2: // Plan Confirmation
        return onboardingData.plan !== null;
      case 3: // Owner Setup
        return onboardingData.owner.name && onboardingData.owner.email;
      case 4: // Branding
        return true; // Optional step
      case 5: // Documents
        return onboardingData.documents.termsAccepted;
      case 6: // Permissions
        return true; // Has defaults
      case 7: // Audit
        return onboardingData.auditAccepted;
      case 8: // Review
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Setup Complete! 🎉",
        description: "Your hotel has been successfully configured.",
      });
      
      // Redirect to owner dashboard
      navigate('/owner-dashboard');
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <HotelInformationStep data={onboardingData} updateData={updateData} />;
      case 1:
        return <TemplateSelectionStep data={onboardingData} updateData={updateData} />;
      case 2:
        return <PlanConfirmationStep data={onboardingData} updateData={updateData} />;
      case 3:
        return <OwnerSetupStep data={onboardingData} updateData={updateData} />;
      case 4:
        return <BrandingStep data={onboardingData} updateData={updateData} />;
      case 5:
        return <DocumentsStep data={onboardingData} updateData={updateData} />;
      case 6:
        return <PermissionsStep data={onboardingData} updateData={updateData} />;
      case 7:
        return <AuditTransparencyStep data={onboardingData} updateData={updateData} />;
      case 8:
        return <ReviewConfirmStep data={onboardingData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Your Hotel Management System
          </h1>
          <p className="text-muted-foreground">
            Let's get your hotel set up in just a few minutes
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Steps Navigation */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-2 ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`rounded-full p-2 ${
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="hidden sm:block text-xs font-medium text-center max-w-20">
                  {step.title}
                </div>
                {index < currentStep && (
                  <Badge variant="default" className="hidden sm:flex text-xs">
                    Complete
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
              <span>{steps[currentStep].title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Setting up...' : 'Finish Setup'}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}