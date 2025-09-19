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
  temp_password_hash?: string;
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

  // Load user profile from JWT claims and database
  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', authUser.email);
      
      // Extract role and tenant_id from JWT claims for security
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No access token found in session');
        setError('Authentication failed - no access token');
        return;
      }
      
      const claims = JSON.parse(atob(session.access_token.split('.')[1]));
      console.log('JWT claims:', claims);
      
      const roleFromJWT = claims.user_metadata?.role as User['role'];
      const tenantIdFromJWT = claims.user_metadata?.tenant_id ? claims.user_metadata.tenant_id : null;

      console.log('Role from JWT:', roleFromJWT, 'Tenant ID:', tenantIdFromJWT);

      // Load additional user profile data from database
      console.log('Fetching user profile from database...');
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('name, force_reset, temp_password_hash, temp_expires')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user profile:', userError);
        setError(`Failed to load user profile: ${userError.message}`);
        return;
      }

      console.log('User profile loaded:', userProfile);

      // Build user data with JWT claims as source of truth for security
      const userData: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: userProfile?.name || authUser.user_metadata?.name || 'Unknown User',
        role: roleFromJWT || 'STAFF',
        tenant_id: tenantIdFromJWT,
        force_reset: userProfile?.force_reset || false,
        temp_password_hash: userProfile?.temp_password_hash,
        temp_expires: userProfile?.temp_expires,
      };

      console.log('Setting user:', userData);
      setUser(userData);

      // Load tenant data if user has tenant_id from JWT
      if (tenantIdFromJWT) {
        console.log('Loading tenant data...');
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('tenant_id', tenantIdFromJWT)
          .maybeSingle();

        if (tenantError && tenantError.code !== 'PGRST116') {
          console.error('Error loading tenant:', tenantError);
          setError(`Failed to load tenant data: ${tenantError.message}`);
          return;
        }

        if (tenantData) {
          const tenant: Tenant = {
            tenant_id: tenantData.tenant_id,
            hotel_name: tenantData.hotel_name,
            plan_id: tenantData.plan_id,
            subscription_status: tenantData.subscription_status as Tenant['subscription_status'],
            trial_start: tenantData.trial_start,
            trial_end: tenantData.trial_end,
            created_at: tenantData.created_at,
            updated_at: tenantData.updated_at,
          };

          console.log('Tenant loaded:', tenant);
          setTenant(tenant);
          setTrialStatus(calculateTrialStatus(tenant));

          // Check if onboarding is required for new login
          if (checkOnboardingRequired(userData, tenant)) {
            return; // Redirected to onboarding
          }
        }
      } else {
        console.log('No tenant ID - likely super admin');
        setTenant(null);
        setTrialStatus(null);
      }

      console.log('User profile loading completed successfully');
      
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    }
  };

  // Load auth state
  const loadAuthState = async () => {
    try {
      console.log('Loading auth state...');
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Found' : 'None');
      setSession(session);

      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        console.log('No session found, user not authenticated');
      }
    } catch (err) {
      console.error('Error loading auth state:', err);
      setError(err instanceof Error ? err.message : 'Auth loading failed');
    } finally {
      console.log('Auth state loading completed');
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      console.log('Starting login for:', email);
      setIsLoading(true);
      setError(null);

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Login error:', loginError);
        throw loginError;
      }

      console.log('Login successful, loading user profile...');
      if (data.session) {
        setSession(data.session);
        await loadUserProfile(data.user);
        console.log('Login completed successfully');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      console.log('Login function finished, setting loading to false');
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
      // Redirect to homepage after logout
      window.location.href = '/';
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
    let initialLoadDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      
      // Only load profile for auth events after initial load to prevent duplicates
      if (initialLoadDone && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        if (session?.user) {
          console.log('Auth event triggered profile load for:', session.user.email);
          await loadUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setTenant(null);
        setTrialStatus(null);
      }
    });

    // Load initial auth state only once
    loadAuthState().finally(() => {
      initialLoadDone = true;
      console.log('Initial auth state loading completed');
    });

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