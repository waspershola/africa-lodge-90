import { supabase } from '@/integrations/supabase/client';

export interface Role {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'tenant';
  tenant_id?: string;
  is_system: boolean;
  permissions?: Permission[];
  staff_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  scope: 'global' | 'tenant';
  tenant_id?: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

class RoleService {
  async getRoles(scope?: 'global' | 'tenant', tenantId?: string): Promise<Role[]> {
    let query = supabase
      .from('roles')
      .select(`
        *,
        role_permissions(
          permission_id,
          permissions(*)
        )
      `);

    if (scope === 'global') {
      query = query.eq('scope', 'global');
    } else if (scope === 'tenant') {
      if (tenantId) {
        // Specific tenant roles
        query = query.eq('scope', 'tenant').eq('tenant_id', tenantId);
      } else {
        // Tenant templates (tenant_id is null)
        query = query.eq('scope', 'tenant').is('tenant_id', null);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include permissions array
    return data?.map(role => ({
      ...role,
      permissions: role.role_permissions?.map((rp: any) => rp.permissions) || [],
      staff_count: 0 // TODO: Calculate actual staff count
    })) || [];
  }

  async getGlobalRoles(): Promise<Role[]> {
    return this.getRoles('global');
  }

  async getTenantRoles(tenantId: string): Promise<Role[]> {
    return this.getRoles('tenant', tenantId);
  }

  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createRole(roleData: CreateRoleData): Promise<Role> {
    const { permissions, ...roleInfo } = roleData;

    // Create the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert(roleInfo)
      .select()
      .single();

    if (roleError) throw roleError;

    // Assign permissions if provided
    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }));

      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    return role;
  }

  async updateRole(roleId: string, roleData: UpdateRoleData): Promise<Role> {
    const { permissions, ...roleInfo } = roleData;

    // Update role info
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .update(roleInfo)
      .eq('id', roleId)
      .select()
      .single();

    if (roleError) throw roleError;

    // Update permissions if provided
    if (permissions) {
      // Remove existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Add new permissions
      if (permissions.length > 0) {
        const rolePermissions = permissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }));

        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }
    }

    return role;
  }

  async deleteRole(roleId: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions(*)
      `)
      .eq('role_id', roleId);

    if (error) throw error;
    return data?.map((rp: any) => rp.permissions) || [];
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    // First remove existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Then add new permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (error) throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      user_uuid: userId
    });

    if (error) throw error;
    return data?.map((p: any) => p.permission_name) || [];
  }
}

export const roleService = new RoleService();