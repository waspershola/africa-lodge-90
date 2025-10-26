import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface DashboardAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  type: 'overbooking' | 'inventory' | 'maintenance' | 'payment' | 'checkins';
  created_at: string;
}

export function useDashboardAlerts() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'alerts', tenant?.tenant_id],
    queryFn: async (): Promise<DashboardAlert[]> => {
      if (!tenant?.tenant_id) return [];

      const alerts: DashboardAlert[] = [];
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      try {
        // Check for overbooking
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id, status')
          .eq('tenant_id', tenant.tenant_id);

        const { data: reservations } = await supabase
          .from('reservations')
          .select('id, check_in_date, status')
          .eq('tenant_id', tenant.tenant_id)
          .eq('status', 'confirmed')
          .lte('check_in_date', tomorrow.toISOString().split('T')[0]);

        const totalRooms = rooms?.length || 0;
        const confirmedReservations = reservations?.length || 0;

        if (confirmedReservations > totalRooms) {
          alerts.push({
            id: 'overbooking-' + Date.now(),
            level: 'critical',
            message: `${confirmedReservations - totalRooms} rooms overbooked for tonight`,
            type: 'overbooking',
            created_at: new Date().toISOString()
          });
        }

        // Check for low inventory
        const availableRooms = rooms?.filter(r => r.status === 'available').length || 0;
        if (availableRooms <= 3 && availableRooms > 0) {
          alerts.push({
            id: 'inventory-' + Date.now(),
            level: 'warning',
            message: `Low inventory: Only ${availableRooms} rooms available tomorrow`,
            type: 'inventory',
            created_at: new Date().toISOString()
          });
        }

        // Check for pending check-ins
        const { data: pendingCheckins } = await supabase
          .from('reservations')
          .select('id')
          .eq('tenant_id', tenant.tenant_id)
          .eq('status', 'confirmed')
          .eq('check_in_date', today.toISOString().split('T')[0]);

        const pendingCount = pendingCheckins?.length || 0;
        if (pendingCount > 0) {
          alerts.push({
            id: 'checkins-' + Date.now(),
            level: 'info',
            message: `${pendingCount} pending check-ins require confirmation`,
            type: 'checkins',
            created_at: new Date().toISOString()
          });
        }

        // Check for maintenance issues
        const { data: maintenanceIssues } = await supabase
          .from('work_orders')
          .select('id')
          .eq('tenant_id', tenant.tenant_id)
          .in('status', ['pending', 'in_progress'])
          .eq('priority', 'high');

        const maintenanceCount = maintenanceIssues?.length || 0;
        if (maintenanceCount > 0) {
          alerts.push({
            id: 'maintenance-' + Date.now(),
            level: 'warning',
            message: `${maintenanceCount} high-priority maintenance requests pending`,
            type: 'maintenance',
            created_at: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('Error fetching dashboard alerts:', error);
      }

      return alerts.sort((a, b) => {
        const levelPriority = { critical: 3, warning: 2, info: 1 };
        return levelPriority[b.level] - levelPriority[a.level];
      });
    },
    enabled: !!tenant?.tenant_id,
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
}