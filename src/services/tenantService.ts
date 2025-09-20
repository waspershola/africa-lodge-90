import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
type User = Database['public']['Tables']['users']['Row'];
type Plan = Database['public']['Tables']['plans']['Row'];

export interface TenantWithOwner extends Tenant {
  owner_email?: string;
  owner_name?: string;
  plan_name?: string;
  total_rooms?: number;
}

export interface CreateTenantAndOwnerData {
  hotel_name: string;
  hotel_slug: string;
  owner_email: string;
  owner_name: string;
  plan_id: string;
  city?: string;
  address?: string;
  phone?: string;
}

// Generate secure temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Hash password for storage
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hotel_saas_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const tenantService = {
  // Get all tenants with owner information
  async getAllTenants(): Promise<TenantWithOwner[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        plans!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get owner information and room counts for each tenant
    const tenantsWithRooms = await Promise.all(
      (data || []).map(async (tenant) => {
        // Get owner info - use type assertion since owner_id might not be in types
        let owner = null;
        const tenantWithOwnerId = tenant as any;
        if (tenantWithOwnerId.owner_id) {
          const ownerResult = await supabase
            .from('users')
            .select('email, name')
            .eq('id', tenantWithOwnerId.owner_id)
            .single();
          owner = ownerResult.data;
        }

        // Count rooms
        const { count } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.tenant_id);

        return {
          ...tenant,
          owner_email: owner?.email,
          owner_name: owner?.name,
          plan_name: tenant.plans?.name,
          total_rooms: count || 0
        };
      })
    );

    return tenantsWithRooms;
  },

  // Get tenant metrics
  async getTenantMetrics() {
    // Get all tenants count
    const { count: totalTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    // Get trial tenants
    const { count: trialTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'trialing');

    // Get expired tenants
    const { count: expiredTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'expired');

    // Calculate monthly revenue (mock calculation based on plans)
    const { data: plans } = await supabase.from('plans').select('*');
    const monthlyRevenue = (activeSubscriptions || 0) * 65000; // Default rate

    return {
      total_tenants: totalTenants || 0,
      active_subscriptions: activeSubscriptions || 0,
      trial_tenants: trialTenants || 0,
      expired_tenants: expiredTenants || 0,
      monthly_revenue: monthlyRevenue,
      churn_rate: 0.05
    };
  },

  // Create tenant and owner via edge function
  async createTenantAndOwner(data: CreateTenantAndOwnerData): Promise<{ tenant: Tenant; tempPassword: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-tenant-and-owner', {
        body: data
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to create tenant and owner: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Unknown error occurred');
      }

      return { 
        tenant: result.tenant, 
        tempPassword: result.tempPassword // Return the actual temp password for display
      };

    } catch (error) {
      console.error('CreateTenantAndOwner failed:', error);
      throw error;
    }
  },

  // Send temporary password email
  async sendTempPasswordEmail(email: string, hotelName: string, tempPassword: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-temp-password', {
        body: {
          to_email: email,
          hotel_name: hotelName,
          temp_password: tempPassword,
          login_url: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send temporary password email:', error);
      // Don't throw here as the tenant/user creation was successful
      // Log the error and continue
    }
  },

  // Update tenant
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Suspend tenant
  async suspendTenant(tenantId: string): Promise<void> {
    await this.updateTenant(tenantId, { subscription_status: 'suspended' });
  },

  // Reactivate tenant
  async reactivateTenant(tenantId: string): Promise<void> {
    await this.updateTenant(tenantId, { subscription_status: 'active' });
  },

  // Delete tenant (soft delete by suspension)
  async deleteTenant(tenantId: string): Promise<void> {
    // Instead of hard delete, suspend the tenant
    await this.suspendTenant(tenantId);
  },

  // Get plans
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};