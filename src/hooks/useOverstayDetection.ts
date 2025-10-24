import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface OverstayRecord {
  reservation_id: string;
  room_id: string;
  guest_name: string;
  expected_checkout: string;
  hours_overdue: number;
  folio_balance: number;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Phase 5: Enhanced Overstay Detection Hook
 * Identifies guests who have overstayed with configurable grace period
 */
export function useOverstayDetection(graceHours: number = 3) {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ['overstays', tenant?.tenant_id, graceHours],
    queryFn: async () => {
      if (!tenant?.tenant_id) {
        throw new Error('No tenant context available');
      }

      console.log('[Overstay Detection] Checking for overstays:', {
        tenantId: tenant.tenant_id,
        graceHours,
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase.rpc('detect_overstays', {
        p_tenant_id: tenant.tenant_id,
        p_grace_hours: graceHours,
      });

      if (error) {
        console.error('[Overstay Detection] Error:', error);
        throw error;
      }

      const overstays = data as OverstayRecord[];
      
      if (overstays && overstays.length > 0) {
        console.warn('[Overstay Detection] Found overstays:', {
          count: overstays.length,
          critical: overstays.filter(o => o.severity === 'critical').length,
          warning: overstays.filter(o => o.severity === 'warning').length,
        });
      } else {
        console.log('[Overstay Detection] No overstays detected');
      }

      return overstays || [];
    },
    enabled: !!tenant?.tenant_id,
    refetchInterval: 10 * 60 * 1000, // Phase 8: Increased to 10 minutes (computed data, not real-time critical)
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
  });
}
