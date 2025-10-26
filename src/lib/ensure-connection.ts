/**
 * Phase H.3: Pre-flight connection check
 * 
 * Ensures connection is stable before performing critical RPC operations.
 * Prevents "Operation Timeout" errors on tab return by probing connection first.
 */

import { supabaseHealthMonitor } from './supabase-health-monitor';
import { connectionManager } from './connection-manager';

interface EnsureConnectionOptions {
  operationName: string;
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

// PHASE H.14: Circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  state: 'closed' as 'closed' | 'open' | 'half-open',
  cooldownTimeout: null as NodeJS.Timeout | null,
};

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN = 10000; // 10 seconds

function checkCircuitBreaker(operationName: string): void {
  if (circuitBreaker.state === 'open') {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_COOLDOWN) {
      const remainingTime = Math.ceil((CIRCUIT_BREAKER_COOLDOWN - timeSinceLastFailure) / 1000);
      throw new Error(`CIRCUIT_BREAKER_OPEN: Connection unstable. Retrying in ${remainingTime}s. Please check your internet connection.`);
    } else {
      // Transition to half-open for retry
      circuitBreaker.state = 'half-open';
      console.log('[CircuitBreaker] Transitioning to half-open state for retry');
    }
  }
}

function recordSuccess(): void {
  if (circuitBreaker.state === 'half-open') {
    console.log('[CircuitBreaker] Operation succeeded in half-open state - resetting to closed');
  }
  circuitBreaker.failures = 0;
  circuitBreaker.state = 'closed';
  if (circuitBreaker.cooldownTimeout) {
    clearTimeout(circuitBreaker.cooldownTimeout);
    circuitBreaker.cooldownTimeout = null;
  }
}

function recordFailure(operationName: string): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.state = 'open';
    console.error(`[CircuitBreaker] ⚠️ Circuit breaker OPEN after ${circuitBreaker.failures} failures - entering ${CIRCUIT_BREAKER_COOLDOWN / 1000}s cooldown`);
    
    // H.19: Notify connectionManager to pause reconnection attempts
    connectionManager['setConnectionStatus']?.('degraded');
    
    // Emit event for UI to show alert
    window.dispatchEvent(new CustomEvent('connection:circuit-breaker-open', {
      detail: { 
        failures: circuitBreaker.failures,
        cooldownSeconds: CIRCUIT_BREAKER_COOLDOWN / 1000,
        operation: operationName
      }
    }));
    
    // Auto-reset after cooldown
    if (circuitBreaker.cooldownTimeout) {
      clearTimeout(circuitBreaker.cooldownTimeout);
    }
    circuitBreaker.cooldownTimeout = setTimeout(() => {
      console.log('[CircuitBreaker] Cooldown complete - transitioning to half-open');
      circuitBreaker.state = 'half-open';
      circuitBreaker.failures = 0;
      
      // H.19: Notify connectionManager to attempt recovery
      connectionManager['setConnectionStatus']?.('reconnecting');
      connectionManager.triggerReconnect('circuit-breaker-recovery').catch(err => {
        console.error('[CircuitBreaker] Recovery reconnect failed:', err);
      });
    }, CIRCUIT_BREAKER_COOLDOWN);
  }
}

/**
 * Ensures Supabase connection is healthy before executing an operation.
 * If connection is unstable, performs a quick reconnect and retries.
 * 
 * @param operation - The async operation to execute
 * @param options - Configuration options
 * @returns The result of the operation
 * @throws Error if connection cannot be established or operation fails
 */
