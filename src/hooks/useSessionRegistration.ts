import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

/**
 * Phase 3: Session Registration & Heartbeat
 * 
 * Registers user sessions with device tracking and maintains heartbeat
 * to support:
 * - Multi-device session tracking
 * - Role-based session expiry
 * - Remote session revocation by Super Admin
 * - Activity monitoring
 */

interface SessionConfig {
  /** Heartbeat interval in milliseconds (default: 5 minutes) */
  heartbeatInterval?: number;
  /** Enable device fingerprinting (default: true) */
  enableDeviceTracking?: boolean;
  /** Verbose logging (default: false) */
  verbose?: boolean;
}

// Role-based max idle hours
const ROLE_IDLE_HOURS: Record<string, number> = {
  FRONT_DESK: 12,
  OWNER: 4,
  MANAGER: 6,
  HOUSEKEEPING: 6,
  POS: 8,
  MAINTENANCE: 6,
  SUPER_ADMIN: 6
};

export function useSessionRegistration(config: SessionConfig = {}) {
  const {
    heartbeatInterval = 5 * 60 * 1000, // 5 minutes
    enableDeviceTracking = true,
    verbose = false
  } = config;

  const { user, tenant } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate device fingerprint
  const getDeviceFingerprint = useCallback(() => {
    if (!enableDeviceTracking) return {};

    const ua = navigator.userAgent;
    const screen = window.screen;
    
    return {
      screen_resolution: `${screen.width}x${screen.height}`,
      color_depth: screen.colorDepth,
      timezone_offset: new Date().getTimezoneOffset(),
      platform: navigator.platform,
      language: navigator.language,
      hardware_concurrency: navigator.hardwareConcurrency,
      device_memory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  }, [enableDeviceTracking]);

  // Parse user agent for device info
  const parseUserAgent = useCallback(() => {
    const ua = navigator.userAgent;
    
    // Detect device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
    if (/mobile/i.test(ua)) deviceType = 'mobile';
    if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';
    
    // Detect browser
    let browserName = 'unknown';
    let browserVersion = '';
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) {
      browserName = 'Chrome';
      browserVersion = ua.match(/chrome\/(\d+\.\d+)/i)?.[1] || '';
    } else if (/firefox/i.test(ua)) {
      browserName = 'Firefox';
      browserVersion = ua.match(/firefox\/(\d+\.\d+)/i)?.[1] || '';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browserName = 'Safari';
      browserVersion = ua.match(/version\/(\d+\.\d+)/i)?.[1] || '';
    } else if (/edge/i.test(ua)) {
      browserName = 'Edge';
      browserVersion = ua.match(/edge\/(\d+\.\d+)/i)?.[1] || '';
    }
    
    // Detect OS
    let osName = 'unknown';
    let osVersion = '';
    if (/windows/i.test(ua)) {
      osName = 'Windows';
      osVersion = ua.match(/windows nt (\d+\.\d+)/i)?.[1] || '';
    } else if (/mac os x/i.test(ua)) {
      osName = 'macOS';
      osVersion = ua.match(/mac os x (\d+[._]\d+[._]\d+)/i)?.[1]?.replace(/_/g, '.') || '';
    } else if (/android/i.test(ua)) {
      osName = 'Android';
      osVersion = ua.match(/android (\d+\.\d+)/i)?.[1] || '';
    } else if (/ios|iphone|ipad/i.test(ua)) {
      osName = 'iOS';
      osVersion = ua.match(/os (\d+[._]\d+)/i)?.[1]?.replace('_', '.') || '';
    } else if (/linux/i.test(ua)) {
      osName = 'Linux';
    }
    
    const deviceName = `${osName} ${osVersion} - ${browserName}`;
    
    return {
      device_type: deviceType,
      device_name: deviceName,
      browser_name: browserName,
      browser_version: browserVersion,
      os_name: osName,
      os_version: osVersion
    };
  }, []);

  // Register session on login
  const registerSession = useCallback(async () => {
    if (!user || !user.id) {
      if (verbose) {
        console.log('[Session] No user, skipping registration');
      }
      return;
    }

    try {
      const userRole = user.role || 'FRONT_DESK';
      const maxIdleHours = ROLE_IDLE_HOURS[userRole] || 12;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + maxIdleHours);

      const deviceInfo = parseUserAgent();
      const deviceFingerprint = getDeviceFingerprint();

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          tenant_id: tenant?.tenant_id || null,
          session_token: crypto.randomUUID(),
          user_role: userRole,
          max_idle_hours: maxIdleHours,
          expires_at: expiresAt.toISOString(),
          user_agent: navigator.userAgent,
          device_fingerprint: deviceFingerprint,
          ...deviceInfo
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Session] Registration failed:', error);
        return;
      }

      sessionIdRef.current = data.id;
      
      if (verbose) {
        console.log('[Session] Registered:', {
          sessionId: data.id,
          role: userRole,
          expiresIn: `${maxIdleHours}h`,
          device: deviceInfo.device_name
        });
      }
    } catch (error) {
      console.error('[Session] Registration error:', error);
    }
  }, [user, tenant?.tenant_id, verbose, parseUserAgent, getDeviceFingerprint]);

  // Send heartbeat to update last_activity_at
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      // Use raw SQL to increment heartbeat_count
      const { error } = await supabase.rpc('increment_session_heartbeat', {
        p_session_id: sessionIdRef.current
      });

      if (error) {
        if (verbose) {
          console.warn('[Session] Heartbeat failed:', error.message);
        }
        
        // If session not found or inactive, re-register
        if (error.code === 'PGRST116') {
          sessionIdRef.current = null;
          await registerSession();
        }
      } else if (verbose) {
        console.log('[Session] Heartbeat sent');
      }
    } catch (error) {
      console.error('[Session] Heartbeat error:', error);
    }
  }, [verbose, registerSession]);

  // Revoke session on logout
  const revokeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revocation_reason: 'User logout'
        })
        .eq('id', sessionIdRef.current);

      if (verbose) {
        console.log('[Session] Revoked on logout');
      }

      sessionIdRef.current = null;
    } catch (error) {
      console.error('[Session] Revocation error:', error);
    }
  }, [verbose]);

  // Setup session and heartbeat
  useEffect(() => {
    if (!user) {
      // Clear session if user logs out
      if (sessionIdRef.current) {
        revokeSession();
      }
      return;
    }

    // Register session
    registerSession();

    // Setup heartbeat interval
    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);

    // Cleanup on unmount or logout
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      
      // Revoke session on component unmount (logout or navigate away)
      revokeSession();
    };
  }, [user, registerSession, sendHeartbeat, revokeSession, heartbeatInterval]);

  return {
    sessionId: sessionIdRef.current,
    sendHeartbeat,
    revokeSession
  };
}
