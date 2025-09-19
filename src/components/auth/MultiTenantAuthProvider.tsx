import { createContext, useContext, ReactNode } from 'react';
import { useMultiTenantAuth, UseMultiTenantAuthReturn } from '@/hooks/useMultiTenantAuth';
import { useAuditLog } from '@/hooks/useAuditLog';

const MultiTenantAuthContext = createContext<UseMultiTenantAuthReturn | undefined>(undefined);

interface MultiTenantAuthProviderProps {
  children: ReactNode;
}

export function MultiTenantAuthProvider({ children }: MultiTenantAuthProviderProps) {
  const auth = useMultiTenantAuth();
  const auditLog = useAuditLog();

  // Enhanced auth object with audit logging
  const enhancedAuth = {
    ...auth,
    
    // Override login to add audit logging
    login: async (email: string, password: string) => {
      try {
        await auth.login(email, password);
        await auditLog.logLogin('email');
      } catch (error: any) {
        await auditLog.logFailedLogin(email, error.message || 'Unknown error');
        throw error;
      }
    },

    // Override logout to add audit logging
    logout: async () => {
      try {
        await auditLog.logLogout();
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