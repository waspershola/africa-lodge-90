import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roleService, CreateRoleData, UpdateRoleData } from '@/services/roleService';

export const useRoles = (scope?: 'global' | 'tenant', tenantId?: string) => {
  return useQuery({
    queryKey: ['roles', scope, tenantId],
    queryFn: () => roleService.getRoles(scope, tenantId),
    retry: 2,
    staleTime: 30000,
  });
};

export const useGlobalRoles = () => {
  return useQuery({
    queryKey: ['roles', 'global'],
    queryFn: () => roleService.getGlobalRoles(),
    retry: 2,
    staleTime: 30000,
  });
};

export const useTenantRoles = (tenantId: string) => {
  return useQuery({
    queryKey: ['roles', 'tenant', tenantId],
    queryFn: () => roleService.getTenantRoles(tenantId),
    enabled: !!tenantId,
    retry: 2,
    staleTime: 30000,
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions(),
    retry: 2,
    staleTime: 300000, // 5 minutes
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRoleData) => roleService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role');
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) => 
      roleService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (roleId: string) => roleService.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });
};

export const useRolePermissions = (roleId: string) => {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => roleService.getRolePermissions(roleId),
    enabled: !!roleId,
    retry: 2,
    staleTime: 60000,
  });
};

export const useAssignPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => 
      roleService.assignPermissionsToRole(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions');
    },
  });
};

export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => roleService.getUserPermissions(userId),
    enabled: !!userId,
    retry: 2,
    staleTime: 60000,
  });
};