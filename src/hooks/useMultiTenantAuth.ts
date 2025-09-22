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
  setup_completed?: boolean;
  onboarding_step?: string;
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
  needsPasswordReset: boolean;
  isImpersonating: boolean;
  impersonationData: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  hasAccess: (requiredRole: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshAuth: () => Promise<void>;
}

import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat';

export function useMultiTenantAuth(): UseMultiTenantAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonationData, setImpersonationData] = useState<any | null>(null);

  // Set up session heartbeat monitoring
  useSessionHeartbeat({
    enabled: !!session && !!user,
    intervalMinutes: 15,
    onSessionExpired: () => {
      console.log('Session expired detected by heartbeat, clearing auth state');
      setUser(null);
      setTenant(null);
      setSession(null);
      setTrialStatus(null);
      setIsImpersonating(false);
      setImpersonationData(null);
      setError('Session expired');
    }
  });

  // ... keep existing code ...

  // Check if password reset is required
  const checkPasswordResetRequired = (user: User): boolean => {
    console.log('Checking password reset required:', { 
      force_reset: user.force_reset, 
      has_temp_password: !!user.temp_password_hash,
      user_email: user.email 
    });
    
    // Force reset if explicitly marked OR if user has temp password
    if (user.force_reset) {
      console.log('Password reset required - force_reset flag is true');
      return true;
    }
    
    return false;
  };

  // Check if onboarding is required
  const checkOnboardingRequired = (user: User, tenant: Tenant): boolean => {
    // Only check for owners on trialing subscriptions
    if (user.role === 'OWNER' && tenant.subscription_status === 'trialing') {
      // Use database setup_completed field instead of localStorage
      if (tenant.setup_completed === false || tenant.setup_completed === undefined) {
        console.log('Onboarding required - setup not completed');
        // Don't redirect here - let the routing components handle it
        return true;
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

      // Check if password reset is required first
      const requiresReset = checkPasswordResetRequired(userData);
      setNeedsPasswordReset(requiresReset);
      
      if (requiresReset) {
        console.log('Password reset required, stopping further auth processing');
        return; // Don't proceed with tenant loading or onboarding if reset is required
      }

      // Load tenant data if user has tenant_id from JWT
      if (tenantIdFromJWT) {
        console.log('Loading tenant data...');
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('tenant_id, hotel_name, plan_id, subscription_status, trial_start, trial_end, setup_completed, onboarding_step, created_at, updated_at')
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
            setup_completed: tenantData.setup_completed,
            onboarding_step: tenantData.onboarding_step,
            created_at: tenantData.created_at,
            updated_at: tenantData.updated_at,
          };

          console.log('Tenant loaded:', tenant);
          setTenant(tenant);
          setTrialStatus(calculateTrialStatus(tenant));

          // Check if onboarding is required for new login
          const onboardingRequired = checkOnboardingRequired(userData, tenant);
          console.log('Onboarding check result:', onboardingRequired);
          // Note: Don't redirect here, let routing components handle it
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

  // Reset password function
  const resetPassword = async (newPassword: string) => {
    try {
      if (!user) throw new Error('No user found');
      
      console.log('Resetting password for user:', user.id);
      
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Clear force_reset flag and temp password in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          force_reset: false,
          temp_password_hash: null,
          temp_expires: null
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.warn('Failed to clear temp password flags:', updateError);
      }
      
      // Update local state
      setNeedsPasswordReset(false);
      setUser(prev => prev ? { ...prev, force_reset: false } : null);
      
      console.log('Password reset completed successfully');
      
      // Reload auth state to continue with normal flow
      await loadAuthState();
      
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err instanceof Error ? err.message : 'Password reset failed');
      throw err;
    }
  };

  // Refresh auth state
  const refreshAuth = async () => {
    await loadAuthState();
  };

  // Stop impersonation function
  const stopImpersonation = async () => {
    try {
      if (!impersonationData?.session_token) {
        console.warn('No active impersonation session');
        return;
      }

      const { error } = await supabase.functions.invoke('stop-impersonation', {
        body: { session_token: impersonationData.session_token }
      });

      if (error) throw error;

      setIsImpersonating(false);
      setImpersonationData(null);
      
      // Redirect to super admin dashboard (use location.replace)
      location.replace('/sa/dashboard');
    } catch (err) {
      console.error('Failed to stop impersonation:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop impersonation');
    }
  };

  // Set up auth state listener and auto-refresh
  useEffect(() => {
    let initialLoadDone = false;
    let refreshInterval: NodeJS.Timeout | null = null;

    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('Auth event triggered profile load for:', session.user.email);
          // Clear any previous error state on successful auth
          setError(null);
          
          // Use setTimeout to prevent potential deadlock
          setTimeout(() => {
            loadUserProfile(session.user);
          }, 0);
          
          // Set up aggressive token refresh for active sessions
          setupRefresh(session);
        } else if (event === 'INITIAL_SESSION' && !session) {
          console.log('Initial session check - no session found');
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        setUser(null);
        setTenant(null);
        setSession(null);
        setIsImpersonating(false);
        setImpersonationData(null);
        setNeedsPasswordReset(false);
        setError(null);
        if (refreshInterval) {
          clearInterval(refreshInterval);
          refreshInterval = null;
        }
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, updating session');
        setSession(session);
        setError(null);
      }
    });

    // Set up automatic token refresh - enhanced approach with graceful degradation
    const setupRefresh = (session: any) => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      if (session) {
        refreshInterval = setInterval(async () => {
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
              const now = Math.floor(Date.now() / 1000);
              const expiresAt = currentSession.expires_at || 0;
              
              // Refresh 10 minutes before expiry (600 seconds)
              if (expiresAt - now < 600) {
                console.log('Token expiring soon, refreshing proactively...');
                const { data, error } = await supabase.auth.refreshSession();
                if (error) {
                  console.error('Proactive token refresh failed:', error.message);
                  
                  // Handle specific error cases more gracefully
                  if (error.message?.includes('refresh_token_not_found') || 
                      error.message?.includes('Invalid Refresh Token') ||
                      error.status === 400) {
                    console.log('Token completely invalid, forcing clean logout');
                    // Clear all local state first
                    setUser(null);
                    setTenant(null);
                    setSession(null);
                    setTrialStatus(null);
                    setIsImpersonating(false);
                    setImpersonationData(null);
                    setError(null);
                    
                    // Clear refresh interval
                    if (refreshInterval) {
                      clearInterval(refreshInterval);
                      refreshInterval = null;
                    }
                    
                    // Force clean logout without causing additional errors
                    try {
                      await supabase.auth.signOut({ scope: 'local' });
                    } catch (signOutError) {
                      console.log('Sign out also failed, clearing locally only');
                    }
                    
                    // Redirect to home page after clean logout (use location.replace to avoid history issues)
                    setTimeout(() => {
                      location.replace('/');
                    }, 100);
                    return;
                  } else {
                    // For other errors, just force logout
                    await supabase.auth.signOut();
                  }
                } else {
                  console.log('Session refreshed proactively');
                  setSession(data.session);
                  setError(null);
                }
              }
            } else {
              console.log('No current session found during refresh check');
              // Clean up refresh interval if no session
              if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
              }
            }
          } catch (error) {
            console.error('Error in token refresh interval:', error);
            
            // If we get auth errors during refresh checking, handle gracefully
            if (error instanceof Error && 
                (error.message?.includes('refresh_token_not_found') || 
                 error.message?.includes('Invalid Refresh Token'))) {
              console.log('Session completely invalid during refresh check, cleaning up');
              
              // Clear all state and intervals
              if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
              }
              
              setUser(null);
              setTenant(null);
              setSession(null);
              setTrialStatus(null);
              setError(null);
            }
          }
        }, 5 * 60 * 1000); // Check every 5 minutes instead of 30 seconds
      }
    };

    // Load initial auth state
    loadAuthState().finally(async () => {
      initialLoadDone = true;
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setupRefresh(currentSession); // Start refresh monitoring after initial load
        }
      } catch (error) {
        console.error('Error setting up refresh after initial load:', error);
      }
      console.log('Initial auth state loading completed');
    });

    return () => {
      console.log('Cleaning up auth listener and refresh interval');
      subscription.unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
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
    needsPasswordReset,
    isImpersonating,
    impersonationData,
    login,
    logout,
    resetPassword,
    stopImpersonation,
    hasAccess,
    hasPermission,
    refreshAuth
  };
}

// Export useAuth as an alias for backward compatibility
export const useAuth = useMultiTenantAuth;