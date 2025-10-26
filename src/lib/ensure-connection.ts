/**
 * Phase H.3: Pre-flight connection check
 * 
 * Ensures connection is stable before performing critical RPC operations.
 * Prevents "Operation Timeout" errors on tab return by probing connection first.
 */

import { supabaseHealthMonitor } from './supabase-health-monitor';

interface EnsureConnectionOptions {
  operationName: string;
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
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
    timeoutMs = 20000
  } = options;

  console.log(`[EnsureConnection] Pre-flight check for: ${operationName}`);
  console.time(`[EnsureConnection] ${operationName}`);

  // Quick 1s health probe
  const healthCheckPromise = supabaseHealthMonitor.checkHealth();
  const timeoutPromise = new Promise<boolean>((_, reject) =>
    setTimeout(() => reject(new Error('Health check timeout')), 1000)
  );

  let isHealthy = false;
  try {
    isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);
  } catch (error) {
    console.warn(`[EnsureConnection] Health check timed out for ${operationName}, assuming healthy`);
    isHealthy = true; // Assume healthy if check is slow
  }

  if (!isHealthy) {
    console.warn(`[EnsureConnection] Connection unstable before ${operationName}, attempting recovery...`);
    
    // Attempt reconnection
    await supabaseHealthMonitor.forceReconnect();
    
    // Wait for stabilization
    console.log(`[EnsureConnection] Waiting ${retryDelay}ms for connection to stabilize...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
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
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[EnsureConnection] ❌ ${operationName} failed (attempt ${attempt + 1}):`, error);
      
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
    timeoutMs: 20000
  });
}
