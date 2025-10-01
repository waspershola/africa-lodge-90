/**
 * Phase 6: Sentry Feature Flag Hook
 * Conditionally enables Sentry based on feature flag
 */

import { useEffect } from 'react';
import { useFeatureFlag } from './useFeatureFlags';
import { initSentry, setSentryUser, clearSentryUser } from '@/lib/sentry';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export function useSentry() {
  const { data: sentryEnabled } = useFeatureFlag('ff/sentry_enabled');
  const { user } = useAuth();

  useEffect(() => {
    if (sentryEnabled) {
      console.log('[Sentry Hook] Feature flag enabled, initializing Sentry...');
      
      // Note: SENTRY_DSN is configured as a Supabase secret for edge functions
      // For client-side, we use a public DSN that can be safely exposed
      // The secret DSN is only used server-side to prevent abuse
      initSentry({
        dsn: import.meta.env.VITE_SENTRY_DSN || undefined, // Public DSN for client-side
        enabled: true,
        environment: import.meta.env.MODE || 'development',
      });
    } else {
      console.log('[Sentry Hook] Feature flag disabled, Sentry not initialized');
    }
  }, [sentryEnabled]);

  useEffect(() => {
    if (sentryEnabled && user) {
      console.log('[Sentry Hook] Setting user context:', {
        userId: user.id,
        role: user.role,
      });
      
      setSentryUser({
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      });
    }

    return () => {
      if (sentryEnabled) {
        clearSentryUser();
      }
    };
  }, [sentryEnabled, user]);

  return {
    sentryEnabled: !!sentryEnabled,
  };
}
