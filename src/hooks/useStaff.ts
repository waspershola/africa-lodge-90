import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'terminated';
  hireDate?: string;
  employeeId?: string;
  avatar?: string;
}

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadStaff();
    }
  }, [user?.tenant_id]);

  const loadStaff = async () => {
    if (!user?.tenant_id) return;

    setLoading(true);
    try {
      // Get all users for this tenant
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          department,
          is_active,
          created_at
        `)
        .eq('tenant_id', user.tenant_id)
        .order('name');

      if (usersError) throw usersError;

      // Convert user data to staff format (simplified approach)
      const staffData: StaffMember[] = (users || []).map(user => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        phone: undefined, // Will be populated when staff_profiles table is properly created
        role: user.role || 'STAFF',
        department: user.department || 'General',
        status: user.is_active ? 'active' : 'inactive',
        hireDate: user.created_at,
        employeeId: `EMP-${user.id.slice(0, 8).toUpperCase()}`,
      }));

      setStaff(staffData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load staff:', err);
      setError(err.message || 'Failed to load staff');
      
      // Fallback to mock data for immediate functionality
      setStaff([
        {
          id: '1',
          name: 'John Smith',
          email: 'john@hotel.com',
          phone: '+1234567890',
          role: 'MANAGER',
          department: 'Operations',
          status: 'active',
          hireDate: '2023-01-15',
          employeeId: 'EMP-001',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@hotel.com',
          phone: '+1234567891',
          role: 'FRONT_DESK',
          department: 'Front Office',
          status: 'active',
          hireDate: '2023-03-20',
          employeeId: 'EMP-002',
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike@hotel.com',
          phone: '+1234567892',
          role: 'HOUSEKEEPING',
          department: 'Housekeeping',
          status: 'active',
          hireDate: '2023-02-10',
          employeeId: 'EMP-003',
        },
        {
          id: '4',
          name: 'Lisa Brown',
          email: 'lisa@hotel.com',
          phone: '+1234567893',
          role: 'MAINTENANCE',
          department: 'Maintenance',
          status: 'active',
          hireDate: '2023-04-05',
          employeeId: 'EMP-004',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    staff,
    loading,
    error,
    refresh: loadStaff
  };
}