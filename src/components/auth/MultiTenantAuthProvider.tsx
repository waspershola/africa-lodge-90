import { createContext, useContext, ReactNode } from 'react';
import { useMultiTenantAuth, UseMultiTenantAuthReturn } from '@/hooks/useMultiTenantAuth';

const MultiTenantAuthContext = createContext<UseMultiTenantAuthReturn | undefined>(undefined);

interface MultiTenantAuthProviderProps {
  children: ReactNode;
}

export function MultiTenantAuthProvider({ children }: MultiTenantAuthProviderProps) {
  const auth = useMultiTenantAuth();

  return (
    <MultiTenantAuthContext.Provider value={auth}>
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