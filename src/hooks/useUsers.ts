import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface User {
  id: string;
  tenant_id?: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS';
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
      let query = supabase
        .from('users')
        .select('*')
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
        updated_at: user.updated_at
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
      const tempPassword = Math.random().toString(36).slice(-12);
      
      // Reset password via admin API
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword
      });

      if (authError) throw authError;

      if (temporary) {
        // Mark user for forced password reset
        await supabase
          .from('users')
          .update({
            force_reset: true,
            temp_password_hash: tempPassword, // In production, this should be hashed
            temp_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          })
          .eq('id', userId);
      }

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'password_reset',
          resource_type: 'user',
          resource_id: userId,
          actor_id: currentUser.id,
          actor_email: currentUser.email,
          actor_role: currentUser.role,
          tenant_id: currentUser.tenant_id,
          description: `Password reset for user`
        }]);

      await loadUsers();
      
      toast({
        title: "Password Reset",
        description: `Password reset successfully. New password: ${tempPassword}`,
      });

      return tempPassword;
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
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'user_deactivated',
          resource_type: 'user',
          resource_id: userId,
          actor_id: currentUser.id,
          actor_email: currentUser.email,
          actor_role: currentUser.role,
          tenant_id: currentUser.tenant_id,
          description: `User deactivated`
        }]);

      await loadUsers();
      
      toast({
        title: "User Deactivated",
        description: "User has been deactivated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to deactivate user",
        variant: "destructive"
      });
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