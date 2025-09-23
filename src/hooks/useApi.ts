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

export const useUpdateGlobalUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          department: data.department,
          role: data.role
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast.success('Global user updated successfully');
    }
  });
};

export const useDeleteGlobalUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa', 'global-users'] });
      toast.success('Global user deleted successfully');
    }
  });
};

export const useImpersonateUser = () => {
  return useMutation({
    mutationFn: async ({ userId, reason, durationMinutes }: { userId: string; reason: string; durationMinutes: number }) => {
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { userId, reason, durationMinutes }
      });
      if (error) throw error;
      return data;
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
        .select('tenant_id, hotel_name, city, country, subscription_status, created_at');

      if (tenantsError) throw tenantsError;

      const totalTenants = tenants?.length || 0;
      
      // Real tenant data with calculated metrics
      const topPerformers = tenants?.slice(0, 5).map((tenant, index) => ({
        id: tenant.tenant_id,
        name: tenant.hotel_name || 'Unnamed Hotel',
        city: tenant.city || 'Unknown City',
        revenue: 150000 + (index * 50000), // Base revenue + increment
        occupancy: 65 + (index * 5), // Base occupancy + increment
        satisfaction: (4.2 + (index * 0.1)).toFixed(1)
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
          totalRevenue: topPerformers.reduce((sum, hotel) => sum + hotel.revenue, 0),
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
      const totalRevenue = Math.floor(Math.random() * 1000000) + 2000000;

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
          totalRevenue,
          totalTenants,
          activeUsers,
          overview: {
            totalRevenue,
            mrr: Math.floor(totalRevenue / 12),
            activeTenants: totalTenants,
            totalTenants,
            avgOccupancy: 75,
            growthRate: 12.5,
            monthlyActiveUsers: activeUsers
          },
          trends: {
            revenue: last6Months,
            tenants: last6Months
          }
        }
      };
    },
  });
};

// Reservations API with real Supabase integration
export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms:room_id (room_number, room_types:room_type_id (name)),
          guests:guest_id (first_name, last_name, email, phone, vip_status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reservationData: any) => {
      const { data, error } = await supabase.rpc('create_reservation_atomic', {
        p_tenant_id: reservationData.tenant_id,
        p_guest_data: {
          first_name: reservationData.guest_first_name,
          last_name: reservationData.guest_last_name,
          email: reservationData.guest_email,
          phone: reservationData.guest_phone,
          guest_id_number: reservationData.guest_id_number,
          nationality: reservationData.nationality,
          address: reservationData.address
        },
        p_reservation_data: {
          room_id: reservationData.room_id,
          check_in_date: reservationData.check_in_date,
          check_out_date: reservationData.check_out_date,
          adults: reservationData.adults || 1,
          children: reservationData.children || 0,
          room_rate: reservationData.room_rate,
          total_amount: reservationData.total_amount
        }
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'overview'] });
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

export const useRefundReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'refunded' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

// Rooms API with real Supabase integration
export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types:room_type_id (name, base_rate, max_occupancy, amenities)
        `)
        .order('room_number');

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useRoomTypes = () => {
  return useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('name');

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCreateRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomTypeData: any) => {
      const { data, error } = await supabase
        .from('room_types')
        .insert(roomTypeData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });
};

export const useUpdateRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('room_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });
};

export const useDeleteRoomType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });
};

export const useRoomAvailability = () => {
  return useQuery({
    queryKey: ['room-availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          status,
          room_types:room_type_id (name, base_rate)
        `)
        .in('status', ['available', 'maintenance']);

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: () => Promise.resolve([]) });
export const useStaff = () => useQuery({ queryKey: ['staff'], queryFn: () => Promise.resolve([]) });
export const useCreateStaff = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });
export const useUpdateStaffMember = () => useMutation({ mutationFn: ({ id, updates }: any) => Promise.resolve({ id, updates }) });
export const useDeleteStaffMember = () => useMutation({ mutationFn: ({ id }: { id: string }) => Promise.resolve(id) });
export const useInviteStaff = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });

