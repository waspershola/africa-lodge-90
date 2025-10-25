// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface ActiveShiftStaff {
  staff_id: string;
  staff_name: string;
  role: string;
  device_slug?: string;
  start_time: string;
  expertise: string[];
}

export const useQRShiftRouting = () => {
  const { tenant } = useAuth();

  const { data: activeStaff, isLoading } = useQuery({
    queryKey: ['active-shift-staff', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('shift_sessions')
        .select(`
          staff_id,
          role,
          start_time,
          devices!left(slug)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Get user names separately to avoid relation issues
      const staffIds = data?.map(session => session.staff_id) || [];
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', staffIds);

      if (usersError) throw usersError;

      const usersMap = new Map(users?.map(user => [user.id, user.name]) || []);

      return (data || []).map(session => ({
        staff_id: session.staff_id,
        staff_name: usersMap.get(session.staff_id) || 'Unknown',
        role: session.role,
        device_slug: session.devices?.slug,
        start_time: session.start_time,
        expertise: getStaffExpertise(session.role)
      }));
    },
    enabled: !!tenant?.tenant_id,
    staleTime: 30000 // 30 seconds
  });

  const findBestStaffForService = (serviceType: string): ActiveShiftStaff | null => {
    if (!activeStaff?.length) return null;

    // Priority mapping for services
    const servicePriorities: Record<string, string[]> = {
      'room_service': ['POS', 'FRONT_DESK', 'MANAGER'],
      'housekeeping': ['HOUSEKEEPING', 'MANAGER', 'FRONT_DESK'],
      'maintenance': ['MAINTENANCE', 'MANAGER', 'FRONT_DESK'],
      'concierge': ['FRONT_DESK', 'MANAGER'],
      'laundry': ['HOUSEKEEPING', 'FRONT_DESK', 'MANAGER'],
      'food_beverage': ['POS', 'FRONT_DESK', 'MANAGER']
    };

    const preferredRoles = servicePriorities[serviceType] || ['FRONT_DESK', 'MANAGER'];
    
    // Find staff matching preferred roles (in priority order)
    for (const role of preferredRoles) {
      const matchingStaff = activeStaff.find(staff => 
        staff.role === role && staff.expertise.includes(serviceType)
      );
      if (matchingStaff) return matchingStaff;
    }

    // Fallback to any active staff with general expertise
    return activeStaff.find(staff => 
      staff.expertise.includes('general') || staff.role === 'MANAGER'
    ) || activeStaff[0] || null;
  };

  const getShiftCoverage = () => {
    if (!activeStaff?.length) {
      return {
        hasActiveCoverage: false,
        missingRoles: ['FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE'],
        activeRoles: [],
        totalActiveStaff: 0
      };
    }

    const activeRoles = [...new Set(activeStaff.map(staff => staff.role))];
    const criticalRoles = ['FRONT_DESK', 'HOUSEKEEPING'];
    const missingRoles = criticalRoles.filter(role => !activeRoles.includes(role));

    return {
      hasActiveCoverage: missingRoles.length === 0,
      missingRoles,
      activeRoles,
      totalActiveStaff: activeStaff.length
    };
  };

  return {
    activeStaff: activeStaff || [],
    isLoading,
    findBestStaffForService,
    getShiftCoverage
  };
};

// Helper function to determine staff expertise based on role
const getStaffExpertise = (role: string): string[] => {
  const expertiseMap: Record<string, string[]> = {
    'FRONT_DESK': ['concierge', 'room_service', 'general'],
    'HOUSEKEEPING': ['housekeeping', 'laundry', 'maintenance'],
    'MAINTENANCE': ['maintenance', 'housekeeping'],
    'POS': ['room_service', 'food_beverage', 'concierge'],
    'MANAGER': ['general', 'room_service', 'concierge', 'housekeeping', 'maintenance'],
    'OWNER': ['general', 'room_service', 'concierge', 'housekeeping', 'maintenance']
  };

  return expertiseMap[role] || ['general'];
};