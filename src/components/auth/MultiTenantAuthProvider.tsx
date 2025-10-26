import { createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMultiTenantAuth, UseMultiTenantAuthReturn } from '@/hooks/useMultiTenantAuth';
import { useSessionRegistration } from '@/hooks/useSessionRegistration';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { supabase } from '@/integrations/supabase/client';
import { ForcePasswordResetDialog } from '@/components/auth/ForcePasswordResetDialog';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { toast } from 'sonner';

const MultiTenantAuthContext = createContext<UseMultiTenantAuthReturn | undefined>(undefined);

interface MultiTenantAuthProviderProps {
  children: ReactNode;
}

export function MultiTenantAuthProvider({ children }: MultiTenantAuthProviderProps) {
  const auth = useMultiTenantAuth();
  const queryClient = useQueryClient();

  // Session heartbeat now handled by supabase-health-monitor (consolidated)
  // This prevents redundant auth API calls (3x → 1x per 5 min)

  // Multi-device session registration and tracking
  useSessionRegistration({
    user: auth.user,
    logout: auth.logout,
    heartbeatInterval: 5 * 60 * 1000, // 5 minutes
    enableDeviceTracking: true,
    verbose: false
  });

  // Monitor for admin session revocation
  useSessionMonitor({
    user: auth.user,
    logout: auth.logout
  });

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

      await supabase.from('audit_log').insert([auditEntry as any]);
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
      // Fire-and-forget audit logging (non-blocking)
      logAuditEvent('LOGOUT', 'User logged out', {
        session_end: new Date().toISOString()
      }).catch((err) => {
        console.warn('Audit logging failed (non-critical):', err);
      });
      
      // Logout with timeout protection (5 seconds)
      const logoutWithTimeout = Promise.race([
        auth.logout(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 5000)
        )
      ]);

      try {
        await logoutWithTimeout;
      } catch (error) {
        console.error('Logout error:', error);
        // Force clear client state even if logout fails
        queryClient.clear();
        window.location.href = '/login';
      }
    }
  };

  return (
    <MultiTenantAuthContext.Provider value={enhancedAuth}>
      <ImpersonationBanner />
      {children}
      <ForcePasswordResetDialog 
        isOpen={auth.needsPasswordReset} 
        userEmail={auth.user?.email || ''} 
      />
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