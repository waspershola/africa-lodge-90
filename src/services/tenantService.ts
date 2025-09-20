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

  // Create tenant and owner with rollback capability
  async createTenantAndOwner(data: CreateTenantAndOwnerData): Promise<{ tenant: Tenant; tempPassword: string }> {
    const tempPassword = generateTempPassword();
    const tempPasswordHash = await hashPassword(tempPassword);
    const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Step 1: Create tenant record
      const tenantData: TenantInsert = {
        hotel_name: data.hotel_name,
        hotel_slug: data.hotel_slug,
        plan_id: data.plan_id,
        subscription_status: 'trialing',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        setup_completed: false,
        onboarding_step: 'hotel_information',
        city: data.city || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.owner_email,
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        country: 'Nigeria',
        settings: {},
        brand_colors: {}
      };

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single();

      if (tenantError) throw new Error(`Failed to create tenant: ${tenantError.message}`);

      try {
        // Step 2: Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: data.owner_email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name: data.owner_name,
            role: 'OWNER',
            tenant_id: tenant.tenant_id
          }
        });

        if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);

        try {
          // Step 3: Create user record in users table
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authUser.user.id,
              email: data.owner_email,
              name: data.owner_name,
              role: 'OWNER',
              tenant_id: tenant.tenant_id,
              force_reset: true,
              temp_password_hash: tempPasswordHash,
              temp_expires: tempExpires.toISOString(),
              is_active: true
            });

          if (userError) throw new Error(`Failed to create user record: ${userError.message}`);

          // Step 4: Update tenant with owner_id (need to cast to any due to type limitations)
          const { error: updateError } = await supabase
            .from('tenants')
            .update({ owner_id: authUser.user.id } as any)
            .eq('tenant_id', tenant.tenant_id);

          if (updateError) throw new Error(`Failed to update tenant owner: ${updateError.message}`);

          return { tenant, tempPassword };

        } catch (error) {
          // Rollback: Delete auth user
          await supabase.auth.admin.deleteUser(authUser.user.id);
          throw error;
        }

      } catch (error) {
        // Rollback: Delete tenant
        await supabase.from('tenants').delete().eq('tenant_id', tenant.tenant_id);
        throw error;
      }

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