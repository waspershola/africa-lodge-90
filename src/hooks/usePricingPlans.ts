import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  price_monthly: number;
  price_annual: number;
  currency: string;
  description: string;
  features: string[];
  room_capacity_min: number;
  room_capacity_max: number;
  max_rooms: number;
  max_staff: number;
  popular: boolean;
  trial_enabled: boolean;
  trial_duration_days: number;
  trial_days: number;
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

export const usePricingPlans = (): UsePricingPlansReturn => {
  const { data: plans = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['plans-real'],
    queryFn: async (): Promise<PricingPlan[]> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;

      return data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price_monthly,
        price_monthly: plan.price_monthly,
        price_annual: plan.price_annual || 0,
        currency: 'NGN',
        description: `Perfect for hotels with up to ${plan.max_rooms} rooms`,
        features: Object.keys(plan.features || {}),
        room_capacity_min: plan.max_rooms <= 25 ? 1 : plan.max_rooms <= 75 ? 26 : 76,
        room_capacity_max: plan.max_rooms,
        max_rooms: plan.max_rooms,
        max_staff: plan.max_staff,
        popular: plan.name.toLowerCase().includes('growth'),
        trial_enabled: true,
        trial_duration_days: plan.trial_days || 14,
        trial_days: plan.trial_days || 14,
        demo_video_url: undefined,
        cta_text: 'Start Free Trial',
        status: 'active' as const,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      })) || [];
    },
    retry: 2,
    staleTime: 300000, // 5 minutes
  });

  const refreshPlans = async () => {
    await refetch();
  };

  return { 
    plans, 
    loading, 
    error: error?.message || null, 
    refreshPlans 
  };
};