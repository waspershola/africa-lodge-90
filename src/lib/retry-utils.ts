/**
 * Retry utility with exponential backoff
 * Helps handle transient failures in network requests
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @returns The result of the function call
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        console.error(`[Retry] All ${opts.maxAttempts} attempts failed:`, lastError);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );
      
      console.warn(`[Retry] Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms:`, lastError.message);
      opts.onRetry(attempt, lastError);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error is retryable (network, timeout, 5xx)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }
  
  // 5xx server errors
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Edge function errors
  if (error.message?.includes('EdgeFunction')) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Check for specific error patterns
  if (error.message?.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  
  if (error.message?.includes('plan not found')) {
    return 'Unable to activate trial. Please contact support.';
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (error.status === 500) {
    return 'Server error. Please try again in a moment.';
  }
  
  // Default message
  return error.message || 'An unexpected error occurred. Please try again.';
}
