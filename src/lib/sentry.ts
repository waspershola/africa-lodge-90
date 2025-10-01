/**
 * Phase 6: Monitoring & Observability - Sentry Integration
 * Centralized error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

export interface SentryConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

const DEFAULT_CONFIG: SentryConfig = {
  environment: import.meta.env.MODE || 'development',
  enabled: import.meta.env.PROD || false,
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
};

let isInitialized = false;

/**
 * Initialize Sentry with feature flag support
 */
export function initSentry(config: Partial<SentryConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled || !finalConfig.dsn) {
    console.log('[Sentry] Disabled or no DSN provided');
    return;
  }

  if (isInitialized) {
    console.log('[Sentry] Already initialized');
    return;
  }

  try {
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
      tracesSampleRate: finalConfig.tracesSampleRate,
      replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
      replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,
      beforeSend(event, hint) {
        // Filter out non-critical errors
        const error = hint.originalException;
        
        // Don't send network errors that are user-initiated (e.g., canceled requests)
        if (error instanceof Error && error.message.includes('cancelled')) {
          return null;
        }

        // Don't send auth errors (user-facing)
        if (event.exception?.values?.[0]?.value?.includes('auth')) {
          return null;
        }

        return event;
      },
    });

    isInitialized = true;
    console.log('[Sentry] Initialized successfully:', {
      environment: finalConfig.environment,
      tracesSampleRate: finalConfig.tracesSampleRate,
    });
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  role?: string;
  tenant_id?: string;
}) {
  if (!isInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    // Don't send PII beyond email
    role: user.role,
  });

  // Set tenant as tag for filtering
  if (user.tenant_id) {
    Sentry.setTag('tenant_id', user.tenant_id);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  if (!isInitialized) return;
  Sentry.setUser(null);
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  if (!isInitialized) {
    console.error('[Sentry] Exception (not sent):', error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message for non-error events
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (!isInitialized) {
    console.log(`[Sentry] Message (${level}):`, message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string = 'custom'
): Sentry.Span | undefined {
  if (!isInitialized) return undefined;

  return Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => span
  );
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  breadcrumb: Sentry.Breadcrumb
) {
  if (!isInitialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}

export { Sentry };
