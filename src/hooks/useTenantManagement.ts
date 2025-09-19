import { useState, useEffect } from 'react';
import { Tenant, Plan, TenantUser, BillingTransaction, AuditLog, TenantInvite } from '@/types/tenant';

// Mock data for frontend development
const mockTenants: Tenant[] = [
  {
    tenant_id: 'tenant-001',
    hotel_name: 'Lagos Grand Hotel',
    location: 'Lagos, Nigeria',
    plan_id: 'plan-growth',
    subscription_status: 'trialing',
    trial_start: '2025-09-15T00:00:00Z',
    trial_end: '2025-09-29T23:59:59Z',
    owner_id: 'user-001',
    created_at: '2025-09-15T00:00:00Z',
    updated_at: '2025-09-15T00:00:00Z',
    is_trial_active: true,
    days_remaining: 10
  },
  {
    tenant_id: 'tenant-002',
    hotel_name: 'Abuja Executive Suites',
    location: 'Abuja, Nigeria',
    plan_id: 'plan-pro',
    subscription_status: 'active',
    billing_provider: 'paystack',
    owner_id: 'user-002',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z'
  },
  {
    tenant_id: 'tenant-003',
    hotel_name: 'Victoria Island Resort',
    location: 'Lagos, Nigeria',
    plan_id: 'plan-starter',
    subscription_status: 'expired',
    trial_start: '2025-08-01T00:00:00Z',
    trial_end: '2025-08-15T23:59:59Z',
    owner_id: 'user-003',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-15T00:00:00Z',
    is_expired: true
  }
];

