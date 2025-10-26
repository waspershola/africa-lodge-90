import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface User {
  id: string;
  tenant_id?: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS' | 'ACCOUNTING';
  name?: string;
  phone?: string;
  department?: string;
  is_active: boolean;
  shift_start?: string;
  shift_end?: string;
  last_login?: string;
  force_reset: boolean;
  temp_password_hash?: string;
  temp_expires?: string;
  created_at?: string;
  updated_at?: string;
  
  // Extended profile fields
  address?: string;
  nin?: string;
  date_of_birth?: string;
  nationality?: string;
  employee_id?: string;
  hire_date?: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  bank_name?: string;
  account_number?: string;
  passport_number?: string;
  drivers_license?: string;
}

export interface CreateUserData {
  email: string;
  role: User['role'];
  name?: string;
  phone?: string;
  department?: string;
  shift_start?: string;
  shift_end?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.tenant_id) {
      loadUsers();
    }
  }, [currentUser?.tenant_id]);

  const loadUsers = async () => {
    if (!currentUser?.tenant_id) return;

    setLoading(true);
    try {
      // Use the secure function for non-super-admin users
      if (currentUser.role !== 'SUPER_ADMIN') {
        // For managers and other staff, use the secure function that only returns safe data
        const { data, error } = await supabase.rpc('get_tenant_staff_safe', {
          target_tenant_id: currentUser.tenant_id
        });

        if (error) {
          console.error('Error loading users:', error);
          setError(error.message);
          return;
        }

        // Map the secure data to the User interface with default values for missing fields
        const mappedUsers: User[] = (data || []).map(user => ({
          ...user,
          role: user.role as User['role'], // Properly type the role
          tenant_id: currentUser.tenant_id,
          force_reset: false, // Not included in secure function response
          temp_password_hash: undefined,
          temp_expires: undefined,
          created_at: undefined,
          updated_at: undefined,
          // Sensitive fields not included in secure response
          address: undefined,
          nin: undefined,
          date_of_birth: undefined,
          nationality: undefined,
          emergency_contact_name: undefined,
          emergency_contact_phone: undefined,
          emergency_contact_relationship: undefined,
          next_of_kin_name: undefined,
          next_of_kin_phone: undefined,
          next_of_kin_relationship: undefined,
          bank_name: undefined,
          account_number: undefined,
          passport_number: undefined,
          drivers_license: undefined,
          shift_start: undefined,
          shift_end: undefined,
          phone: undefined
        }));

        setUsers(mappedUsers);
        setError(null);
        return;
      }

      // Super admins can see all user data
      let query = supabase
        .from('users')
        .select(`
          *,
          address,
          nin,
          date_of_birth,
          nationality,
          employee_id,
          hire_date,
          employment_type,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          next_of_kin_name,
          next_of_kin_phone,
          next_of_kin_relationship,
          bank_name,
          account_number,
          passport_number,
          drivers_license
        `)
        .order('created_at', { ascending: false });

      // Super admins can see all users, others only see users in their tenant
      if (currentUser.role !== 'SUPER_ADMIN') {
        query = query.eq('tenant_id', currentUser.tenant_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        role: user.role as User['role'],
        name: user.name,
        phone: user.phone,
        department: user.department,
        is_active: user.is_active,
        shift_start: user.shift_start,
        shift_end: user.shift_end,
        last_login: user.last_login,
        force_reset: user.force_reset,
        temp_password_hash: user.temp_password_hash,
        temp_expires: user.temp_expires,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // Extended profile fields
        address: user.address,
        nin: user.nin,
        date_of_birth: user.date_of_birth,
        nationality: user.nationality,
        employee_id: user.employee_id,
        hire_date: user.hire_date,
        employment_type: user.employment_type,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        emergency_contact_relationship: user.emergency_contact_relationship,
        next_of_kin_name: user.next_of_kin_name,
        next_of_kin_phone: user.next_of_kin_phone,
        next_of_kin_relationship: user.next_of_kin_relationship,
        bank_name: user.bank_name,
        account_number: user.account_number,
        passport_number: user.passport_number,
        drivers_license: user.drivers_license
      }));

      setUsers(processedUsers);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    if (!currentUser?.tenant_id) return;

    try {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12);

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        user_metadata: {
          role: userData.role,
          tenant_id: currentUser.tenant_id,
          force_reset: true
        }
      });

      if (authError) throw authError;

      // The user record should be created automatically via trigger
      // But let's make sure it exists with the correct data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone,
          department: userData.department,
          shift_start: userData.shift_start,
          shift_end: userData.shift_end,
          force_reset: true
        })
        .eq('id', authData.user.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'user_created',
          resource_type: 'user',
          resource_id: authData.user.id,
          actor_id: currentUser.id,
          actor_email: currentUser.email,
          actor_role: currentUser.role,
          tenant_id: currentUser.tenant_id,
          description: `User created: ${userData.email} with role ${userData.role}`,
          new_values: userData as any
        }]);

      await loadUsers();
      
      toast({
        title: "User Created",
        description: `User ${userData.email} created successfully. Temporary password: ${tempPassword}`,
      });

      return { user: authData.user, tempPassword };
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create user",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'user_updated',
          resource_type: 'user',
          resource_id: userId,
          actor_id: currentUser.id,
          actor_email: currentUser.email,
          actor_role: currentUser.role,
          tenant_id: currentUser.tenant_id,
          description: `User updated`,
          new_values: updates as any
        }]);

      await loadUsers();
      
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const resetUserPassword = async (userId: string, temporary = true) => {
    if (!currentUser) return;

    try {
      // Use reset-user-password edge function
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { 
          user_id: userId,
          send_email: true
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      await loadUsers();
      
      toast({
        title: "Password Reset",
        description: `Password reset successfully. Temporary password: ${data.temp_password}`,
      });

      return data.temp_password;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reset password",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deactivateUser = async (userId: string) => {
    if (!currentUser) return;

    try {
      // Use delete-user edge function
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { 
          user_id: userId
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }

      await loadUsers();
      
      toast({
        title: "User Removed",
        description: "User has been removed successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove user",
        variant: "destructive"
      });
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    resetUserPassword,
    deactivateUser,
    refresh: loadUsers
  };
}