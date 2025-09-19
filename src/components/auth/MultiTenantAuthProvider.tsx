import { createContext, useContext, ReactNode } from 'react';
import { useMultiTenantAuth, UseMultiTenantAuthReturn } from '@/hooks/useMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';

const MultiTenantAuthContext = createContext<UseMultiTenantAuthReturn | undefined>(undefined);

interface MultiTenantAuthProviderProps {
  children: ReactNode;
}

export function MultiTenantAuthProvider({ children }: MultiTenantAuthProviderProps) {
  const auth = useMultiTenantAuth();

  // Create audit logging function without circular dependency
  const logAuditEvent = async (action: string, description: string, metadata?: Record<string, any>) => {
    try {
      const auditEntry = {
        action,
        resource_type: 'AUTH',
        description,
        actor_id: auth.user?.id,
        actor_email: auth.user?.email,
        actor_role: auth.user?.role,
        tenant_id: auth.tenant?.tenant_id,
        user_agent: navigator.userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      await supabase.from('audit_log').insert([auditEntry]);
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  };

  // Enhanced auth object with audit logging
  const enhancedAuth = {
    ...auth,
    
    // Override login to add audit logging
    login: async (email: string, password: string) => {
      try {
        await auth.login(email, password);
        await logAuditEvent('LOGIN', `User logged in via email`, {
          login_method: 'email',
          session_start: new Date().toISOString()
        });
      } catch (error: any) {
        await logAuditEvent('LOGIN_FAILED', `Login failed: ${error.message || 'Unknown error'}`, {
          attempted_email: email,
          failure_reason: error.message || 'Unknown error'
        });
        throw error;
      }
    },

    // Override logout to add audit logging
    logout: async () => {
      try {
        await logAuditEvent('LOGOUT', 'User logged out', {
          session_end: new Date().toISOString()
        });
        await auth.logout();
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    }
  };

  return (
    <MultiTenantAuthContext.Provider value={enhancedAuth}>
      {children}
    </MultiTenantAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(MultiTenantAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MultiTenantAuthProvider');
  }
  return context;
}