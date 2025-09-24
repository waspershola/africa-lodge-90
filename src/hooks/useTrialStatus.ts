import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to trial-signup function
      const { data: result, error } = await supabase.functions.invoke('trial-signup', {
        body: {
          hotel_name: 'Demo Hotel', // These will be provided by signup form
          owner_email: 'demo@example.com',
          owner_name: 'Demo Owner',
          plan_id: planId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to start trial');
      }

      if (!result?.success) {
        console.error('Function returned error:', result);
        throw new Error(result?.error || 'Failed to start trial signup');
      }
      
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
      
      setTrial(newTrial);
    } catch (err: any) {
      console.error('Error starting trial:', err);
      
      // Show more specific error messages
      let errorMessage = 'Failed to start trial';
      if (err.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists';
      } else if (err.message?.includes('plan not available')) {
        errorMessage = 'The selected plan is not available';
      } else if (err.message?.includes('tenant')) {
        errorMessage = 'Failed to create hotel account';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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