import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface GuestAnalytics {
  guest_id: string;
  guest_name: string;
  total_stays: number;
  total_spent: number;
  lifetime_value: number;
  avg_stay_length: number;
  last_stay_date: string;
  preferred_room_type: string;
  is_repeat_guest: boolean;
  guest_tier: string;
}

export interface GuestSearchFilters {
  searchTerm?: string;
  tier?: string;
  repeatGuest?: boolean;
  minStays?: number;
  minSpending?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export function useGuestAnalytics() {
  const { tenant } = useAuth();
  const [analytics, setAnalytics] = useState<GuestAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  });

  const loadGuestAnalytics = useCallback(async (
    filters: GuestSearchFilters = {},
    page: number = 1,
    limit: number = 20,
    reset: boolean = false
  ) => {
    if (!tenant?.tenant_id) return;

    setLoading(true);
    setError(null);

    try {
      // Get analytics from database function
      const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_guest_analytics', {
        p_tenant_id: tenant.tenant_id,
        p_guest_id: null,
        p_start_date: filters.dateRange?.start || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_end_date: filters.dateRange?.end || new Date().toISOString().split('T')[0]
      });

      if (analyticsError) throw analyticsError;

      let filteredData = analyticsData || [];

      // Apply client-side filters
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter((guest: GuestAnalytics) =>
          guest.guest_name.toLowerCase().includes(searchLower) ||
          guest.preferred_room_type.toLowerCase().includes(searchLower)
        );
      }

      if (filters.tier) {
        filteredData = filteredData.filter((guest: GuestAnalytics) =>
          guest.guest_tier === filters.tier
        );
      }

      if (filters.repeatGuest !== undefined) {
        filteredData = filteredData.filter((guest: GuestAnalytics) =>
          guest.is_repeat_guest === filters.repeatGuest
        );
      }

      if (filters.minStays) {
        filteredData = filteredData.filter((guest: GuestAnalytics) =>
          guest.total_stays >= filters.minStays!
        );
      }

      if (filters.minSpending) {
        filteredData = filteredData.filter((guest: GuestAnalytics) =>
          guest.total_spent >= filters.minSpending!
        );
      }

      // Apply pagination
      const total = filteredData.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      if (reset || page === 1) {
        setAnalytics(paginatedData);
      } else {
        setAnalytics(prev => [...prev, ...paginatedData]);
      }

      setPagination({
        page,
        limit,
        total,
        hasMore: endIndex < total
      });

    } catch (err) {
      console.error('Error loading guest analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guest analytics');
    } finally {
      setLoading(false);
    }
  }, [tenant?.tenant_id]);

  const getGuestProfile = useCallback(async (guestId: string): Promise<GuestAnalytics | null> => {
    if (!tenant?.tenant_id) return null;

    try {
      const { data, error } = await supabase.rpc('get_guest_analytics', {
        p_tenant_id: tenant.tenant_id,
        p_guest_id: guestId
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Error loading guest profile:', err);
      return null;
    }
  }, [tenant?.tenant_id]);

  const getGuestBookingHistory = useCallback(async (guestId: string) => {
    if (!tenant?.tenant_id) return [];

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          reservation_number,
          check_in_date,
          check_out_date,
          total_amount,
          status,
          adults,
          children,
          rooms (
            room_number,
            room_types (name)
          ),
          created_at
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('guest_id', guestId)
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading booking history:', err);
      return [];
    }
  }, [tenant?.tenant_id]);

  const getTierMetrics = useCallback(() => {
    const tierCounts = analytics.reduce((acc, guest) => {
      acc[guest.guest_tier] = (acc[guest.guest_tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalGuests = analytics.length;
    const repeatGuestCount = analytics.filter(g => g.is_repeat_guest).length;
    const averageLifetimeValue = analytics.reduce((sum, g) => sum + g.lifetime_value, 0) / totalGuests || 0;
    const totalRevenue = analytics.reduce((sum, g) => sum + g.total_spent, 0);

    return {
      tierCounts,
      totalGuests,
      repeatGuestCount,
      repeatGuestRate: totalGuests > 0 ? (repeatGuestCount / totalGuests) * 100 : 0,
      averageLifetimeValue,
      totalRevenue
    };
  }, [analytics]);

  // Auto-load on mount
  useEffect(() => {
    if (tenant?.tenant_id) {
      loadGuestAnalytics();
    }
  }, [tenant?.tenant_id, loadGuestAnalytics]);

  return {
    analytics,
    loading,
    error,
    pagination,
    loadGuestAnalytics,
    getGuestProfile,
    getGuestBookingHistory,
    getTierMetrics,
    refresh: () => loadGuestAnalytics({}, 1, pagination.limit, true)
  };
}