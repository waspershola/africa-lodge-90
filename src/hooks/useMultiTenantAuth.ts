import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'POS';
  tenant_id?: string;
  force_reset?: boolean;
  temp_password?: string;
  temp_expires?: string;
}

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
  isLoading: boolean;
  error: string | null;
  trialStatus: TrialStatus | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: (requiredRole: string) => boolean;
  refreshAuth: () => Promise<void>;
}

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'owner@hotel.com',
    role: 'OWNER',
    tenant_id: 'tenant-1'
  },
  {
    id: '2', 
    email: 'manager@hotel.com',
    role: 'MANAGER',
    tenant_id: 'tenant-1'
  },
  {
    id: '3',
    email: 'frontdesk@hotel.com',
    role: 'FRONT_DESK',
    tenant_id: 'tenant-1'
  },
  {
    id: '4',
    email: 'admin@system.com',
    role: 'SUPER_ADMIN'
  }
];

const mockTenants: Tenant[] = [
  {
    tenant_id: 'tenant-1',
    hotel_name: 'Lagos Grand Hotel',
    plan_id: 'growth',
    subscription_status: 'trialing',
    trial_start: '2025-09-05T00:00:00Z',
    trial_end: '2025-09-19T23:59:59Z',
    created_at: '2025-09-05T00:00:00Z',
    updated_at: '2025-09-05T00:00:00Z'
  }
];

export function useMultiTenantAuth(): UseMultiTenantAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);

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

  // Load auth state
  const loadAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Simulate loading from localStorage/session
      const storedUserId = localStorage.getItem('current_user_id');
      if (storedUserId) {
        const mockUser = mockUsers.find(u => u.id === storedUserId);
        if (mockUser) {
          setUser(mockUser);
          
      // Load tenant if user has tenant_id
      if (mockUser.tenant_id) {
        const mockTenant = mockTenants.find(t => t.tenant_id === mockUser.tenant_id);
        if (mockTenant) {
          setTenant(mockTenant);
          setTrialStatus(calculateTrialStatus(mockTenant));
          
          // Check if onboarding is required for new login
          checkOnboardingRequired(mockUser, mockTenant);
        }
      }
        }
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

      // Mock authentication - in real app, this would call Supabase
      const mockUser = mockUsers.find(u => u.email === email);
      if (!mockUser) {
        throw new Error('Invalid credentials');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUser(mockUser);
      localStorage.setItem('current_user_id', mockUser.id);

      // Load tenant if user has tenant_id
      if (mockUser.tenant_id) {
        const mockTenant = mockTenants.find(t => t.tenant_id === mockUser.tenant_id);
        if (mockTenant) {
          setTenant(mockTenant);
          setTrialStatus(calculateTrialStatus(mockTenant));
          
          // Check if onboarding is required (after setting state)
          setTimeout(() => checkOnboardingRequired(mockUser, mockTenant), 100);
        }
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
      setUser(null);
      setTenant(null);
      setTrialStatus(null);
      localStorage.removeItem('current_user_id');
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

  // Refresh auth state
  const refreshAuth = async () => {
    await loadAuthState();
  };

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
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
    isLoading,
    error,
    trialStatus,
    login,
    logout,
    hasAccess,
    refreshAuth
  };
}