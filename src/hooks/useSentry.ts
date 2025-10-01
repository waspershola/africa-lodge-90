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
      console.log('[Sentry Hook] Initializing Sentry...');
      
      // Initialize Sentry (DSN should be added to secrets in production)
      initSentry({
        // dsn: 'YOUR_SENTRY_DSN_HERE', // Add via secrets in production
        enabled: true,
        environment: import.meta.env.MODE || 'development',
      });
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
