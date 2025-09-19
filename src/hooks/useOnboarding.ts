import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface OnboardingStatus {
  isRequired: boolean;
  currentStep: string;
  setupCompleted: boolean;
  lastUpdated?: string;
}

export interface OnboardingProgress {
  step: string;
  data: any;
  completedAt: string;
}

export function useOnboarding() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<OnboardingStatus>({
    isRequired: false,
    currentStep: 'hotel_information',
    setupCompleted: true,
  });

  // Check if onboarding is required
  const checkOnboardingStatus = () => {
    if (!user || !tenant) return;

    // Mock data - replace with actual Supabase query
    const mockStatus = {
      isRequired: tenant.subscription_status === 'trialing' && !getStoredProgress()?.completed,
      currentStep: getStoredProgress()?.currentStep || 'hotel_information',
      setupCompleted: getStoredProgress()?.completed || false,
      lastUpdated: getStoredProgress()?.lastUpdated,
    };

    setStatus(mockStatus);

    // Redirect to onboarding if required and not already there
    if (mockStatus.isRequired && !window.location.pathname.includes('/onboarding')) {
      navigate('/onboarding');
    }
  };

  // Get stored progress from localStorage (temporary storage)
  const getStoredProgress = () => {
    try {
      const stored = localStorage.getItem(`onboarding_${user?.id || 'guest'}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Save progress to localStorage (temporary - will be Supabase later)
  const saveProgress = (step: string, data: any, completed = false) => {
    if (!user) return;

    const progress = {
      currentStep: step,
      data,
      completed,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(progress));
    
    setStatus(prev => ({
      ...prev,
      currentStep: step,
      setupCompleted: completed,
      lastUpdated: progress.lastUpdated,
    }));

    // Simulate audit log
    console.log(`Onboarding progress saved: ${user.email} completed step ${step}`);
  };

  // Complete onboarding
  const completeOnboarding = async (finalData: any) => {
    if (!user || !tenant) return;

    try {
      // Simulate API call to mark setup_completed = true
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark as completed
      saveProgress('completed', finalData, true);
      
      // Update status
      setStatus(prev => ({ ...prev, isRequired: false, setupCompleted: true }));

      toast({
        title: "🎉 Setup Complete!",
        description: "Your hotel is now ready for business.",
      });

      // Redirect to owner dashboard
      navigate('/owner-dashboard');
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Reset onboarding (for Super Admin)
  const resetOnboarding = (userId: string) => {
    localStorage.removeItem(`onboarding_${userId}`);
    setStatus({
      isRequired: true,
      currentStep: 'hotel_information',
      setupCompleted: false,
    });
  };

  // Get saved onboarding data
  const getSavedData = () => {
    const progress = getStoredProgress();
    return progress?.data || null;
  };

  // Check status when user/tenant changes
  useEffect(() => {
    checkOnboardingStatus();
  }, [user, tenant]);

  return {
    status,
    saveProgress,
    completeOnboarding,
    resetOnboarding,
    getSavedData,
    checkOnboardingStatus,
  };
}