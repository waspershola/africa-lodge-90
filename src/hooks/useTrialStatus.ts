import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { retryWithBackoff, getUserFriendlyErrorMessage, isRetryableError } from '@/lib/retry-utils';
import { toast } from '@/hooks/use-toast';

export interface TrialStatus {
  id: string;
  tenant_id: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  is_active: boolean;
  is_expired: boolean;
  status: 'active' | 'expired' | 'converted' | 'cancelled';
}

export interface UseTrialStatusReturn {
  trial: TrialStatus | null;
  loading: boolean;
  error: string | null;
  refreshTrial: () => Promise<void>;
  startTrial: (planId: string) => Promise<void>;
  convertTrial: () => Promise<void>;
}

// Mock trial data for frontend development
const mockTrial: TrialStatus = {
  id: 'trial-123',
  tenant_id: 'hotel-1',
  plan_id: 'plan-growth',
  plan_name: 'Growth',
  start_date: '2025-09-15T00:00:00Z',
  end_date: '2025-09-29T23:59:59Z',
  days_remaining: 10,
  is_active: true,
  is_expired: false,
  status: 'active'
};

export const useTrialStatus = (): UseTrialStatusReturn => {
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const loadTrialStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // In production, this will be:
      // const response = await fetch('/api/trial-status');
      // const data = await response.json();
      
      // Check if user has an active trial
      const hasActiveTrial = localStorage.getItem('hasActiveTrial') === 'true';
      
      if (hasActiveTrial) {
        const trialData = {
          ...mockTrial,
          days_remaining: calculateDaysRemaining(mockTrial.end_date),
          is_expired: calculateDaysRemaining(mockTrial.end_date) <= 0
        };
        setTrial(trialData);
      } else {
        setTrial(null);
      }
    } catch (err) {
      setError('Failed to load trial status');
      console.error('Error loading trial:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrial = async () => {
    await loadTrialStatus();
  };

  const startTrial = async (planId: string) => {
    const operationId = crypto.randomUUID();
    console.log(`[useTrialStatus][${operationId}] Starting trial signup:`, { planId });
    
    try {
      setLoading(true);
      setError(null);
      
      // Show loading toast for long operations
      const loadingTimeout = setTimeout(() => {
        toast({
          title: "Processing...",
          description: "This is taking longer than expected. Please wait...",
        });
      }, 5000);
      
      // Make API call with retry logic
      const result = await retryWithBackoff(
        async () => {
          console.log(`[useTrialStatus][${operationId}] Invoking trial-signup function...`);
          
          const { data, error } = await supabase.functions.invoke('trial-signup', {
            body: {
              hotel_name: 'Demo Hotel', // These will be provided by signup form
              owner_email: 'demo@example.com',
              owner_name: 'Demo Owner',
              plan_id: planId
            }
          });

          console.log(`[useTrialStatus][${operationId}] Function response:`, { 
            success: data?.success, 
            error_code: data?.error_code,
            error: error?.message || data?.error,
            status: data?.status
          });

          if (error) {
            console.error(`[useTrialStatus][${operationId}] Edge function error:`, error);
            throw new Error(error.message || 'Failed to start trial');
          }

          if (!data?.success) {
            console.error(`[useTrialStatus][${operationId}] Function returned error:`, data);
            const errorMsg = data?.error || 'Failed to start trial signup';
            const err = new Error(errorMsg);
            (err as any).error_code = data?.error_code;
            throw err;
          }
          
          return data;
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          onRetry: (attempt, error) => {
            console.warn(`[useTrialStatus][${operationId}] Retry attempt ${attempt}:`, error.message);
            toast({
              title: "Retrying...",
              description: `Attempt ${attempt} of 3. Please wait...`,
              variant: "default",
            });
          }
        }
      );
      
      clearTimeout(loadingTimeout);
      
      // SECURITY: Use secure storage for trial status
      const { SecureStorage } = await import('../lib/secure-storage');
      SecureStorage.setSessionData('hasActiveTrial', 'true');
      
      const newTrial: TrialStatus = {
        id: `trial-${Date.now()}`,
        tenant_id: 'hotel-1',
        plan_id: planId,
        plan_name: 'Growth',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 14,
        is_active: true,
        is_expired: false,
        status: 'active'
      };
      
      console.log(`[useTrialStatus][${operationId}] Trial created successfully:`, result);
      
      setTrial(newTrial);
      
      toast({
        title: "Success!",
        description: "Your free trial has been activated. Welcome!",
      });
    } catch (err: any) {
      console.error(`[useTrialStatus][${operationId}] Error starting trial:`, {
        error: err.message,
        error_code: err.error_code,
        stack: err.stack
      });
      
      // Get user-friendly error message
      const errorMessage = getUserFriendlyErrorMessage(err);
      
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: "Trial Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertTrial = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this will be:
      // const response = await fetch('/api/convert-trial', { method: 'POST' });
      
      localStorage.removeItem('hasActiveTrial');
      setTrial(null);
    } catch (err) {
      setError('Failed to convert trial');
      console.error('Error converting trial:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialStatus();
    
    // Check trial status every minute
    const interval = setInterval(loadTrialStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    trial,
    loading,
    error,
    refreshTrial,
    startTrial,
    convertTrial
  };
};