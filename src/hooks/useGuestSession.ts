import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GuestSession {
  session_id: string;
  tenant_id: string;
  qr_code_id: string;
  room_id?: string;
  expires_at: string;
  guest_phone?: string;
  guest_email?: string;
  is_valid: boolean;
}

export interface SessionSettings {
  session_lifetime_hours: number;
  allow_session_extension: boolean;
  require_phone_email: boolean;
  max_requests_per_hour: number;
  enable_session_resume: boolean;
}

export const useGuestSession = () => {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStoredSessionId = useCallback(() => {
    try {
      return localStorage.getItem('guest_session_id');
    } catch {
      return null;
    }
  }, []);

  const storeSessionId = useCallback((sessionId: string) => {
    try {
      localStorage.setItem('guest_session_id', sessionId);
    } catch (error) {
      console.warn('Failed to store session ID:', error);
    }
  }, []);

  const clearStoredSession = useCallback(() => {
    try {
      localStorage.removeItem('guest_session_id');
    } catch (error) {
      console.warn('Failed to clear stored session:', error);
    }
  }, []);

  const validateSession = useCallback(async (sessionId: string): Promise<GuestSession | null> => {
    try {
      const { data, error } = await supabase
        .rpc('validate_guest_session', { 
          p_session_id: sessionId,
          p_increment_count: false 
        });

      if (error || !data || data.length === 0) {
        console.error('Session validation failed:', error);
        return null;
      }

      const sessionData = data[0];
      if (!sessionData.is_valid) {
        return null;
      }

      return {
        session_id: sessionId,
        tenant_id: sessionData.tenant_id,
        qr_code_id: sessionData.qr_code_id,
        room_id: sessionData.room_id,
        expires_at: sessionData.expires_at,
        guest_phone: sessionData.guest_phone,
        guest_email: sessionData.guest_email,
        is_valid: sessionData.is_valid
      };
    } catch (err) {
      console.error('Error validating session:', err);
      return null;
    }
  }, []);

  const createSession = useCallback(async (
    tenantId: string, 
    qrCodeId: string, 
    roomId?: string,
    deviceInfo: Record<string, any> = {}
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user agent and other device info
      const fullDeviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        ...deviceInfo
      };

      const { data, error } = await supabase
        .rpc('create_guest_session', {
          p_tenant_id: tenantId,
          p_qr_code_id: qrCodeId,
          p_room_id: roomId,
          p_device_info: fullDeviceInfo
        });

      if (error || !data) {
        setError('Failed to create session');
        return null;
      }

      storeSessionId(data);
      return data;
    } catch (err) {
      setError('Error creating session');
      console.error('Error creating session:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [storeSessionId]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const storedSessionId = getStoredSessionId();
    if (!storedSessionId) return false;

    const validatedSession = await validateSession(storedSessionId);
    if (validatedSession) {
      setSession(validatedSession);
      return true;
    } else {
      clearStoredSession();
      setSession(null);
      return false;
    }
  }, [getStoredSessionId, validateSession, clearStoredSession]);

  const incrementRequestCount = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      const { data, error } = await supabase
        .rpc('validate_guest_session', { 
          p_session_id: session.session_id,
          p_increment_count: true 
        });

      return !error && data && data.length > 0 && data[0].is_valid;
    } catch (err) {
      console.error('Error incrementing request count:', err);
      return false;
    }
  }, [session]);

  const updateGuestInfo = useCallback(async (phone?: string, email?: string): Promise<boolean> => {
    if (!session) return false;

    try {
      const { error } = await supabase
        .from('guest_sessions')
        .update({
          guest_phone: phone,
          guest_email: email
        })
        .eq('session_id', session.session_id);

      if (!error) {
        setSession(prev => prev ? { ...prev, guest_phone: phone, guest_email: email } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating guest info:', err);
      return false;
    }
  }, [session]);

  const clearSession = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setError(null);
  }, [clearStoredSession]);

  // Auto-refresh session on mount and periodically
  useEffect(() => {
    refreshSession();
    
    const interval = setInterval(() => {
      if (session) {
        refreshSession();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [refreshSession, session]);

  return {
    session,
    isLoading,
    error,
    createSession,
    refreshSession,
    incrementRequestCount,
    updateGuestInfo,
    clearSession,
    isSessionValid: !!session?.is_valid
  };
};