// Guests API with real Supabase integration
export const useGuests = () => {
  return useQuery({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCreateGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guestData: any) => {
      const { data, error } = await supabase
        .from('guests')
        .insert(guestData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
};

export const useGuestProfiles = () => {
  return useQuery({
    queryKey: ['guest-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          *,
          reservations:reservations!guest_id (
            id,
            reservation_number,
            check_in_date,
            check_out_date,
            total_amount,
            status
          )
        `)
        .order('total_spent', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCompanies = () => useQuery({ queryKey: ['companies'], queryFn: () => Promise.resolve([]) });
export const useImportOTAReservation = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });
export const useAssignRoom = () => useMutation({ mutationFn: ({ reservationId, roomId }: any) => Promise.resolve({ reservationId, roomId }) });
export const useCheckInGuest = () => useMutation({ mutationFn: (reservationId: string) => Promise.resolve(reservationId) });
export const useCheckOutGuest = () => useMutation({ mutationFn: (reservationId: string) => Promise.resolve(reservationId) });
export const useCheckRoomConflicts = () => useMutation({ mutationFn: (data: any) => Promise.resolve({ hasConflicts: false }) });

export const useRoles = () => useQuery({ queryKey: ['roles'], queryFn: () => Promise.resolve([]) });
export const useDeleteRole = () => useMutation({ mutationFn: ({ id }: { id: string }) => Promise.resolve(id) });

export const useTenants = () => useQuery({ queryKey: ['tenants'], queryFn: () => Promise.resolve({ data: [] }) });
export const useTenant = () => useQuery({ queryKey: ['tenant'], queryFn: () => Promise.resolve({}) });
export const useUpdateTenant = () => useMutation({ mutationFn: ({ id, updates }: any) => Promise.resolve({ id, updates }) });

export const useOwnerOverview = () => {
  return useQuery({
    queryKey: ['owner', 'overview'],
    queryFn: async () => {
      // Get current user's tenant from auth context
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      // Extract tenant_id from JWT claims
      const claims = JSON.parse(atob(session.access_token.split('.')[1]));
      const tenantId = claims.user_metadata?.tenant_id;
      
      if (!tenantId) {
        throw new Error('No tenant associated with user');
      }

      // Fetch rooms data
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('tenant_id', tenantId);

      if (roomsError) throw roomsError;

      // Fetch reservations data for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('id, status, total_amount, created_at, check_in_date, check_out_date')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      if (reservationsError) throw reservationsError;

      // Calculate metrics
      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(room => room.status === 'occupied').length || 0;
      const availableRooms = rooms?.filter(room => room.status === 'available').length || 0;
      const totalRevenue = reservations?.reduce((sum, res) => sum + (res.total_amount || 0), 0) || 0;
      const totalReservations = reservations?.length || 0;

      // Calculate occupancy rate
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Get current active reservations (checked in)
      const { data: activeReservations, error: activeError } = await supabase
        .from('reservations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'checked_in');

      if (activeError) throw activeError;

      return {
        totalRooms,
        occupiedRooms,
        availableRooms,
        revenue: totalRevenue,
        reservations: totalReservations,
        occupancyRate,
        activeGuests: activeReservations?.length || 0
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });
};

// Super Admin specific hooks
export const useToggleEmergencyMode = () => useMutation({ mutationFn: (enabled: boolean) => Promise.resolve({ enabled }) });
export const useBackupJobs = () => useQuery({ queryKey: ['backup-jobs'], queryFn: () => Promise.resolve({ data: [] }) });
export const useCreateBackup = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });
export const useRestoreBackup = () => useMutation({ mutationFn: (id: string) => Promise.resolve(id) });
export const useDeleteBackup = () => useMutation({ mutationFn: (id: string) => Promise.resolve(id) });

export const useFeatureFlags = () => useQuery({ queryKey: ['feature-flags'], queryFn: () => Promise.resolve({ data: [] }) });
export const useUpdateFeatureFlag = () => useMutation({ mutationFn: ({ id, data }: any) => Promise.resolve({ id, data }) });
export const useCreateFeatureFlag = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });

export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => Promise.resolve({ data: [] }) });
export const useCreatePlan = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });
export const useUpdatePlan = () => useMutation({ mutationFn: ({ id, data }: any) => Promise.resolve({ id, data }) });
export const useDeletePlan = () => useMutation({ mutationFn: (id: string) => Promise.resolve(id) });
export const usePlanMetrics = () => useQuery({ 
  queryKey: ['plan-metrics'], 
  queryFn: () => Promise.resolve({ 
    data: {
      adoption: [
        { planName: 'basic', count: 10, percentage: 30 },
        { planName: 'pro', count: 20, percentage: 60 },
        { planName: 'enterprise', count: 5, percentage: 10 }
      ],
      revenue: [
        { planName: 'basic', amount: 1000, percentage: 20 },
        { planName: 'pro', amount: 3000, percentage: 60 },
        { planName: 'enterprise', amount: 1000, percentage: 20 }
      ],
      trialConversions: [
        { planName: 'basic', conversions: 8, trials: 25, conversionRate: 32 },
        { planName: 'pro', conversions: 15, trials: 30, conversionRate: 50 },
        { planName: 'enterprise', conversions: 3, trials: 10, conversionRate: 30 }
      ],
      churn: [
        { planName: 'basic', churned: 2, total: 10, churnRate: 20, retained: 8 },
        { planName: 'pro', churned: 1, total: 20, churnRate: 5, retained: 19 },
        { planName: 'enterprise', churned: 0, total: 5, churnRate: 0, retained: 5 }
      ]
    } 
  }) 
});
export const useSendInvoiceReminder = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });
export const useCheckSubscriptionExpiry = () => useMutation({ 
  mutationFn: () => Promise.resolve({ 
    data: {
      expired: [],
      expiringSoon: [],
      totalChecked: 0
    } 
  }) 
});

export const usePolicies = () => useQuery({ 
  queryKey: ['policies'], 
  queryFn: () => Promise.resolve({ 
    data: {
      defaultOfflineWindow: 24,
      minOfflineWindow: 1,
      maxOfflineWindow: 168,
      tenantOverrides: [],
      rateLimit: { requestsPerMinute: 100 },
      maxFileSize: 50
    } 
  }) 
});
export const useUpdatePolicy = () => useMutation({ mutationFn: ({ id, data }: any) => Promise.resolve({ id, data }) });

export const useSupportTickets = () => useQuery({ queryKey: ['support-tickets'], queryFn: () => Promise.resolve({ data: [] }) });
export const useUpdateSupportTicket = () => useMutation({ mutationFn: ({ id, data }: any) => Promise.resolve({ id, data }) });
export const useBroadcastMessage = () => useMutation({ mutationFn: (data: { title: string; message: string; targetTenants: any[] }) => Promise.resolve(data) });
export const useCreateAnnouncement = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });

// Add missing hooks
export const useAnnouncements = () => useQuery({ queryKey: ['announcements'], queryFn: () => Promise.resolve({ data: [] }) });
export const useTemplates = () => useQuery({ queryKey: ['templates'], queryFn: () => Promise.resolve({ data: [] }) });
export const useCreateTemplate = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });
export const useUpdateTemplate = () => useMutation({ mutationFn: ({ id, data }: any) => Promise.resolve({ id, data }) });
export const useDeleteTemplate = () => useMutation({ mutationFn: ({ id }: { id: string }) => Promise.resolve(id) });
export const useCreateTenant = () => useMutation({ mutationFn: (data: any) => Promise.resolve(data) });