import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RatePlan {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: 'seasonal' | 'corporate' | 'promotional' | 'package';
  room_type_id?: string;
  base_rate: number;
  adjustment_type: 'fixed' | 'percentage';
  adjustment: number;
  final_rate: number;
  start_date: string;
  end_date: string;
  min_stay: number;
  max_stay: number;
  advance_booking: number;
  is_active: boolean;
  restrictions?: string[];
  corporate_code?: string;
  created_at: string;
  updated_at: string;
}

export const useRatePlans = () => {
  return useQuery({
    queryKey: ['rate-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCreateRatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ratePlanData: Omit<RatePlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rate_plans')
        .insert(ratePlanData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
      toast.success('Rate plan created successfully');
    },
  });
};

export const useUpdateRatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RatePlan> }) => {
      const { data, error } = await supabase
        .from('rate_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
      toast.success('Rate plan updated successfully');
    },
  });
};

export const useDeleteRatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rate_plans')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
      toast.success('Rate plan deleted successfully');
    },
  });
};