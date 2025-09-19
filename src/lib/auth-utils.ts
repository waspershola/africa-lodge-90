// Authentication utility functions
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Extract JWT claims safely
export const extractJWTClaims = (session: Session | null) => {
  if (!session?.access_token) return null;

  try {
    const payload = session.access_token.split('.')[1];
    const decodedPayload = atob(payload);
    const claims = JSON.parse(decodedPayload);
    
    return {
      userId: claims.sub,
      email: claims.email,
      role: claims.user_metadata?.role || 'STAFF',
      tenantId: claims.user_metadata?.tenant_id || null,
      exp: claims.exp,
      iat: claims.iat
    };
  } catch (error) {
    console.error('Failed to extract JWT claims:', error);
    return null;
  }
};

// Validate session is not expired
export const isSessionValid = (session: Session | null): boolean => {
  if (!session) return false;

  const claims = extractJWTClaims(session);
  if (!claims) return false;

  const now = Math.floor(Date.now() / 1000);
  return claims.exp > now;
};

// Check if user has required role
export const hasRole = (session: Session | null, requiredRole: string): boolean => {
  const claims = extractJWTClaims(session);
  if (!claims) return false;

  const roleHierarchy = {
    'SUPER_ADMIN': ['SUPER_ADMIN'],
    'OWNER': ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS'],
    'MANAGER': ['MANAGER', 'STAFF', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS'],
    'STAFF': ['STAFF'],
    'FRONT_DESK': ['FRONT_DESK'],
    'HOUSEKEEPING': ['HOUSEKEEPING'],
    'MAINTENANCE': ['MAINTENANCE'],
    'POS': ['POS']
  };

  const userRoles = roleHierarchy[claims.role as keyof typeof roleHierarchy] || [claims.role];
  return userRoles.includes(requiredRole);
};

// Check if user can access tenant data
export const canAccessTenant = (session: Session | null, tenantId: string): boolean => {
  const claims = extractJWTClaims(session);
  if (!claims) return false;

  // Super admin can access all tenants
  if (claims.role === 'SUPER_ADMIN') return true;

  // Regular users can only access their own tenant
  return claims.tenantId === tenantId;
};

// Secure session storage configuration
export const getSessionStorageConfig = () => {
  const isProduction = window.location.hostname !== 'localhost';
  
  return {
    // Use secure httpOnly cookies in production
    storage: isProduction ? undefined : localStorage,
    storageKey: isProduction ? undefined : 'supabase.auth.token',
    cookieOptions: isProduction ? {
      name: 'supabase-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: window.location.hostname,
      sameSite: 'lax' as const,
      secure: true,
      httpOnly: true
    } : undefined
  };
};

// Validate JWT token format
export const validateJWTFormat = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Get user permissions from role
export const getUserPermissions = (role: string): string[] => {
  const permissionsByRole: Record<string, string[]> = {
    'SUPER_ADMIN': ['*'],
    'OWNER': [
      'dashboard:read', 'dashboard:write',
      'reservations:read', 'reservations:write', 'reservations:cancel',
      'rooms:read', 'rooms:write',
      'staff:read', 'staff:write', 'staff:manage',
      'reports:read', 'reports:write', 'reports:export',
      'billing:read', 'billing:write',
      'settings:read', 'settings:write',
      'pos:read', 'pos:write',
      'housekeeping:read', 'housekeeping:write',
      'maintenance:read', 'maintenance:write'
    ],
    'MANAGER': [
      'dashboard:read', 'dashboard:write',
      'reservations:read', 'reservations:write', 'reservations:cancel',
      'rooms:read', 'rooms:write',
      'staff:read', 'staff:write',
      'reports:read', 'reports:write', 'reports:export',
      'billing:read',
      'pos:read', 'pos:write',
      'housekeeping:read', 'housekeeping:write',
      'maintenance:read', 'maintenance:write'
    ],
    'FRONT_DESK': [
      'dashboard:read',
      'reservations:read', 'reservations:write',
      'rooms:read', 'rooms:write',
      'reports:read',
      'billing:read'
    ],
    'HOUSEKEEPING': [
      'dashboard:read',
      'housekeeping:read', 'housekeeping:write',
      'rooms:read', 'rooms:write'
    ],
    'MAINTENANCE': [
      'dashboard:read',
      'maintenance:read', 'maintenance:write',
      'rooms:read'
    ],
    'POS': [
      'dashboard:read',
      'pos:read', 'pos:write',
      'reports:read'
    ],
    'STAFF': [
      'dashboard:read'
    ]
  };

  return permissionsByRole[role] || [];
};

// Check if user has specific permission
export const hasPermission = (session: Session | null, permission: string): boolean => {
  const claims = extractJWTClaims(session);
  if (!claims) return false;

  const userPermissions = getUserPermissions(claims.role);
  
  // Super admin has all permissions
  if (userPermissions.includes('*')) return true;
  
  return userPermissions.includes(permission);
};

// Create test user for authentication testing
export const createTestUser = async (
  email: string,
  password: string,
  role: string,
  tenantId?: string
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role,
          tenant_id: tenantId
        }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
};

// Validate tenant isolation - for testing
export const testTenantIsolation = async (
  testTenantId: string,
  otherTenantId: string
): Promise<boolean> => {
  try {
    // Try to access data from other tenant (should fail)
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('tenant_id', otherTenantId);

    // If we get data, isolation is broken
    if (data && data.length > 0) {
      console.error('SECURITY BREACH: Can access other tenant data!', data);
      return false;
    }

    // If we get an RLS error, isolation is working
    if (error && error.code === '42501') {
      console.log('✅ Tenant isolation working correctly');
      return true;
    }

    // No error but no data means isolation is working
    return data?.length === 0;
  } catch (error) {
    console.error('Error testing tenant isolation:', error);
    return false;
  }
};