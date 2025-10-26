import { supabase } from '@/integrations/supabase/client';
import { timeout } from '@/lib/timeout';
import { tabCoordinator } from '@/lib/tab-coordinator';

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
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
  
  
  private handleOnline = async () => {
    console.log('[Supabase Health] Network came online');
    window.dispatchEvent(new CustomEvent('connection:force-reconnect', { 
      detail: 'network-online' 
    }));
  };
  
  private handleOffline = () => {
    console.warn('[Supabase Health] Network went offline');
    this.notifyListeners(false);
  };
  
  /**
   * F.9.1 + F.10.4: CORS preflight check with retry logic
   */
  private async _canReachSupabase(): Promise<boolean> {
    // Try up to 3 times with 1s delay
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // H.24: Reduced to 1.5s for fast CORS check
        
        const resp = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/rest/v1/`, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
          headers: { 
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8',
            'x-tab-id': tabCoordinator.tabId
          }
        });
        
        clearTimeout(timeoutId);
        
        if (resp.ok || resp.status === 401) {
          return true; // 401 means API is reachable
        }
        
        // Non-fatal error, retry
        if (attempt < 3) {
          console.warn(`[Supabase Health] Preflight attempt ${attempt} failed (status ${resp.status}), retrying...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err: any) {
        if (attempt === 3) {
          console.error('[Supabase Health] CORS preflight failed after 3 attempts:', err);
          
          // F.10.4: Show user-friendly message for CORS issues
          if (err.name === 'TypeError' && err.message?.includes('CORS')) {
            console.warn('[Supabase Health] 💡 CORS block detected - this is a known Lovable preview issue.');
            console.warn('   Try: 1) Close all tabs except one  2) Hard refresh (Ctrl+Shift+R)  3) Test on production domain');
          }
          return false;
        }
        
        // Retry on error
        console.warn(`[Supabase Health] Preflight attempt ${attempt} error, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    return false;
  }

  /**
   * F.8.1 + F.9.1 + F.10.3 + F.11.1: Improved health check with dynamic timeout
   */
  async checkHealth(): Promise<boolean> {
    // H.24: Reduced timeout for faster reconnection
    const CHECK_TIMEOUT_MS = document.visibilityState === 'visible' ? 3000 : 10000;
    // Visible tabs: 3s (fast), Background tabs: 10s (moderate)
    
    try {
      // F.10.3: Only leader or visible tab runs health checks
      if (!tabCoordinator.shouldRunHealthCheck()) {
        console.log('[Supabase Health] Skipping check - not leader tab');
        return true;
      }
      
      console.log('[Supabase Health] Checking connection...');
      
      // Skip health check if reconnection is already in progress
      if (this.reconnecting) {
        console.log('[Supabase Health] Skipping check - reconnection in progress');
        return true;
      }
      
      // F.9.1: CORS preflight check
      const canReach = await this._canReachSupabase();
      if (!canReach) {
        console.warn('[Supabase Health] Supabase unreachable (CORS block) - skipping session check');
        this.notifyListeners(false);
        return false;
      }
      
      // Phase H.2: Session optimization - skip timeout check on tab visibility
      // This prevents 10-30s blocking timeout when returning to tab
      const { data: { session: memorySession } } = await supabase.auth.getSession();
      
      if (memorySession && document.visibilityState === 'visible') {
        console.log('[Supabase Health] ⚡ Session exists in memory on tab visible, skipping timeout check (Phase H.2 optimization)');
        // Continue with health probe below, skip the timeout wrapper
      } else {
        // F.11.1: Session check with timeout wrapper (only for non-tab-visible scenarios)
        try {
          const sessionResp: any = await Promise.race([
            supabase.auth.getSession(),
            timeout(CHECK_TIMEOUT_MS, new Error('auth-session-timeout'))
          ]);
          
          const session = sessionResp.data?.session;
          if (!session) {
            console.warn('[Supabase Health] No session found - treating as offline but not panicking');
            this.notifyListeners(false);
            return false;
          }
        } catch (err: any) {
          if (err.message === 'auth-session-timeout') {
            console.warn('[Supabase Health] Auth session check timed out - treating as healthy (slow auth is not a connection failure)');
            return true; // Don't fail health check on slow auth
          }
          throw err; // Re-throw other errors
        }
      }
      
      // Get session for health probe (we know it exists now)
      const { data: { session } } = await supabase.auth.getSession();
      
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
          this.notifyListeners(false);
          
          // F.9.2: Auto-attempt reconnection only on first failure via event
          if (this.consecutiveFailures === 0 && !this.reconnecting) {
            this.consecutiveFailures++;
            window.dispatchEvent(new CustomEvent('connection:force-reconnect', { 
              detail: 'health-check-failed' 
            }));
          }
          return false;
        }
        
        // Success - reset counters
        this.lastHealthCheck = new Date();
        this.consecutiveFailures = 0;
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
        
        // F.10.3: Broadcast health status to other tabs
        tabCoordinator.broadcastHealthStatus(true);
        
        return true;
        
      } catch (err) {
        const msg = (err as Error).message || String(err);
        console.error('[Supabase Health] health query timed out or threw:', msg);
        
        // Exponential backoff on failures
        this.consecutiveFailures++;
        this.currentInterval = Math.min(
          30000 * Math.pow(2, this.consecutiveFailures),
          300000
        );
        this.scheduleNextCheck();
        
        this.notifyListeners(false);
        
        // F.9.2: Auto-attempt reconnection only on first failure via event
        if (this.consecutiveFailures === 1 && !this.reconnecting) {
          window.dispatchEvent(new CustomEvent('connection:force-reconnect', { 
            detail: 'health-check-timeout' 
          }));
        }
        
        return false;
      }
    } catch (err) {
      const msg = (err as Error).message || String(err);
      console.error('[Supabase Health] checkHealth failed:', msg);
      
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
   * F.8.4 + F.9.4: Bulletproof reconnecting flag with abort controller
   */
  async forceReconnect() {
    if (this.reconnecting) {
      console.log('[Supabase Health] Reconnection already in progress');
      return;
    }
    
    // F.9.4: Create abort controller for timeout cancellation
    const controller = new AbortController();
    
    // F.8.4: Outer try-catch-finally to bulletproof flag clearing
    try {
      this.reconnecting = true;
      console.log('[Supabase Health] 🔄 Force reconnecting...');
      
      const timeoutPromise = timeout(5000, new Error('forceReconnect-timeout')); // H.24: Reduced from 20s to 5s
      const reconnectPromise = this.attemptReconnection();
      
      try {
        await Promise.race([reconnectPromise, timeoutPromise]);
        
        // Success - reset failure counter
        this.reconnectionFailures = 0;
        console.log('[Supabase Health] ✅ Reconnection successful');
        this.notifyListeners(true);
      } catch (error) {
        // F.9.4: Timeout or error - abort any pending requests
        if ((error as Error).message === 'forceReconnect-timeout') {
          controller.abort();
          console.error('[Supabase Health] Reconnection timed out - aborting');
        } else {
          console.error('[Supabase Health] Reconnection failed:', error);
        }
        
        this.reconnectionFailures++;
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
  
  /**
   * H.25: Check if connection is currently healthy
   */
  isHealthy(): boolean {
    // Healthy if:
    // - No consecutive failures
    // - Not currently reconnecting
    // - Recent successful health check (within 6 minutes)
    const hasRecentHealthCheck = this.lastHealthCheck && 
      (Date.now() - this.lastHealthCheck.getTime()) < 6 * 60 * 1000;
    
    return this.consecutiveFailures === 0 && 
           !this.reconnecting && 
           hasRecentHealthCheck;
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
    
    // F.10.3: Broadcast to other tabs
    tabCoordinator.broadcastHealthStatus(healthy);
  }
}

// Singleton instance
export const supabaseHealthMonitor = new SupabaseHealthMonitor();
