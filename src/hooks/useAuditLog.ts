// @ts-nocheck
// Audit logging for authentication and security events
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export function useAuditLog() {
  const { user, tenant } = useAuth();

  const logEvent = async (entry: AuditLogEntry) => {
    try {
      // Get user agent and IP from browser
      const userAgent = navigator.userAgent;
      
      const auditEntry = {
        ...entry,
        actor_id: user?.id,
        actor_email: user?.email,
        actor_role: user?.role,
        tenant_id: tenant?.tenant_id,
        user_agent: userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          ...entry.metadata
        }
      };

      const { error } = await supabase
        .from('audit_log')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  };

  // Pre-defined audit log functions for common auth events
  const logLogin = async (method: string = 'email') => {
    await logEvent({
      action: 'LOGIN',
      resource_type: 'AUTH',
      description: `User logged in via ${method}`,
      metadata: {
        login_method: method,
        session_start: new Date().toISOString()
      }
    });
  };

  const logLogout = async () => {
    await logEvent({
      action: 'LOGOUT',
      resource_type: 'AUTH',
      description: 'User logged out',
      metadata: {
        session_end: new Date().toISOString()
      }
    });
  };

  const logPasswordReset = async (email: string) => {
    await logEvent({
      action: 'PASSWORD_RESET_REQUEST',
      resource_type: 'AUTH',
      description: 'Password reset requested',
      metadata: {
        target_email: email
      }
    });
  };

  const logFailedLogin = async (email: string, reason: string) => {
    await logEvent({
      action: 'LOGIN_FAILED',
      resource_type: 'AUTH',
      description: `Login failed: ${reason}`,
      metadata: {
        attempted_email: email,
        failure_reason: reason
      }
    });
  };

  const logSessionRefresh = async () => {
    await logEvent({
      action: 'SESSION_REFRESH',
      resource_type: 'AUTH',
      description: 'Session token refreshed',
      metadata: {
        refresh_time: new Date().toISOString()
      }
    });
  };

  const logUnauthorizedAccess = async (resource: string, action: string) => {
    await logEvent({
      action: 'UNAUTHORIZED_ACCESS',
      resource_type: 'SECURITY',
      resource_id: resource,
      description: `Unauthorized access attempt to ${resource}`,
      metadata: {
        attempted_action: action,
        denied_at: new Date().toISOString()
      }
    });
  };

  const logDataAccess = async (resourceType: string, resourceId: string, action: string) => {
    await logEvent({
      action: 'DATA_ACCESS',
      resource_type: resourceType,
      resource_id: resourceId,
      description: `${action} operation on ${resourceType}`,
      metadata: {
        access_type: action,
        accessed_at: new Date().toISOString()
      }
    });
  };

  return {
    logEvent,
    logLogin,
    logLogout,
    logPasswordReset,
    logFailedLogin,
    logSessionRefresh,
    logUnauthorizedAccess,
    logDataAccess
  };
}