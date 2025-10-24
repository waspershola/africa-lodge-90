import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface DashboardTask {
  id: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  count: number;
  action?: () => void;
}

export function useDashboardTasks() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'tasks', tenant?.tenant_id],
    queryFn: async (): Promise<DashboardTask[]> => {
      if (!tenant?.tenant_id) return [];

      const tasks: DashboardTask[] = [];

      try {
        // Check for pending payments
        const { data: pendingPayments } = await supabase
          .from('folios')
          .select('id, balance')
          .eq('tenant_id', tenant.tenant_id)
          .eq('status', 'open')
          .gt('balance', 0);

        const paymentsCount = pendingPayments?.length || 0;
        if (paymentsCount > 0) {
          tasks.push({
            id: 'payments-' + Date.now(),
            task: `Process ${paymentsCount} pending payments`,
            priority: 'high',
            count: paymentsCount
          });
        }

        // Check for maintenance requests
        const { data: maintenanceRequests } = await supabase
          .from('work_orders')
          .select('id, priority')
          .eq('tenant_id', tenant.tenant_id)
          .eq('status', 'pending');

        const maintenanceCount = maintenanceRequests?.length || 0;
        if (maintenanceCount > 0) {
          const highPriority = maintenanceRequests?.filter(r => r.priority === 'high').length || 0;
          tasks.push({
            id: 'maintenance-' + Date.now(),
            task: 'Review maintenance requests',
            priority: highPriority > 0 ? 'high' : 'medium',
            count: maintenanceCount
          });
        }

        // Check for housekeeping tasks
        const { data: housekeepingTasks } = await supabase
          .from('housekeeping_tasks')
          .select('id, priority')
          .eq('tenant_id', tenant.tenant_id)
          .eq('status', 'pending');

        const housekeepingCount = housekeepingTasks?.length || 0;
        if (housekeepingCount > 0) {
          tasks.push({
            id: 'housekeeping-' + Date.now(),
            task: 'Complete housekeeping tasks',
            priority: 'medium',
            count: housekeepingCount
          });
        }

        // Check for room rate updates needed
        const today = new Date();
        const dayOfWeek = today.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
        
        if (isWeekend) {
          tasks.push({
            id: 'rates-' + Date.now(),
            task: 'Update room rates for weekend',
            priority: 'low',
            count: 1
          });
        }

        // Check for QR requests needing attention
        const { data: qrRequests } = await supabase
          .from('qr_requests')
          .select('id')
          .eq('tenant_id', tenant.tenant_id)
          .eq('status', 'pending')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const qrRequestsCount = qrRequests?.length || 0;
        if (qrRequestsCount > 0) {
          tasks.push({
            id: 'qr-requests-' + Date.now(),
            task: `Handle ${qrRequestsCount} QR service requests`,
            priority: 'medium',
            count: qrRequestsCount
          });
        }

      } catch (error) {
        console.error('Error fetching dashboard tasks:', error);
      }

      return tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    },
    enabled: !!tenant?.tenant_id,
    // Phase 8: Removed polling - real-time updates via useUnifiedRealtime handle freshness
  });
}
