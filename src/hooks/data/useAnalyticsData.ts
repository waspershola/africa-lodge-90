import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format } from 'date-fns';

export function useRevenueAnalytics(days = 30) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['revenue-analytics', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      // Call fn_daily_revenue function
      const { data: dailyRevenue, error: revenueError } = await supabase
        .rpc('fn_daily_revenue', {
          tenant_uuid: tenantId,
          start_date: startDate,
          end_date: endDate,
        });

      if (revenueError) throw revenueError;

      // Get ADR (Average Daily Rate)
      const { data: adrData, error: adrError } = await supabase
        .rpc('fn_adr', {
          tenant_uuid: tenantId,
          start_date: startDate,
          end_date: endDate,
        });

      if (adrError) throw adrError;

      // Get RevPAR (Revenue Per Available Room)
      const { data: revparData, error: revparError } = await supabase
        .rpc('fn_revpar', {
          tenant_uuid: tenantId,
          start_date: startDate,
          end_date: endDate,
        });

      if (revparError) throw revparError;

      // Calculate totals
      const totalRevenue = dailyRevenue?.reduce((sum: number, day: any) => sum + (day.total_revenue || 0), 0) || 0;
      const avgDailyRevenue = dailyRevenue?.length ? totalRevenue / dailyRevenue.length : 0;

      return {
        dailyRevenue: dailyRevenue || [],
        adr: adrData || 0,
        revpar: revparData || 0,
        totalRevenue,
        avgDailyRevenue,
        chartData: dailyRevenue?.map((day: any) => ({
          date: format(new Date(day.revenue_date), 'MMM dd'),
          revenue: day.total_revenue || 0,
          roomRevenue: day.room_revenue || 0,
          otherRevenue: day.payment_revenue || 0,
        })) || [],
      };
    },
    enabled: !!tenantId,
  });
}

export function useOccupancyAnalytics(days = 30) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['occupancy-analytics', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      // Get daily revenue which includes occupancy data
      const { data: dailyData, error } = await supabase
        .rpc('fn_daily_revenue', {
          tenant_uuid: tenantId,
          start_date: startDate,
          end_date: endDate,
        });

      if (error) throw error;

      // Calculate occupancy stats
      const avgOccupancy = dailyData?.reduce((sum: number, day: any) => sum + (day.occupancy_rate || 0), 0) / (dailyData?.length || 1) || 0;
      const totalOccupiedRooms = dailyData?.reduce((sum: number, day: any) => sum + (day.occupied_rooms || 0), 0) || 0;

      return {
        dailyOccupancy: dailyData || [],
        avgOccupancy: Math.round(avgOccupancy),
        totalOccupiedRooms,
        chartData: dailyData?.map((day: any) => ({
          date: format(new Date(day.revenue_date), 'MMM dd'),
          occupancy: day.occupancy_rate || 0,
          occupied: day.occupied_rooms || 0,
          available: day.available_rooms || 0,
        })) || [],
      };
    },
    enabled: !!tenantId,
  });
}

export function useRoomServiceAnalytics(days = 30) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['room-service-analytics', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = subDays(new Date(), days);

      // Get room service orders from qr_orders
      const { data: orders, error: ordersError } = await supabase
        .from('qr_orders')
        .select('*, rooms(room_number)')
        .eq('tenant_id', tenantId)
        .eq('service_type', 'room_service')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalOrders = orders?.length || 0;
      // Note: qr_orders doesn't have total_amount, would need to calculate from order items
      const totalRevenue = 0; // TODO: Calculate from pos_orders or qr_order_items when available
      const avgOrderValue = 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Group by date for chart
      const ordersByDate = orders?.reduce((acc: any, order: any) => {
        const date = format(new Date(order.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, orders: 0 };
        }
        acc[date].orders += 1;
        return acc;
      }, {});

      return {
        orders: orders || [],
        totalOrders,
        totalRevenue,
        avgOrderValue,
        completionRate: Math.round(completionRate),
        chartData: Object.values(ordersByDate || {}),
      };
    },
    enabled: !!tenantId,
  });
}

export function useHousekeepingAnalytics(days = 30) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['housekeeping-analytics', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = subDays(new Date(), days);

      // Get housekeeping tasks
      const { data: tasks, error } = await supabase
        .from('housekeeping_tasks')
        .select('*, rooms(room_number)')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate stats
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average task duration
      const tasksWithDuration = tasks?.filter(t => t.actual_minutes) || [];
      const avgDuration = tasksWithDuration.length > 0
        ? tasksWithDuration.reduce((sum, t) => sum + (t.actual_minutes || 0), 0) / tasksWithDuration.length
        : 0;

      // Group by date
      const tasksByDate = tasks?.reduce((acc: any, task: any) => {
        const date = format(new Date(task.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, total: 0, completed: 0 };
        }
        acc[date].total += 1;
        if (task.status === 'completed') acc[date].completed += 1;
        return acc;
      }, {});

      return {
        tasks: tasks || [],
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate),
        avgDuration: Math.round(avgDuration),
        chartData: Object.values(tasksByDate || {}),
      };
    },
    enabled: !!tenantId,
  });
}

export function useGuestAnalytics(days = 30) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['guest-analytics', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = subDays(new Date(), days);

      // Get guest analytics
      const { data: analytics, error } = await supabase
        .rpc('get_guest_analytics', {
          p_tenant_id: tenantId,
          p_start_date: format(startDate, 'yyyy-MM-dd'),
          p_end_date: format(new Date(), 'yyyy-MM-dd'),
        });

      if (error) throw error;

      const totalGuests = analytics?.length || 0;
      const repeatGuests = analytics?.filter((g: any) => g.is_repeat_guest).length || 0;
      const repeatRate = totalGuests > 0 ? (repeatGuests / totalGuests) * 100 : 0;
      const avgLifetimeValue = analytics?.reduce((sum: any, g: any) => sum + (g.lifetime_value || 0), 0) / (totalGuests || 1) || 0;

      return {
        guests: analytics || [],
        totalGuests,
        repeatGuests,
        repeatRate: Math.round(repeatRate),
        avgLifetimeValue: Math.round(avgLifetimeValue),
      };
    },
    enabled: !!tenantId,
  });
}
