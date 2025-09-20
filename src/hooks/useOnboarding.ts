import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

  // Check if onboarding is required from Supabase
  const checkOnboardingStatus = useCallback(async () => {
    if (!user || !tenant) return;

    try {
      // Check tenant setup_completed status
      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('setup_completed, onboarding_step, subscription_status')
        .eq('tenant_id', tenant.tenant_id)
        .single();

      if (error) throw error;

      const mockStatus = {
        isRequired: !tenantData.setup_completed && tenantData.subscription_status === 'trialing',
        currentStep: tenantData.onboarding_step || 'hotel_information',
        setupCompleted: tenantData.setup_completed || false,
        lastUpdated: new Date().toISOString(),
      };

      setStatus(mockStatus);

      // Redirect to onboarding if required and not already there
      if (mockStatus.isRequired && !window.location.pathname.includes('/onboarding')) {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Fallback to localStorage for development
      const fallbackStatus = {
        isRequired: tenant.subscription_status === 'trialing' && !getStoredProgress()?.completed,
        currentStep: getStoredProgress()?.currentStep || 'hotel_information',
        setupCompleted: getStoredProgress()?.completed || false,
        lastUpdated: getStoredProgress()?.lastUpdated,
      };
      setStatus(fallbackStatus);
    }
  }, [user, tenant, navigate]);

  // Get stored progress from localStorage (fallback)
  const getStoredProgress = () => {
    try {
      const stored = localStorage.getItem(`onboarding_${user?.id || 'guest'}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Save progress to Supabase
  const saveProgress = async (step: string, data: any, completed = false) => {
    if (!user || !tenant) return;

    try {
      // Update tenant onboarding step and setup completion status
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          onboarding_step: step,
          setup_completed: completed,
          updated_at: new Date().toISOString(),
          // Save onboarding data to settings if provided
          ...(data && { settings: data })
        })
        .eq('tenant_id', tenant.tenant_id);

      if (tenantError) throw tenantError;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: completed ? 'onboarding_completed' : 'onboarding_step_completed',
          resource_type: 'tenant',
          resource_id: tenant.tenant_id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: tenant.tenant_id,
          description: `Onboarding ${completed ? 'completed' : `step ${step} completed`}`,
          new_values: { step, completed, data }
        }]);

      // Update local state
      setStatus(prev => ({
        ...prev,
        currentStep: step,
        setupCompleted: completed,
        lastUpdated: new Date().toISOString(),
      }));

      // Also save to localStorage as fallback
      const progress = {
        currentStep: step,
        data,
        completed,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(progress));

      console.log(`Onboarding progress saved: ${user.email} completed step ${step}`);
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
      // Fallback to localStorage
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
    }
  };

  // Complete onboarding
  const completeOnboarding = async (finalData: any) => {
    if (!user || !tenant) return;

    try {
      // Mark setup as completed in Supabase
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          setup_completed: true,
          onboarding_step: 'completed',
          updated_at: new Date().toISOString(),
          // Merge final data with existing settings
          settings: {
            onboarding_completed_at: new Date().toISOString(),
            ...finalData
          }
        })
        .eq('tenant_id', tenant.tenant_id);

      if (tenantError) throw tenantError;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'onboarding_completed',
          resource_type: 'tenant',
          resource_id: tenant.tenant_id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: tenant.tenant_id,
          description: 'Hotel onboarding process completed successfully',
          new_values: { setup_completed: true, final_data: finalData }
        }]);

      // Mark as completed locally
      await saveProgress('completed', finalData, true);
      
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
      console.error('Error completing onboarding:', error);
      toast({
        title: "Setup Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  // Reset onboarding (for Super Admin)
  const resetOnboarding = async (userId: string) => {
    try {
      // Reset tenant setup status
      const { error } = await supabase
        .from('tenants')
        .update({
          setup_completed: false,
          onboarding_step: 'hotel_information',
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant?.tenant_id);

      if (error) throw error;

      // Remove localStorage data
      localStorage.removeItem(`onboarding_${userId}`);
      
      setStatus({
        isRequired: true,
        currentStep: 'hotel_information',
        setupCompleted: false,
      });

      toast({
        title: "Onboarding Reset",
        description: "Onboarding has been reset successfully.",
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset onboarding.",
        variant: "destructive",
      });
    }
  };

  // Get saved onboarding data
  const getSavedData = async () => {
    if (!tenant) return null;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('settings')
        .eq('tenant_id', tenant.tenant_id)
        .single();

      if (error) throw error;
      return data.settings || null;
    } catch (error) {
      console.error('Error getting saved data:', error);
      // Fallback to localStorage
      const progress = getStoredProgress();
      return progress?.data || null;
    }
  };

  // Check status when user/tenant changes
  useEffect(() => {
    checkOnboardingStatus();
  }, [user, tenant, checkOnboardingStatus]);

  return {
    status,
    saveProgress,
    completeOnboarding,
    resetOnboarding,
    getSavedData,
    checkOnboardingStatus,
  };
}