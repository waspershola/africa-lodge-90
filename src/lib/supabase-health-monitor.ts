import { supabase } from '@/integrations/supabase/client';
import { timeout } from '@/lib/timeout';

class SupabaseHealthMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnecting = false;
  private lastHealthCheck: Date | null = null;
  private invalidationTimeout: NodeJS.Timeout | null = null;
  private lastInvalidation: Date | null = null;
  private consecutiveFailures: number = 0;
  private currentInterval: number = 300000; // Start at 5 minutes
  private sessionRefreshInterval: NodeJS.Timeout | null = null;
  private reconnectionFailures: number = 0;
  private circuitBreakerActive: boolean = false;
  private circuitBreakerTimeout: NodeJS.Timeout | null = null;
  private failureCount: number = 0;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly COOLDOWN_MS = 60000;
  
  private listeners: Array<(healthy: boolean) => void> = [];
  
  /**
   * Start monitoring Supabase connection health
   * Checks every 5 minutes when healthy, plus on visibility change
   */
  start() {
    console.log('[Supabase Health] Starting connection monitor');
    
    // Initial health check
    this.checkHealth();
    
    // Dynamic health checks
    this.scheduleNextCheck();
    
    // Listen for online/offline events (NO visibility handler - ConnectionManager handles it)
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // ✅ F.7: Refresh session every 10 minutes to prevent expiry
    this.sessionRefreshInterval = setInterval(() => {
      console.log('[Supabase Health] Proactively refreshing session (10min interval)');
      supabase.auth.refreshSession();
    }, 10 * 60 * 1000);
  }
  
  private scheduleNextCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.currentInterval);
    
    console.log(`[Supabase Health] Next check in ${this.currentInterval / 1000}s`);
  }
  
  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
      this.sessionRefreshInterval = null;
    }
    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
      this.circuitBreakerTimeout = null;
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
  
  
  private handleOnline = async () => {
    console.log('[Supabase Health] Network came online - reconnecting');
    await this.forceReconnect();
  };
  
  private handleOffline = () => {
    console.warn('[Supabase Health] Network went offline');
    this.notifyListeners(false);
  };
  
  /**
   * F.8.1: Improved health check with better timeout handling and error classification
   */
  async checkHealth(): Promise<boolean> {
    const CHECK_TIMEOUT_MS = 20000; // 20s timeout for background tabs
    
    try {
      console.log('[Supabase Health] Checking connection...');
      
      // Skip health check if reconnection is already in progress
      if (this.reconnecting) {
        console.log('[Supabase Health] Skipping check - reconnection in progress');
        return true;
      }
      
      // F.8.6: Circuit breaker - check failure count
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        console.warn(`[Supabase Health] Circuit breaker active - ${this.FAILURE_THRESHOLD} consecutive failures, entering cooldown`);
        await new Promise(resolve => setTimeout(resolve, this.COOLDOWN_MS));
        this.failureCount = 0;
      }
      
      // Quick local session check first (low cost)
      const sessionResp: any = await Promise.race([
        supabase.auth.getSession(),
        timeout(CHECK_TIMEOUT_MS, new Error('session-get-timeout'))
      ]);
      
      const session = sessionResp.data?.session;
      if (!session) {
        console.warn('[Supabase Health] No session found - treating as offline but not panicking');
        this.failureCount++;
        this.notifyListeners(false);
        return false;
      }
      
      // If session exists, do a lightweight health probe
      try {
        const healthResp: any = await Promise.race([
          supabase
            .from('tenants')
            .select('tenant_id')
            .limit(1)
            .maybeSingle(),
          timeout(CHECK_TIMEOUT_MS, new Error('health-query-timeout'))
        ]);
        
        if (healthResp.error) {
          console.warn('[Supabase Health] Lightweight health query error:', healthResp.error);
          // Network errors => treat as transient
          this.failureCount++;
          this.notifyListeners(false);
          
          // Auto-attempt reconnection only on first failure
          if (this.consecutiveFailures === 0 && !this.reconnecting) {
            this.consecutiveFailures++;
            await this.forceReconnect();
          }
          return false;
        }
        
        // Success - reset counters
        this.lastHealthCheck = new Date();
        this.consecutiveFailures = 0;
        this.failureCount = 0;
        this.currentInterval = 300000; // 5 minutes when healthy
        this.scheduleNextCheck();
        
        // Proactively refresh session if expiring soon (< 20 min)
        if (session) {
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            const twentyMinutes = 20 * 60;
            
            if (expiresIn < twentyMinutes && expiresIn > 0) {
              console.log(`[Supabase Health] ⚠️ Session expiring in ${Math.floor(expiresIn / 60)} minutes - proactively refreshing`);
              await this.proactiveSessionRefresh();
            }
          }
        }
        
        console.log('[Supabase Health] ✅ Connection healthy');
        this.notifyListeners(true);
        return true;
        
      } catch (err) {
        const msg = (err as Error).message || String(err);
        console.error('[Supabase Health] health query timed out or threw:', msg);
        this.failureCount++;
        
        // Exponential backoff on failures
        this.consecutiveFailures++;
        this.currentInterval = Math.min(
          30000 * Math.pow(2, this.consecutiveFailures),
          300000
        );
        this.scheduleNextCheck();
        
        this.notifyListeners(false);
        
        // Auto-attempt reconnection only on first failure
        if (this.consecutiveFailures === 1 && !this.reconnecting) {
          await this.forceReconnect();
        }
        
        return false;
      }
    } catch (err) {
      const msg = (err as Error).message || String(err);
      console.error('[Supabase Health] checkHealth failed:', msg);
      this.failureCount++;
      
      // Exponential backoff
      this.consecutiveFailures++;
      this.currentInterval = Math.min(
        30000 * Math.pow(2, this.consecutiveFailures),
        300000
      );
      this.scheduleNextCheck();
      
      this.notifyListeners(false);
      return false;
    }
  }
  
  /**
   * PHASE C.2: Proactively refresh session before expiry
   * Prevents auth errors due to expired tokens
   */
  private async proactiveSessionRefresh() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Supabase Health] Proactive session refresh failed:', error);
        return;
      }
      
      console.log('[Supabase Health] ✅ Proactive session refresh successful');
    } catch (error) {
      console.error('[Supabase Health] Proactive session refresh error:', error);
    }
  }
  
  /**
   * F.8.4: Bulletproof reconnecting flag with outer try-catch-finally
   */
  async forceReconnect() {
    if (this.reconnecting) {
      console.log('[Supabase Health] Reconnection already in progress');
      return;
    }
    
    // F.4: Circuit breaker - pause after 3 consecutive failures
    if (this.circuitBreakerActive) {
      console.warn('[Supabase Health] Circuit breaker active - skipping reconnection');
      return;
    }
    
    // F.8.4: Outer try-catch-finally to bulletproof flag clearing
    try {
      this.reconnecting = true;
      console.log('[Supabase Health] 🔄 Force reconnecting...');
      
      // F.8.1: Increased timeout to 20 seconds
      try {
        await Promise.race([
          this.attemptReconnection(),
          timeout(20000, new Error('forceReconnect-timeout'))
        ]);
        
        // Success - reset failure counter
        this.reconnectionFailures = 0;
        this.failureCount = 0;
        console.log('[Supabase Health] ✅ Reconnection successful');
        this.notifyListeners(true);
      } catch (error) {
        console.error('[Supabase Health] Reconnection failed:', error);
        this.reconnectionFailures++;
        
        // F.4: Activate circuit breaker after 3 failures
        if (this.reconnectionFailures >= 3) {
          console.warn('[Supabase Health] ⚠️ Circuit breaker activated - pausing for 60s');
          this.circuitBreakerActive = true;
          this.circuitBreakerTimeout = setTimeout(() => {
            this.circuitBreakerActive = false;
            this.reconnectionFailures = 0;
            console.log('[Supabase Health] Circuit breaker reset');
          }, 60000);
        }
        
        this.notifyListeners(false);
      }
    } finally {
      // F.8.4: Ensure flag cleared no matter what
      try {
        this.reconnecting = false;
      } catch (e) {
        console.error('[Supabase Health] clearing reconnecting flag failed', e);
        this.reconnecting = false; // Force it
      }
    }
  }
  
  /**
   * F.8.1: Improved reconnection with better error handling
   */
  private async attemptReconnection() {
    try {
      // Check if user is authenticated first
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.log('[Supabase Health] No active session - skipping token refresh');
        return;
      }
      
      // Only refresh session if user exists
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Supabase Health] Session refresh failed:', error);
        throw error;
      }
      
      console.log('[Supabase Health] Session refreshed successfully');
      
      // Wait 2 seconds for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as healthy without additional health check
      this.consecutiveFailures = 0;
      this.failureCount = 0;
      this.currentInterval = 300000; // Reset to 5 minutes
      this.scheduleNextCheck();
      this.lastHealthCheck = new Date();
    } catch (error) {
      // Catch and rethrow so we don't have uncaught promises
      console.error('[Supabase Health] attemptReconnection threw:', error);
      throw error;
    }
  }
  
  onHealthChange(callback: (healthy: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  private notifyListeners(healthy: boolean) {
    // Clear pending invalidation
    if (this.invalidationTimeout) {
      clearTimeout(this.invalidationTimeout);
      this.invalidationTimeout = null;
    }
    
    // Debounce: only invalidate once per 5 seconds
    if (healthy) {
      const timeSinceLastInvalidation = this.lastInvalidation 
        ? Date.now() - this.lastInvalidation.getTime()
        : Infinity;
      
      if (timeSinceLastInvalidation < 5000) {
        console.log('[Supabase Health] Skipping invalidation - too soon');
        return;
      }
      
      this.lastInvalidation = new Date();
    }
    
    // Notify all listeners
    this.listeners.forEach(callback => callback(healthy));
  }
}

// Singleton instance
export const supabaseHealthMonitor = new SupabaseHealthMonitor();
