// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface OccupancyStats {
  stat_date: string;
  occupied_rooms: number;
  total_rooms: number;
  occupancy_rate: number;
}

export interface GuestStats {
  month_year: string;
  unique_guests: number;
  total_reservations: number;
  avg_reservation_value: number;
  total_revenue: number;
  avg_stay_length: number;
  repeat_guests: number;
  retention_rate: number;
}

export interface RevenueByMethod {
  payment_date: string;
  payment_method: string;
  total_amount: number;
  transaction_count: number;
  avg_transaction_amount: number;
}

export function useReporting() {
  const { tenant } = useAuth();
  const [occupancyStats, setOccupancyStats] = useState<OccupancyStats[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats[]>([]);
  const [revenueByMethod, setRevenueByMethod] = useState<RevenueByMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOccupancyStats = async (startDate?: string, endDate?: string) => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase.rpc('get_occupancy_stats', {
        p_tenant_id: tenant.tenant_id,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      setOccupancyStats(data || []);
    } catch (err) {
      console.error('Error loading occupancy stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load occupancy stats');
    }
  };

  const loadGuestStats = async (monthsBack: number = 12) => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase.rpc('get_guest_stats', {
        p_tenant_id: tenant.tenant_id,
        p_months_back: monthsBack
      });

      if (error) throw error;
      setGuestStats(data || []);
    } catch (err) {
      console.error('Error loading guest stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guest stats');
    }
  };

  const loadRevenueByMethod = async (startDate?: string, endDate?: string) => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase.rpc('get_revenue_by_payment_method', {
        p_tenant_id: tenant.tenant_id,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      setRevenueByMethod(data || []);
    } catch (err) {
      console.error('Error loading revenue by method:', err);
      setError(err instanceof Error ? err.message : 'Failed to load revenue by method');
    }
  };

  const refreshReportingViews = async () => {
    try {
      const { error } = await supabase.rpc('refresh_reporting_views');
      if (error) throw error;
      
      // Reload all data after refresh
      await Promise.all([
        loadOccupancyStats(),
        loadGuestStats(),
        loadRevenueByMethod()
      ]);
    } catch (err) {
      console.error('Error refreshing reporting views:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh reporting views');
    }
  };

  useEffect(() => {
    if (tenant?.tenant_id) {
      const loadAllReports = async () => {
        setLoading(true);
        await Promise.all([
          loadOccupancyStats(),
          loadGuestStats(),
          loadRevenueByMethod()
        ]);
        setLoading(false);
      };

      loadAllReports();
    }
  }, [tenant?.tenant_id]);

  return {
    occupancyStats,
    guestStats,
    revenueByMethod,
    loading,
    error,
    loadOccupancyStats,
    loadGuestStats,
    loadRevenueByMethod,
    refreshReportingViews
  };
}