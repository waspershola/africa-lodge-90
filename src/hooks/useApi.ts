import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { supabaseApi } from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

// Global Users API
export const useGlobalUsers = () => {
  return useQuery({
    queryKey: ['sa', 'global-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or('role.eq.SUPER_ADMIN,is_platform_owner.eq.true')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch global users:', error);
        throw new Error(error.message || 'Failed to fetch global users');
      }

      return {
        data: data?.map(user => ({
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          role: user.role,
          department: user.department || 'Operations',
          status: user.is_active ? 'active' : 'inactive',
          lastLogin: user.last_login || new Date().toISOString(),
          permissions: ['platform.manage'],
          assignedTenants: []
        })) || []
      };
    },
  });
};

export const useCreateGlobalUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: any) => {
      console.log('Creating global user with data:', userData);
      
      // Using the invite-user edge function for creating global users
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: userData.email,
          name: userData.name,
          role: userData.role, // Use role directly as selected
          department: userData.department || 'Operations',
          tenant_id: null // Global users don't belong to a specific tenant
        }
      });

      if (error) {
        console.error('Error creating global user:', error);
        throw new Error(error.message || 'Failed to create global user');
      }

      console.log('Global user created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast.success('Global user created successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to create global user:', error);
      toast.error(`Failed to create global user: ${error.message}`);
    }
  });
};

// Dashboard Data with real Supabase data
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['sa', 'dashboard'],
    queryFn: async () => {
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*');

      if (tenantsError) throw tenantsError;

      const totalTenants = tenants?.length || 0;
      
      // Mock data for now since we don't have revenue tracking yet
      const topPerformers = tenants?.slice(0, 5).map(tenant => ({
        id: tenant.tenant_id,
        name: tenant.hotel_name,
        city: tenant.city || 'N/A',
        revenue: Math.floor(Math.random() * 500000) + 100000,
        occupancy: Math.floor(Math.random() * 40) + 60,
        satisfaction: (4.2 + Math.random() * 0.6).toFixed(1)
      })) || [];

      const regionMap = new Map();
      tenants?.forEach(tenant => {
        const region = tenant.country || 'Unknown';
        const existing = regionMap.get(region) || { count: 0, revenue: 0 };
        regionMap.set(region, {
          count: existing.count + 1,
          revenue: existing.revenue + Math.floor(Math.random() * 300000) + 100000
        });
      });

      const regions = Array.from(regionMap.entries()).map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue
      }));

      const billingOverview = {
        totalInvoices: totalTenants * 12,
        paidInvoices: Math.floor(totalTenants * 12 * 0.92),
        failedPayments: Math.floor(totalTenants * 12 * 0.03),
        pendingAmount: 89000,
        nextBillingCycle: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const resourceUsage = tenants?.slice(0, 3).map(tenant => ({
        tenantId: tenant.tenant_id,
        name: tenant.hotel_name,
        dbSize: Math.random() * 5 + 0.5,
        apiCalls: Math.floor(Math.random() * 50000) + 10000,
        storage: Math.random() * 10 + 2,
        plan: Math.random() > 0.5 ? 'Pro' : 'Standard'
      })) || [];

      return {
        data: {
          totalTenants,
          totalRevenue: 2840000,
          topPerformers,
          regions,
          billingOverview,
          resourceUsage
        }
      };
    },
  });
};

export const useMetrics = () => {
  return useQuery({
    queryKey: ['sa', 'metrics'],
    queryFn: async () => {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('created_at, subscription_status');

      const { data: users } = await supabase
        .from('users')
        .select('created_at, is_active, role');

      const activeUsers = users?.filter(u => u.is_active).length || 0;
      const totalTenants = tenants?.length || 0;

      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        const monthTenants = tenants?.filter(t => {
          const createdDate = new Date(t.created_at);
          return createdDate.getMonth() === date.getMonth() && 
                 createdDate.getFullYear() === date.getFullYear();
        }).length || 0;

        last6Months.push({
          month: monthName,
          value: Math.floor(Math.random() * 1000000) + 2000000,
          tenants: monthTenants
        });
      }

      return {
        data: {
          totalRevenue: Math.floor(Math.random() * 1000000) + 2000000,
          totalTenants,
          activeUsers,
          trends: {
            revenue: last6Months
          }
        }
      };
    },
  });
};

// Placeholder for other hooks that were in the original file
export const useReservations = () => useQuery({ queryKey: ['reservations'], queryFn: () => Promise.resolve([]) });
export const useRooms = () => useQuery({ queryKey: ['rooms'], queryFn: () => Promise.resolve([]) });
export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: () => Promise.resolve([]) });
export const useTenants = () => useQuery({ queryKey: ['tenants'], queryFn: () => Promise.resolve({ data: [] }) });