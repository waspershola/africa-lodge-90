import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityMetrics {
  failedAttempts: number;
  lastFailedAttempt: Date | null;
  isLocked: boolean;
  lockExpiry: Date | null;
  suspiciousActivity: boolean;
  deviceFingerprint: string;
}

interface AuthSecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  rateLimitWindow: number; // in minutes
  enableDeviceTracking: boolean;
}

const DEFAULT_CONFIG: AuthSecurityConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 15,
  rateLimitWindow: 5,
  enableDeviceTracking: true,
};

export function useAuthSecurity(config: Partial<AuthSecurityConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedAttempts: 0,
    lastFailedAttempt: null,
    isLocked: false,
    lockExpiry: null,
    suspiciousActivity: false,
    deviceFingerprint: '',
  });

  // Generate device fingerprint
  const generateDeviceFingerprint = useCallback(() => {
    if (!finalConfig.enableDeviceTracking) return 'disabled';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context?.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substring(0, 32);
  }, [finalConfig.enableDeviceTracking]);

  // Initialize device fingerprint
  useEffect(() => {
    const fingerprint = generateDeviceFingerprint();
    setMetrics(prev => ({ ...prev, deviceFingerprint: fingerprint }));
  }, [generateDeviceFingerprint]);

  // Check if account is currently locked
  const isAccountLocked = useCallback(() => {
    if (!metrics.isLocked || !metrics.lockExpiry) return false;
    
    const now = new Date();
    if (now > metrics.lockExpiry) {
      // Lock has expired, reset metrics
      setMetrics(prev => ({
        ...prev,
        isLocked: false,
        lockExpiry: null,
        failedAttempts: 0,
      }));
      return false;
    }
    
    return true;
  }, [metrics.isLocked, metrics.lockExpiry]);

  // Record failed login attempt
  const recordFailedAttempt = useCallback(async (email: string, reason: string) => {
    const now = new Date();
    const newFailedAttempts = metrics.failedAttempts + 1;
    
    // Check if we should lock the account
    const shouldLock = newFailedAttempts >= finalConfig.maxFailedAttempts;
    const lockExpiry = shouldLock 
      ? new Date(now.getTime() + finalConfig.lockoutDuration * 60 * 1000)
      : null;

    setMetrics(prev => ({
      ...prev,
      failedAttempts: newFailedAttempts,
      lastFailedAttempt: now,
      isLocked: shouldLock,
      lockExpiry,
      suspiciousActivity: shouldLock || prev.suspiciousActivity,
    }));

    // Log to audit trail
    try {
      await supabase.functions.invoke('audit-log', {
        body: {
          action: 'FAILED_LOGIN_ATTEMPT',
          resource_type: 'AUTH',
          metadata: {
            email,
            reason,
            attempts: newFailedAttempts,
            device_fingerprint: metrics.deviceFingerprint,
            locked: shouldLock,
            lock_expiry: lockExpiry?.toISOString(),
            user_agent: navigator.userAgent,
            ip_address: 'client-side', // Would be filled server-side
          }
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [metrics, finalConfig]);

  // Record successful login
  const recordSuccessfulLogin = useCallback(async (email: string) => {
    // Reset failed attempts on successful login
    setMetrics(prev => ({
      ...prev,
      failedAttempts: 0,
      lastFailedAttempt: null,
      isLocked: false,
      lockExpiry: null,
      suspiciousActivity: false,
    }));

    // Log successful login
    try {
      await supabase.functions.invoke('audit-log', {
        body: {
          action: 'SUCCESSFUL_LOGIN',
          resource_type: 'AUTH',
          metadata: {
            email,
            device_fingerprint: metrics.deviceFingerprint,
            user_agent: navigator.userAgent,
          }
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [metrics.deviceFingerprint]);

  // Detect suspicious activity patterns
  const detectSuspiciousActivity = useCallback((email: string, newDeviceFingerprint?: string) => {
    let suspicious = false;
    const reasons: string[] = [];

    // Check for rapid-fire attempts
    if (metrics.lastFailedAttempt) {
      const timeSinceLastAttempt = Date.now() - metrics.lastFailedAttempt.getTime();
      if (timeSinceLastAttempt < 1000) { // Less than 1 second
        suspicious = true;
        reasons.push('rapid_attempts');
      }
    }

    // Check for device changes (if enabled)
    if (finalConfig.enableDeviceTracking && newDeviceFingerprint && 
        newDeviceFingerprint !== metrics.deviceFingerprint) {
      suspicious = true;
      reasons.push('device_change');
    }

    // Check for excessive failed attempts
    if (metrics.failedAttempts >= finalConfig.maxFailedAttempts - 1) {
      suspicious = true;
      reasons.push('excessive_failures');
    }

    if (suspicious) {
      setMetrics(prev => ({ ...prev, suspiciousActivity: true }));
      
      // Log suspicious activity
      supabase.functions.invoke('audit-log', {
        body: {
          action: 'SUSPICIOUS_ACTIVITY_DETECTED',
          resource_type: 'SECURITY',
          metadata: {
            email,
            reasons,
            failed_attempts: metrics.failedAttempts,
            device_fingerprint: metrics.deviceFingerprint,
            new_device_fingerprint: newDeviceFingerprint,
          }
        }
      }).catch(console.error);
    }

    return { suspicious, reasons };
  }, [metrics, finalConfig]);

  // Get time remaining until unlock
  const getTimeUntilUnlock = useCallback(() => {
    if (!metrics.isLocked || !metrics.lockExpiry) return 0;
    
    const now = new Date();
    const timeRemaining = Math.max(0, metrics.lockExpiry.getTime() - now.getTime());
    return Math.ceil(timeRemaining / 1000); // Return seconds
  }, [metrics.isLocked, metrics.lockExpiry]);

  // Format time remaining as human readable
  const formatTimeRemaining = useCallback(() => {
    const seconds = getTimeUntilUnlock();
    if (seconds === 0) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }, [getTimeUntilUnlock]);

  // Reset security metrics (admin function)
  const resetSecurityMetrics = useCallback(() => {
    setMetrics({
      failedAttempts: 0,
      lastFailedAttempt: null,
      isLocked: false,
      lockExpiry: null,
      suspiciousActivity: false,
      deviceFingerprint: generateDeviceFingerprint(),
    });
  }, [generateDeviceFingerprint]);

  return {
    metrics,
    isAccountLocked,
    recordFailedAttempt,
    recordSuccessfulLogin,
    detectSuspiciousActivity,
    getTimeUntilUnlock,
    formatTimeRemaining,
    resetSecurityMetrics,
    config: finalConfig,
  };
}