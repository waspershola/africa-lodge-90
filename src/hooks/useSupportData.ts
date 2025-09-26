import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGlobalStats() {
  return useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      // Get total user count by distinct tenant_id  
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id');
      
      const uniqueTenants = new Set(userData?.map(u => u.tenant_id).filter(Boolean));
      const tenantCount = uniqueTenants.size;

      // Get total user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active users (recent login)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data: activeUsersData } = await supabase
        .from('users')
        .select('tenant_id')
        .gte('last_login', oneWeekAgo.toISOString());
        
      const activeUniqueTenants = new Set(activeUsersData?.map(u => u.tenant_id).filter(Boolean));
      const activeTenantsCount = activeUniqueTenants.size;

      // Get open tickets count
      const { count: openTicketsCount } = await supabase
        .from('global_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      return {
        totalTenants: tenantCount || 0,
        totalUsers: userCount || 0,
        activeTenants: activeTenantsCount || 0,
        openTickets: openTicketsCount || 0,
      };
    },
  });
}

export function useGlobalTickets(limit = 10) {
  return useQuery({
    queryKey: ['global-tickets', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_tickets')
        .select(`
          id,
          ticket_number,
          title,
          status,
          priority,
          category,
          created_at,
          tenant_id
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Get tenant info separately if tickets exist
      const ticketsWithTenants = await Promise.all(
        (data || []).map(async (ticket) => {
          if (ticket.tenant_id) {
            const { data: tenantData } = await supabase
              .from('users')
              .select('tenant_id')
              .eq('tenant_id', ticket.tenant_id)
              .limit(1)
              .single();
            
            return {
              ...ticket,
              tenants: { hotel_name: `Tenant ${ticket.tenant_id.slice(0, 8)}` }
            };
          }
          return { ...ticket, tenants: { hotel_name: 'Platform' } };
        })
      );
      
      return ticketsWithTenants;
    },
  });
}

export function useTenantHealth(limit = 10) {
  return useQuery({
    queryKey: ['tenant-health', limit],
    queryFn: async () => {
      // Get unique tenants from users table
      const { data: usersData, error } = await supabase
        .from('users')
        .select('tenant_id, role, updated_at, is_active')
        .not('tenant_id', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group by tenant_id and get latest info
      const tenantMap = new Map();
      usersData?.forEach(user => {
        if (!tenantMap.has(user.tenant_id) || 
            new Date(user.updated_at) > new Date(tenantMap.get(user.tenant_id).updated_at)) {
          tenantMap.set(user.tenant_id, {
            id: user.tenant_id,
            hotel_name: `Hotel ${user.tenant_id.slice(0, 8)}`,
            subscription_status: user.is_active ? 'active' : 'inactive',
            updated_at: user.updated_at,
            plans: { name: 'Standard' }
          });
        }
      });

      return Array.from(tenantMap.values()).slice(0, limit);
    },
  });
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      // Get user activity as proxy for tenant health
      const { data: usersData } = await supabase
        .from('users')
        .select('tenant_id, is_active, last_login')
        .not('tenant_id', 'is', null);

      // Group by tenant and calculate metrics
      const tenantMap = new Map();
      usersData?.forEach(user => {
        const tenantId = user.tenant_id;
        if (!tenantMap.has(tenantId)) {
          tenantMap.set(tenantId, { active: 0, total: 0, lastActivity: null });
        }
        
        const tenant = tenantMap.get(tenantId);
        tenant.total++;
        if (user.is_active) tenant.active++;
        
        if (user.last_login && (!tenant.lastActivity || new Date(user.last_login) > new Date(tenant.lastActivity))) {
          tenant.lastActivity = user.last_login;
        }
      });

      // Calculate health metrics
      const totalTenants = tenantMap.size;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let activeTenants = 0;
      let trialTenants = 0;
      
      tenantMap.forEach(tenant => {
        if (tenant.lastActivity && new Date(tenant.lastActivity) > oneWeekAgo) {
          activeTenants++;
        }
        // Assume newer tenants are in trial
        if (tenant.total <= 5) {
          trialTenants++;
        }
      });

      return {
        trialTenants,
        activeTenants,
        expiredTenants: totalTenants - activeTenants,
        totalRevenue: 0, // TODO: Calculate from payments when billing is implemented
      };
    },
  });
}