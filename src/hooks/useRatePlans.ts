import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface RatePlan {
  id: string;
  tenant_id: string;
  room_type_id?: string;
  name: string;
  type: string;
  description?: string;
  base_rate: number;
  adjustment_type: string;
  adjustment: number;
  final_rate: number;
  start_date: string;
  end_date: string;
  min_stay?: number;
  max_stay?: number;
  advance_booking?: number;
  restrictions?: string[];
  corporate_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatePlanCreate {
  name: string;
  type: string;
  description?: string;
  room_type_id?: string;
  adjustment_type: string;
  adjustment: number;
  start_date: string;
  end_date: string;
  min_stay?: number;
  max_stay?: number;
  advance_booking?: number;
  restrictions?: string[];
  corporate_code?: string;
}

export function useRatePlans() {
  const { tenant } = useAuth();
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRatePlans = useCallback(async () => {
    if (!tenant?.tenant_id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('rate_plans')
        .select(`
          *,
          room_types (
            name,
            base_rate
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatePlans((data || []) as RatePlan[]);
    } catch (err) {
      console.error('Error loading rate plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rate plans');
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id]);

  const createRatePlan = useCallback(async (ratePlanData: RatePlanCreate): Promise<boolean> => {
    if (!tenant?.tenant_id) return false;

    try {
      // First get the room type base rate if room_type_id is provided
      let baseRate = 0;
      if (ratePlanData.room_type_id) {
        const { data: roomType, error: roomTypeError } = await supabase
          .from('room_types')
          .select('base_rate')
          .eq('id', ratePlanData.room_type_id)
          .eq('tenant_id', tenant.tenant_id)
          .single();

        if (roomTypeError) throw roomTypeError;
        baseRate = roomType.base_rate;
      }

      // Calculate final rate
      const finalRate = ratePlanData.adjustment_type === 'percentage'
        ? baseRate * (1 + ratePlanData.adjustment / 100)
        : baseRate + ratePlanData.adjustment;

      const { error } = await supabase
        .from('rate_plans')
        .insert({
          tenant_id: tenant.tenant_id,
          ...ratePlanData,
          base_rate: baseRate,
          final_rate: finalRate,
          is_active: true
        });

      if (error) throw error;

      await loadRatePlans();
      return true;
    } catch (err) {
      console.error('Error creating rate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to create rate plan');
      return false;
    }
  }, [tenant?.tenant_id, loadRatePlans]);

  const updateRatePlan = useCallback(async (id: string, updates: Partial<RatePlanCreate>): Promise<boolean> => {
    if (!tenant?.tenant_id) return false;

    try {
      let updateData = { ...updates };

      // Recalculate final rate if adjustment changed
      if (updates.adjustment !== undefined || updates.adjustment_type !== undefined) {
        const { data: currentPlan } = await supabase
          .from('rate_plans')
          .select('base_rate, adjustment_type, adjustment')
          .eq('id', id)
          .single();

        if (currentPlan) {
          const adjustmentType = updates.adjustment_type || currentPlan.adjustment_type;
          const adjustment = updates.adjustment !== undefined ? updates.adjustment : currentPlan.adjustment;
          const finalRate = adjustmentType === 'percentage'
            ? currentPlan.base_rate * (1 + adjustment / 100)
            : currentPlan.base_rate + adjustment;

          updateData = { ...updateData, final_rate: finalRate } as any;
        }
      }

      const { error } = await supabase
        .from('rate_plans')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      await loadRatePlans();
      return true;
    } catch (err) {
      console.error('Error updating rate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to update rate plan');
      return false;
    }
  }, [tenant?.tenant_id, loadRatePlans]);

  const deleteRatePlan = useCallback(async (id: string): Promise<boolean> => {
    if (!tenant?.tenant_id) return false;

    try {
      const { error } = await supabase
        .from('rate_plans')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      await loadRatePlans();
      return true;
    } catch (err) {
      console.error('Error deleting rate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rate plan');
      return false;
    }
  }, [tenant?.tenant_id, loadRatePlans]);

  const toggleRatePlan = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('rate_plans')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;
      await loadRatePlans();
      return true;
    } catch (err) {
      console.error('Error toggling rate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle rate plan');
      return false;
    }
  }, [tenant?.tenant_id, loadRatePlans]);

  const applyRatePlanBulk = useCallback(async (
    ratePlanId: string,
    roomTypeIds: string[],
    startDate: string,
    endDate: string
  ): Promise<number> => {
    if (!tenant?.tenant_id) return 0;

    try {
      const { data, error } = await supabase.rpc('apply_rate_plan_bulk', {
        p_tenant_id: tenant.tenant_id,
        p_rate_plan_id: ratePlanId,
        p_room_type_ids: roomTypeIds,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      await loadRatePlans();
      return data || 0;
    } catch (err) {
      console.error('Error applying rate plan bulk:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply rate plan');
      return 0;
    }
  }, [tenant?.tenant_id, loadRatePlans]);

  const getRoomTypes = useCallback(async () => {
    if (!tenant?.tenant_id) return [];

    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('id, name, base_rate')
        .eq('tenant_id', tenant.tenant_id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading room types:', err);
      return [];
    }
  }, [tenant?.tenant_id]);

  // Auto-load on mount
  useEffect(() => {
    if (tenant?.tenant_id) {
      loadRatePlans();
    }
  }, [tenant?.tenant_id, loadRatePlans]);

  return {
    ratePlans,
    loading,
    error,
    createRatePlan,
    updateRatePlan,
    deleteRatePlan,
    toggleRatePlan,
    applyRatePlanBulk,
    getRoomTypes,
    refresh: loadRatePlans
  };
}