const mockPlans: Plan[] = [
  {
    plan_id: 'plan-starter',
    name: 'Starter',
    price: 35000,
    currency: 'NGN',
    features: ['Core bookings & front desk', 'Local payments', 'Basic reports'],
    room_capacity_min: 1,
    room_capacity_max: 25,
    is_trial_allowed: true,
    trial_duration_days: 14,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    plan_id: 'plan-growth',
    name: 'Growth',
    price: 65000,
    currency: 'NGN',
    features: ['Everything in Starter', 'POS & F&B', 'QR Room Service', 'Power tracking'],
    room_capacity_min: 26,
    room_capacity_max: 75,
    is_trial_allowed: true,
    trial_duration_days: 14,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    plan_id: 'plan-pro',
    name: 'Pro',
    price: 120000,
    currency: 'NGN',
    features: ['Everything in Growth', 'Multi-property', 'Advanced analytics', 'Custom integrations'],
    room_capacity_min: 76,
    room_capacity_max: 9999,
    is_trial_allowed: true,
    trial_duration_days: 30,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

export interface UseTenantManagementReturn {
  tenants: Tenant[];
  plans: Plan[];
  loading: boolean;
  error: string | null;
  
  // Tenant operations
  createTenant: (data: CreateTenantData) => Promise<Tenant>;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => Promise<Tenant>;
  suspendTenant: (tenantId: string, reason: string) => Promise<void>;
  extendTrial: (tenantId: string, newEndDate: string, reason: string) => Promise<void>;
  changePlan: (tenantId: string, planId: string) => Promise<void>;
  
  // User management
  inviteUser: (tenantId: string, invite: CreateInviteData) => Promise<TenantInvite>;
  resetUserPassword: (userId: string, temporary?: boolean) => Promise<void>;
  
  // Analytics
  getTenantMetrics: () => Promise<TenantMetrics>;
  getRecentActivity: (limit?: number) => Promise<AuditLog[]>;
  
  refreshData: () => Promise<void>;
}

export interface CreateTenantData {
  hotel_name: string;
  location?: string;
  plan_id: string;
  owner_email: string;
  owner_name: string;
  subscription_status: 'trialing' | 'active';
  billing_provider?: 'stripe' | 'paystack' | 'manual';
}

export interface CreateInviteData {
  email: string;
  role: 'manager' | 'staff' | 'chef' | 'accountant';
  department?: string;
}

export interface TenantMetrics {
  total_tenants: number;
  active_subscriptions: number;
  trial_tenants: number;
  expired_tenants: number;
  monthly_revenue: number;
  churn_rate: number;
}

export const useTenantManagement = (): UseTenantManagementReturn => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In production, these will be real API calls
      setTenants(mockTenants);
      setPlans(mockPlans);
    } catch (err) {
      setError('Failed to load tenant data');
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async (data: CreateTenantData): Promise<Tenant> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newTenant: Tenant = {
        tenant_id: `tenant-${Date.now()}`,
        hotel_name: data.hotel_name,
        location: data.location,
        plan_id: data.plan_id,
        subscription_status: data.subscription_status,
        billing_provider: data.billing_provider,
        owner_id: `user-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(data.subscription_status === 'trialing' && {
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_trial_active: true,
          days_remaining: 14
        })
      };
      
      setTenants(prev => [...prev, newTenant]);
      return newTenant;
    } catch (err) {
      setError('Failed to create tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTenant = async (tenantId: string, updates: Partial<Tenant>): Promise<Tenant> => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTenants(prev => prev.map(tenant => 
        tenant.tenant_id === tenantId 
          ? { ...tenant, ...updates, updated_at: new Date().toISOString() }
          : tenant
      ));
      
      const updatedTenant = tenants.find(t => t.tenant_id === tenantId);
      if (!updatedTenant) throw new Error('Tenant not found');
      
      return { ...updatedTenant, ...updates };
    } catch (err) {
      setError('Failed to update tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const suspendTenant = async (tenantId: string, reason: string): Promise<void> => {
    await updateTenant(tenantId, { subscription_status: 'suspended' });
    console.log(`Tenant ${tenantId} suspended. Reason: ${reason}`);
  };

  const extendTrial = async (tenantId: string, newEndDate: string, reason: string): Promise<void> => {
    await updateTenant(tenantId, { 
      trial_end: newEndDate,
      subscription_status: 'trialing',
      is_trial_active: true,
      days_remaining: Math.ceil((new Date(newEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    });
    console.log(`Trial extended for tenant ${tenantId}. Reason: ${reason}`);
  };

  const changePlan = async (tenantId: string, planId: string): Promise<void> => {
    await updateTenant(tenantId, { plan_id: planId });
    console.log(`Plan changed for tenant ${tenantId} to ${planId}`);
  };

  const inviteUser = async (tenantId: string, invite: CreateInviteData): Promise<TenantInvite> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newInvite: TenantInvite = {
      invite_id: `invite-${Date.now()}`,
      tenant_id: tenantId,
      email: invite.email,
      role: invite.role,
      department: invite.department,
      invited_by: 'current-user-id',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    
    console.log('User invited:', newInvite);
    return newInvite;
  };

  const resetUserPassword = async (userId: string, temporary: boolean = false): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`Password reset for user ${userId}. Temporary: ${temporary}`);
  };

  const getTenantMetrics = async (): Promise<TenantMetrics> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.subscription_status === 'active').length;
    const trialTenants = tenants.filter(t => t.subscription_status === 'trialing').length;
    const expiredTenants = tenants.filter(t => t.subscription_status === 'expired').length;
    
    return {
      total_tenants: totalTenants,
      active_subscriptions: activeTenants,
      trial_tenants: trialTenants,
      expired_tenants: expiredTenants,
      monthly_revenue: activeTenants * 65000, // Mock calculation
      churn_rate: 0.05
    };
  };

  const getRecentActivity = async (limit: number = 10): Promise<AuditLog[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock recent activity
    const mockActivity: AuditLog[] = [
      {
        log_id: 'log-001',
        actor_id: 'superadmin-001',
        actor_email: 'admin@luxuryhotelsaas.com',
        tenant_id: 'tenant-001',
        action: 'extend_trial',
        details: { days_extended: 7, reason: 'Good trial performance' },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        log_id: 'log-002',
        actor_id: 'superadmin-001',
        actor_email: 'admin@luxuryhotelsaas.com',
        tenant_id: 'tenant-002',
        action: 'change_plan',
        details: { from_plan: 'growth', to_plan: 'pro' },
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return mockActivity.slice(0, limit);
  };

  const refreshData = async () => {
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    tenants,
    plans,
    loading,
    error,
    createTenant,
    updateTenant,
    suspendTenant,
    extendTrial,
    changePlan,
    inviteUser,
    resetUserPassword,
    getTenantMetrics,
    getRecentActivity,
    refreshData
  };
};