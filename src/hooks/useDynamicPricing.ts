// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";

export interface PricingRule {
  id: string;
  tenant_id: string;
  name: string;
  type: "occupancy" | "demand" | "seasonal" | "competitor" | "event";
  is_active: boolean;
  trigger_condition: string;
  trigger_value: number;
  trigger_operator: ">" | "<" | "=" | ">=" | "<=";
  adjustment_type: "percentage" | "fixed";
  adjustment_value: number;
  max_increase: number;
  max_decrease: number;
  room_categories: string[];
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface DynamicPricingSettings {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  update_frequency: number;
  max_price_increase: number;
  max_price_decrease: number;
  competitor_sync: boolean;
  demand_forecast: boolean;
  event_integration: boolean;
  created_at: string;
  updated_at: string;
}

export function usePricingRules() {
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["pricing-rules", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
}

export function useDynamicPricingSettings() {
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useQuery({
    queryKey: ["dynamic-pricing-settings", tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("dynamic_pricing_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) throw error;
      
      // Create default settings if none exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("dynamic_pricing_settings")
          .insert({
            tenant_id: tenantId,
            is_enabled: false,
            update_frequency: 30,
            max_price_increase: 50,
            max_price_decrease: 30,
            competitor_sync: false,
            demand_forecast: false,
            event_integration: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings;
      }
      
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (rule: Omit<PricingRule, "id" | "tenant_id" | "created_at" | "updated_at">) => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("pricing_rules")
        .insert({
          ...rule,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", tenantId] });
      toast({
        title: "Success",
        description: "Pricing rule created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating pricing rule:", error);
      toast({
        title: "Error",
        description: "Failed to create pricing rule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", tenantId] });
      toast({
        title: "Success",
        description: "Pricing rule updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating pricing rule:", error);
      toast({
        title: "Error",
        description: "Failed to update pricing rule",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDynamicPricingSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, tenant } = useMultiTenantAuth();
  const tenantId = tenant?.tenant_id || user?.tenant_id;

  return useMutation({
    mutationFn: async (settings: Partial<DynamicPricingSettings>) => {
      if (!tenantId) throw new Error("No tenant ID");

      const { data, error } = await supabase
        .from("dynamic_pricing_settings")
        .update(settings)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-settings", tenantId] });
      toast({
        title: "Success",
        description: "Dynamic pricing settings updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating dynamic pricing settings:", error);
      toast({
        title: "Error",
        description: "Failed to update dynamic pricing settings",
        variant: "destructive",
      });
    },
  });
}