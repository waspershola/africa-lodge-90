/**
 * Security Enhanced Authentication Hook
 * Replaces insecure localStorage usage with proper session management
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { SecureStorage } from '@/lib/secure-storage';
import { useAuditLog } from '@/hooks/useAuditLog';

interface SecureAuthState {
  isAuthenticated: boolean;
  sessionValid: boolean;
  securityLevel: 'high' | 'medium' | 'low';
  lastActivity: Date | null;
}

export function useSecureAuth() {
  const { user, session, logout } = useAuth();
  const { logEvent, logUnauthorizedAccess, logSessionRefresh } = useAuditLog();
  const [authState, setAuthState] = useState<SecureAuthState>({
    isAuthenticated: false,
    sessionValid: false,
    securityLevel: 'low',
    lastActivity: null
  });

  // Security: Monitor session validity
  useEffect(() => {
    if (!session || !user) {
      setAuthState({
        isAuthenticated: false,
        sessionValid: false,
        securityLevel: 'low',
        lastActivity: null
      });
      return;
    }

    // Check session expiration
    const expiresAt = new Date(session.expires_at || 0);
    const now = new Date();
    const isExpired = expiresAt <= now;

    if (isExpired) {
      logEvent({
        action: 'SESSION_EXPIRED',
        resource_type: 'AUTH',
        description: 'Session expired, logging out user',
        metadata: { expires_at: session.expires_at }
      });
      logout();
      return;
    }

    // Determine security level based on session age and context
    const sessionAge = now.getTime() - new Date(session.user?.created_at || 0).getTime();
    const isSecureContext = window.location.protocol === 'https:';
    
    let securityLevel: 'high' | 'medium' | 'low' = 'low';
    if (isSecureContext && sessionAge < 24 * 60 * 60 * 1000) {
      securityLevel = 'high';
    } else if (isSecureContext) {
      securityLevel = 'medium';
    }

    setAuthState({
      isAuthenticated: true,
      sessionValid: true,
      securityLevel,
      lastActivity: new Date()
    });

    // Security: Auto-refresh session when it's close to expiring
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
      logSessionRefresh();
    }

  }, [session, user, logout, logEvent, logSessionRefresh]);

  // Security: Session activity tracking
  const updateActivity = () => {
    if (authState.isAuthenticated) {
      setAuthState(prev => ({
        ...prev,
        lastActivity: new Date()
      }));
      
      // Store last activity securely (non-sensitive data)
      SecureStorage.setSessionData('last_activity', new Date().toISOString());
    }
  };

  // Security: Detect and handle unauthorized access attempts
  const handleUnauthorizedAccess = (resource: string, action: string) => {
    logUnauthorizedAccess(resource, action);
    
    // Rate limit unauthorized attempts
    const identifier = `${user?.id || 'anonymous'}_${resource}`;
    if (!SecureStorage.checkRateLimit(identifier, 3, 60000)) {
      // Force logout after too many unauthorized attempts
      logout();
    }
  };

  // Security: Validate permissions with audit logging
  const hasSecurePermission = (permission: string, resourceId?: string): boolean => {
    if (!authState.isAuthenticated || !authState.sessionValid) {
      handleUnauthorizedAccess(resourceId || 'unknown', permission);
      return false;
    }

    // Log permission check for audit
    logEvent({
      action: 'PERMISSION_CHECK',
      resource_type: 'AUTHORIZATION',
      resource_id: resourceId,
      description: `Permission check for ${permission}`,
      metadata: {
        permission,
        granted: true,
        security_level: authState.securityLevel
      }
    });

    return true;
  };

  // Security: Force logout with cleanup
  const secureLogout = async (reason = 'user_initiated') => {
    // Audit the logout
    await logEvent({
      action: 'SECURE_LOGOUT',
      resource_type: 'AUTH',
      description: `Secure logout initiated: ${reason}`,
      metadata: {
        reason,
        session_duration: authState.lastActivity ? 
          new Date().getTime() - authState.lastActivity.getTime() : 0,
        security_level: authState.securityLevel
      }
    });

    // Clear all secure storage
    SecureStorage.clear();
    
    // Perform logout
    await logout();
  };

  return {
    authState,
    updateActivity,
    hasSecurePermission,
    handleUnauthorizedAccess,
    secureLogout,
    
    // Expose security status
    isSecure: authState.securityLevel === 'high',
    sessionTimeRemaining: session ? 
      new Date(session.expires_at || 0).getTime() - new Date().getTime() : 0
  };
}