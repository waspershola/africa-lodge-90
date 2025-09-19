import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS';
  tenant_id?: string;
  force_reset?: boolean;
  temp_password?: string;
  temp_expires?: string;
}

// Add UserRole type for backward compatibility
export type UserRole = User['role'];

export interface Tenant {
  tenant_id: string;
  hotel_name: string;
  plan_id: string;
  subscription_status: 'trialing' | 'active' | 'expired' | 'suspended';
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface TrialStatus {
  isActive: boolean;
  daysRemaining?: number;
  planId?: string;
  trialEnd?: string;
}

export interface UseMultiTenantAuthReturn {
  user: User | null;
  tenant: Tenant | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  trialStatus: TrialStatus | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (requiredRole: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshAuth: () => Promise<void>;
}

export function useMultiTenantAuth(): UseMultiTenantAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);

  // ... keep existing code ...

  // Check if onboarding is required
  const checkOnboardingRequired = (user: User, tenant: Tenant) => {
    if (user.role === 'OWNER' && tenant.subscription_status === 'trialing') {
      // Check if setup is completed (mock check via localStorage)
      const onboardingData = localStorage.getItem(`onboarding_${user.id}`);
      if (!onboardingData) {
        // First-time owner login - redirect to onboarding
        window.location.href = '/onboarding';
        return true;
      } else {
        const progress = JSON.parse(onboardingData);
        if (!progress.completed) {
          // Incomplete onboarding - redirect to continue
          window.location.href = '/onboarding';
          return true;
        }
      }
    }
    return false;
  };

  // Calculate trial status
  const calculateTrialStatus = (tenant: Tenant | null): TrialStatus | null => {
    if (!tenant || tenant.subscription_status !== 'trialing' || !tenant.trial_end) {
      return null;
    }

    const trialEnd = new Date(tenant.trial_end);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isActive: daysRemaining > 0,
      daysRemaining: Math.max(0, daysRemaining),
      planId: tenant.plan_id,
      trialEnd: tenant.trial_end
    };
  };

  // Load user profile from database
  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*, tenants(*)')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error loading user profile:', userError);
        return;
      }

      if (userProfile) {
        const userData: User = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role as User['role'],
          tenant_id: userProfile.tenant_id,
          force_reset: userProfile.force_reset,
          temp_password: userProfile.temp_password_hash,
          temp_expires: userProfile.temp_expires,
        };

        setUser(userData);

        // Load tenant data if user has tenant_id
        if (userProfile.tenant_id && userProfile.tenants) {
          const tenantData: Tenant = {
            tenant_id: userProfile.tenants.tenant_id,
            hotel_name: userProfile.tenants.hotel_name,
            plan_id: userProfile.tenants.plan_id,
            subscription_status: userProfile.tenants.subscription_status as Tenant['subscription_status'],
            trial_start: userProfile.tenants.trial_start,
            trial_end: userProfile.tenants.trial_end,
            created_at: userProfile.tenants.created_at,
            updated_at: userProfile.tenants.updated_at,
          };

          setTenant(tenantData);
          setTrialStatus(calculateTrialStatus(tenantData));

          // Check if onboarding is required for new login
          checkOnboardingRequired(userData, tenantData);
        }
      }
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    }
  };

  // Load auth state
  const loadAuthState = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        await loadUserProfile(session.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth loading failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      if (data.session) {
        setSession(data.session);
        await loadUserProfile(data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setTenant(null);
      setSession(null);
      setTrialStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  // Check if user has required role access
  const hasAccess = (requiredRole: string): boolean => {
    if (!user) return false;

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

    const userRoles = roleHierarchy[user.role] || [user.role];
    return userRoles.includes(requiredRole);
  };

  // Check if user has specific permission (for backward compatibility)
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Map permissions to roles
    const permissionRoleMap = {
      'pos:view_orders': ['POS', 'MANAGER', 'OWNER'],
      'pos:accept_orders': ['POS', 'MANAGER', 'OWNER'], 
      'pos:update_status': ['POS', 'MANAGER', 'OWNER'],
      'kds:view_tickets': ['POS', 'MANAGER', 'OWNER'],
      'kds:claim_tickets': ['POS', 'MANAGER', 'OWNER'],
      'kds:complete_tickets': ['POS', 'MANAGER', 'OWNER'],
    };

    const requiredRoles = permissionRoleMap[permission] || [];
    return requiredRoles.includes(user.role) || user.role === 'SUPER_ADMIN' || user.role === 'OWNER';
  };

  // Refresh auth state
  const refreshAuth = async () => {
    await loadAuthState();
  };

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTenant(null);
        setTrialStatus(null);
      }
    });

    // Load initial auth state
    loadAuthState();

    return () => subscription.unsubscribe();
  }, []);

  // Update trial status when tenant changes
  useEffect(() => {
    if (tenant) {
      setTrialStatus(calculateTrialStatus(tenant));
    }
  }, [tenant]);

  return {
    user,
    tenant,
    session,
    isLoading,
    error,
    trialStatus,
    login,
    logout,
    hasAccess,
    hasPermission,
    refreshAuth
  };
}

// Export useAuth as an alias for backward compatibility
export const useAuth = useMultiTenantAuth;