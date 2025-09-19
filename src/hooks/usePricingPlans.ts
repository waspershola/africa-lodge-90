import { useState, useEffect } from 'react';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  room_capacity_min: number;
  room_capacity_max: number;
  popular: boolean;
  trial_enabled: boolean;
  trial_duration_days: number;
  demo_video_url?: string;
  cta_text: string;
  status: 'active' | 'draft' | 'deprecated';
  created_at: string;
  updated_at: string;
}

export interface UsePricingPlansReturn {
  plans: PricingPlan[];
  loading: boolean;
  error: string | null;
  refreshPlans: () => Promise<void>;
}

// Mock data for frontend development
const mockPlans: PricingPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 35000,
    currency: 'NGN',
    description: 'Perfect for boutique hotels up to 25 rooms',
    features: [
      'Core bookings & front desk',
      'Local payments (POS/Cash/Transfer)',
      'Basic reports & analytics',
      'Email notifications',
      'Offline front desk (24hrs)'
    ],
    room_capacity_min: 1,
    room_capacity_max: 25,
    popular: false,
    trial_enabled: true,
    trial_duration_days: 14,
    cta_text: 'Start Free Trial',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'plan-growth',
    name: 'Growth',
    price: 65000,
    currency: 'NGN',
    description: 'Ideal for mid-size hotels 26-75 rooms',
    features: [
      'Everything in Starter',
      'POS & F&B management',
      'Room Service QR module',
      'Extended reports & charts',
      'Power & fuel tracking',
      'WhatsApp notifications'
    ],
    room_capacity_min: 26,
    room_capacity_max: 75,
    popular: true,
    trial_enabled: true,
    trial_duration_days: 14,
    demo_video_url: 'https://youtube.com/watch?v=example',
    cta_text: 'Start Free Trial',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: 120000,
    currency: 'NGN',
    description: 'Full-featured for large hotels 75+ rooms',
    features: [
      'Everything in Growth',
      'Kiosk self check-in',
      'Multi-property dashboard',
      'Advanced analytics & AI',
      'Custom integrations',
      'Priority support'
    ],
    room_capacity_min: 76,
    room_capacity_max: 9999,
    popular: false,
    trial_enabled: true,
    trial_duration_days: 30,
    demo_video_url: 'https://youtube.com/watch?v=example-pro',
    cta_text: 'Contact Sales',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const usePricingPlans = (): UsePricingPlansReturn => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this will be:
      // const response = await fetch('/api/pricing-plans');
      // const data = await response.json();
      // setPlans(data.filter(plan => plan.status === 'active'));
      
      setPlans(mockPlans.filter(plan => plan.status === 'active'));
    } catch (err) {
      setError('Failed to load pricing plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPlans = async () => {
    await loadPlans();
  };

  useEffect(() => {
    loadPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refreshPlans
  };
};