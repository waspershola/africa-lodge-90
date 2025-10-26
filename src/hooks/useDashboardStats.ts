import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface DashboardStats {
  totalRevenue: number;
  occupancyRate: number;
  totalBookings: number;
  avgDailyRate: number;
  powerCost: number;
  fuelSavings: number;
  roomServiceOrders: number;
  staffCount: number;
  pendingApprovals: number;
  outstandingPayments: number;
}

export const useDashboardStats = () => {
  const { user, tenant } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    occupancyRate: 0,
    totalBookings: 0,
    avgDailyRate: 0,
    powerCost: 0,
    fuelSavings: 0,
    roomServiceOrders: 0,
    staffCount: 0,
    pendingApprovals: 0,
    outstandingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant?.tenant_id) return;

    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        // Fetch reservations data for revenue and booking stats
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('total_amount, created_at, status')
          .eq('tenant_id', tenant.tenant_id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        // Fetch rooms data for occupancy
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id, status')
          .eq('tenant_id', tenant.tenant_id);

        // Fetch staff count
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('tenant_id', tenant.tenant_id)
          .eq('is_active', true);

        // Fetch QR requests (room service)
        const { data: qrRequests, error: qrError } = await supabase
          .from('qr_requests')
          .select('id')
          .eq('tenant_id', tenant.tenant_id)
          .eq('request_type', 'room_service')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        // Fetch power logs for cost tracking
        const { data: powerLogs, error: powerError } = await supabase
          .from('power_logs')
          .select('total_cost')
          .eq('tenant_id', tenant.tenant_id)
          .gte('reading_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        // Fetch salary audit for pending approvals
        const { data: salaryAudits, error: salaryError } = await supabase
          .from('staff_salary_audit')
          .select('id')
          .eq('tenant_id', tenant.tenant_id)
          .eq('approval_stage', 'pending');

        if (reservationsError) console.error('Reservations error:', reservationsError);
        if (roomsError) console.error('Rooms error:', roomsError);
        if (usersError) console.error('Users error:', usersError);
        if (qrError) console.error('QR orders error:', qrError);
        if (powerError) console.error('Power logs error:', powerError);
        if (salaryError) console.error('Salary audit error:', salaryError);

        // Calculate stats
        const totalRevenue = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
        const totalBookings = reservations?.length || 0;
        const avgDailyRate = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        
        const totalRooms = rooms?.length || 1;
        const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        const staffCount = users?.length || 0;
        const roomServiceOrders = qrRequests?.length || 0;
        const powerCost = powerLogs?.reduce((sum, p) => sum + (p.total_cost || 0), 0) || 0;
        const pendingApprovals = salaryAudits?.length || 0;

        setStats({
          totalRevenue,
          occupancyRate,
          totalBookings,
          avgDailyRate,
          powerCost,
          fuelSavings: powerCost * 0.15, // Estimated savings
          roomServiceOrders,
          staffCount,
          pendingApprovals,
          outstandingPayments: 0 // Placeholder
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [tenant?.tenant_id]);

  return { stats, loading };
};