export async function ensureConnection<T>(
  operation: () => Promise<T>,
  options: EnsureConnectionOptions
): Promise<T> {
  const {
    operationName,
    maxRetries = 1,
    retryDelay = 2000,
    timeoutMs = 8000 // PHASE H.12: Reduced from 20s to 8s
  } = options;

  // PHASE H.14: Check circuit breaker first
  try {
    checkCircuitBreaker(operationName);
  } catch (error) {
    console.error(`[EnsureConnection] ${error.message}`);
    throw error;
  }

  console.log(`[EnsureConnection] Pre-flight check for: ${operationName}`);
  console.time(`[EnsureConnection] ${operationName}`);

  // PHASE H.12: Reduced health check timeout from 5s to 2s, with retries
  let isHealthy = false;
  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 2;
  
  while (healthCheckAttempts < maxHealthCheckAttempts && !isHealthy) {
    healthCheckAttempts++;
    
    try {
      const healthCheckPromise = supabaseHealthMonitor.checkHealth();
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 2000) // 2s timeout
      );

      isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);
      
      if (isHealthy) {
        console.log(`[EnsureConnection] ✅ Health check passed (attempt ${healthCheckAttempts}/${maxHealthCheckAttempts})`);
      }
    } catch (error) {
      console.warn(`[EnsureConnection] Health check attempt ${healthCheckAttempts}/${maxHealthCheckAttempts} timed out for ${operationName}`);
      
      if (healthCheckAttempts >= maxHealthCheckAttempts) {
        // PHASE H.12: CRITICAL - Fail fast instead of assuming healthy
        console.error(`[EnsureConnection] ❌ Health check failed after ${maxHealthCheckAttempts} attempts - aborting ${operationName}`);
        recordFailure(operationName);
        throw new Error(`CONNECTION_UNHEALTHY: ${operationName} aborted - connection check failed after ${maxHealthCheckAttempts * 2}s`);
      }
      
      // Wait 500ms before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!isHealthy) {
    console.warn(`[EnsureConnection] Connection unstable before ${operationName}, attempting recovery...`);
    
    // Attempt reconnection
    await supabaseHealthMonitor.forceReconnect();
    
    // Wait for stabilization
    console.log(`[EnsureConnection] Waiting ${retryDelay}ms for connection to stabilize...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  // PHASE H.13: Wait for connection ready (channels healthy)
  try {
    await connectionManager.waitForConnectionReady(5000);
  } catch (error) {
    console.error(`[EnsureConnection] Connection not ready for ${operationName}:`, error);
    recordFailure(operationName);
    throw new Error(`CONNECTION_NOT_READY: ${operationName} - ${error.message}`);
  }

  // Execute operation with timeout
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[EnsureConnection] Executing ${operationName} (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      const operationPromise = operation();
      const timeoutPromise = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`OPERATION_TIMEOUT: ${operationName}`)), timeoutMs)
      );

      const result = await Promise.race([operationPromise, timeoutPromise]);
      
      console.timeEnd(`[EnsureConnection] ${operationName}`);
      console.log(`[EnsureConnection] ✅ ${operationName} completed successfully`);
      
      // PHASE H.14: Record success to reset circuit breaker
      recordSuccess();
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[EnsureConnection] ❌ ${operationName} failed (attempt ${attempt + 1}):`, error);
      
      // PHASE H.14: Record failure for circuit breaker
      recordFailure(operationName);
      
      if (attempt < maxRetries) {
        console.log(`[EnsureConnection] Retrying ${operationName} in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.timeEnd(`[EnsureConnection] ${operationName}`);
  throw new Error(
    `${operationName} failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Simpler wrapper for operations that don't need custom retry logic
 */
export async function withConnectionCheck<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  return ensureConnection(operation, {
    operationName,
    maxRetries: 1,
    retryDelay: 2000,
    timeoutMs: 8000 // PHASE H.12: Reduced from 20s to 8s
  });
}

// PHASE H.14: Export circuit breaker state for UI
export function getCircuitBreakerState() {
  return {
    isOpen: circuitBreaker.state === 'open',
    failures: circuitBreaker.failures,
    state: circuitBreaker.state,
    cooldownRemaining: circuitBreaker.state === 'open' 
      ? Math.max(0, CIRCUIT_BREAKER_COOLDOWN - (Date.now() - circuitBreaker.lastFailure))
      : 0
  };
}
