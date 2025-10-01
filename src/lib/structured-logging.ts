/**
 * Phase 6: Structured Logging Utilities
 * Provides consistent logging format across the application
 */

import { addBreadcrumb, captureException, captureMessage } from './sentry';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface LogContext {
  operation: string;
  component?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

/**
 * Structured logger with Sentry integration
 */
export class StructuredLogger {
  private context: Partial<LogContext>;

  constructor(context: Partial<LogContext> = {}) {
    this.context = context;
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  /**
   * Log warning
   */
  warn(message: string, metadata?: Record<string, any>) {
    this.log('warning', message, metadata);
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('error', message, metadata);
    
    if (error) {
      captureException(error, {
        tags: {
          operation: this.context.operation || 'unknown',
          component: this.context.component || 'unknown',
        },
        extra: {
          ...this.context,
          ...metadata,
        },
        level: 'error',
      });
    }
  }

  /**
   * Log critical error
   */
  critical(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('critical', message, metadata);
    
    if (error) {
      captureException(error, {
        tags: {
          operation: this.context.operation || 'unknown',
          component: this.context.component || 'unknown',
        },
        extra: {
          ...this.context,
          ...metadata,
        },
        level: 'fatal',
      });
    } else {
      captureMessage(message, 'fatal', {
        tags: {
          operation: this.context.operation || 'unknown',
        },
        extra: { ...this.context, ...metadata },
      });
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const logData = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...this.context,
      ...metadata,
    };

    // Console output with appropriate method
    const consoleMethod = level === 'error' || level === 'critical' ? 'error' : 
                          level === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}]`, message, logData);

    // Add to Sentry breadcrumbs for context
    addBreadcrumb({
      category: this.context.component || 'app',
      message: `${this.context.operation || 'unknown'}: ${message}`,
      level: level === 'critical' ? 'fatal' : level,
      data: logData,
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger({
      ...this.context,
      ...additionalContext,
    });
  }
}

/**
 * Create a logger for a specific component/operation
 */
export function createLogger(context: Partial<LogContext>): StructuredLogger {
  return new StructuredLogger(context);
}

/**
 * Track payment operation with structured logging
 */
export function logPaymentOperation(
  operation: 'create' | 'process' | 'refund' | 'void',
  status: 'started' | 'success' | 'failed',
  metadata: {
    amount?: number;
    paymentMethod?: string;
    folioId?: string;
    error?: Error;
  }
) {
  const logger = createLogger({
    operation: `payment_${operation}`,
    component: 'PaymentSystem',
  });

  if (status === 'started') {
    logger.info(`Payment ${operation} started`, metadata);
  } else if (status === 'success') {
    logger.info(`Payment ${operation} completed successfully`, metadata);
  } else {
    logger.error(`Payment ${operation} failed`, metadata.error, metadata);
  }
}

/**
 * Track database operation with structured logging
 */
export function logDatabaseOperation(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  status: 'started' | 'success' | 'failed',
  metadata?: {
    rowCount?: number;
    duration?: number;
    error?: Error;
  }
) {
  const logger = createLogger({
    operation: `db_${operation}`,
    component: 'Database',
  });

  const message = `${operation.toUpperCase()} ${table}`;

  if (status === 'started') {
    logger.debug(message, metadata);
  } else if (status === 'success') {
    logger.info(`${message} completed`, metadata);
  } else {
    logger.error(`${message} failed`, metadata?.error, metadata);
  }
}
