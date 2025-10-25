import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTodayArrivals } from '@/hooks/useTodayArrivals';
import { useTodayDepartures } from '@/hooks/useTodayDepartures';
import { usePendingPayments } from '@/hooks/usePendingPayments';
import { useFuelLevel } from '@/hooks/useFuelLevel';

export interface FrontDeskAlert {
  id: string;
  type: 'payment' | 'maintenance' | 'compliance' | 'housekeeping' | 'id' | 'deposit';
  message: string;
  priority: 'high' | 'medium' | 'low';
  count?: number;
  room_number?: string;
  guest_name?: string;
  created_at?: string;
}

export interface FrontDeskOverview {
  roomsAvailable: number;
  occupancyRate: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  pendingPayments: number;
  oosRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  dieselLevel: number;
  generatorRuntime: number;
  totalRooms: number;
}

/**
 * Consolidated Front Desk Data Hook
 * 
 * Fetches and aggregates all data needed for the Front Desk Dashboard:
 * - Room statistics and availability
 * - Today's arrivals and departures
 * - Pending payments and alerts
 * - Fuel/generator status
 * - Real-time alerts from multiple sources
 */
export const useFrontDeskData = () => {
  const { tenant } = useAuth();
  
  // Fetch component data using existing hooks
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: arrivals = [], isLoading: arrivalsLoading } = useTodayArrivals();
  const { data: departures = [], isLoading: departuresLoading } = useTodayDepartures();
  const { data: pendingPaymentsList = [], isLoading: paymentsLoading } = usePendingPayments();
  const { data: fuelLevel = 65, isLoading: fuelLoading } = useFuelLevel();

  // Fetch detailed room counts for accurate statistics
  const { data: roomCounts, isLoading: roomCountsLoading } = useQuery({
    queryKey: ['front-desk-room-counts', tenant?.tenant_id],
    meta: { 
      priority: 'critical',
      maxAge: 30000 // 30 seconds
    },
    staleTime: 30 * 1000, // 30 seconds - critical for dashboard
    queryFn: async () => {
      if (!tenant?.tenant_id) return null;

      const { data, error } = await supabase
        .from('rooms')
        .select('status')
        .eq('tenant_id', tenant.tenant_id);

      if (error) throw error;

      const total = data.length;
      const occupied = data.filter(r => r.status === 'occupied').length;
      const available = data.filter(r => r.status === 'available').length;
      const oos = data.filter(r => r.status === 'out_of_service' || r.status === 'out_of_order').length;
      const dirty = data.filter(r => r.status === 'dirty').length;
      const maintenance = data.filter(r => r.status === 'maintenance').length;

      return { total, occupied, available, oos, dirty, maintenance };
    },
    enabled: !!tenant?.tenant_id,
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });

  // Fetch real-time alerts from multiple sources
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['front-desk-alerts', tenant?.tenant_id],
    meta: { 
      priority: 'high',
      maxAge: 60000 // 1 minute
    },
    staleTime: 60 * 1000, // 1 minute - high priority for alerts
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const alertsList: FrontDeskAlert[] = [];

      // 1. Payment alerts - from folios with unpaid balances
      const { data: unpaidFolios } = await supabase
        .from('folios')
        .select(`
          id,
          balance,
          reservation_id,
          reservations!inner (
            guest_name,
            rooms!inner (
              room_number
            )
          )
        `)
        .eq('reservations.tenant_id', tenant.tenant_id)
        .eq('status', 'open')
        .gt('balance', 0)
        .limit(10);

      unpaidFolios?.forEach(folio => {
        const reservation = folio.reservations as any;
        alertsList.push({
          id: `payment-${folio.id}`,
          type: 'payment',
          message: `Room ${reservation?.rooms?.room_number} payment overdue - ₦${folio.balance?.toFixed(2)}`,
          priority: folio.balance > 50000 ? 'high' : 'medium',
          room_number: reservation?.rooms?.room_number,
          guest_name: reservation?.guest_name,
        });
      });

      // 2. Maintenance alerts - from work orders
      const { data: maintenanceIssues } = await supabase
        .from('work_orders')
        .select(`
          id,
          title,
          priority,
          room_id,
          rooms!inner (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .in('status', ['pending', 'in_progress'])
        .eq('priority', 'high')
        .limit(5);

      maintenanceIssues?.forEach(issue => {
        alertsList.push({
          id: `maintenance-${issue.id}`,
          type: 'maintenance',
          message: `Room ${(issue.rooms as any)?.room_number} - ${issue.title}`,
          priority: issue.priority as 'high' | 'medium' | 'low',
          room_number: (issue.rooms as any)?.room_number,
        });
      });

      // 3. Missing ID documents - from reservations
      const today = new Date().toISOString().split('T')[0];
      const { data: missingIds } = await supabase
        .from('reservations')
        .select(`
          id,
          guest_name,
          rooms!inner (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'checked_in')
        .is('guest_id_document_url', null)
        .limit(5);

      missingIds?.forEach(res => {
        alertsList.push({
          id: `id-${res.id}`,
          type: 'compliance',
          message: `Missing ID for Room ${(res.rooms as any)?.room_number} - ${res.guest_name}`,
          priority: 'high',
          room_number: (res.rooms as any)?.room_number,
          guest_name: res.guest_name,
        });
      });

      // 4. Housekeeping alerts - urgent cleaning tasks
      const { data: urgentCleaning } = await supabase
        .from('housekeeping_tasks')
        .select(`
          id,
          title,
          priority,
          room_id,
          rooms!inner (
            room_number
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'pending')
        .eq('priority', 'high')
        .limit(5);

      urgentCleaning?.forEach(task => {
        alertsList.push({
          id: `housekeeping-${task.id}`,
          type: 'housekeeping',
          message: `Room ${(task.rooms as any)?.room_number} - ${task.title}`,
          priority: 'high',
          room_number: (task.rooms as any)?.room_number,
        });
      });

      return alertsList;
    },
    enabled: !!tenant?.tenant_id,
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });

  // Calculate generator runtime estimate based on fuel level
  // Assuming: 100% fuel = ~20 hours runtime, linear relationship
  const generatorRuntime = (fuelLevel / 100) * 20;

  // Aggregate overview data
  const overview: FrontDeskOverview = {
    roomsAvailable: roomCounts?.available || 0,
    occupancyRate: stats.occupancyRate || 0,
    arrivalsToday: arrivals.length,
    departuresToday: departures.length,
    inHouseGuests: roomCounts?.occupied || 0,
    pendingPayments: pendingPaymentsList.length,
    oosRooms: roomCounts?.oos || 0,
    dirtyRooms: roomCounts?.dirty || 0,
    maintenanceRooms: roomCounts?.maintenance || 0,
    dieselLevel: fuelLevel,
    generatorRuntime,
    totalRooms: roomCounts?.total || 0,
  };

  // Aggregate loading state
  const isLoading = 
    statsLoading || 
    arrivalsLoading || 
    departuresLoading || 
    paymentsLoading || 
    fuelLoading || 
    roomCountsLoading ||
    alertsLoading;

  // Group alerts by type with counts
  const groupedAlerts = alerts.reduce((acc, alert) => {
    const existing = acc.find(a => a.type === alert.type);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      acc.push({ ...alert, count: 1 });
    }
    return acc;
  }, [] as FrontDeskAlert[]);

  return {
    overview,
    arrivals,
    departures,
    pendingPayments: pendingPaymentsList,
    alerts,
    groupedAlerts,
    isLoading,
    error: null, // Can be extended to include error handling
  };
};
