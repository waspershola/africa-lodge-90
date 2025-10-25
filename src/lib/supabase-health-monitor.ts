import { supabase } from '@/integrations/supabase/client';

class SupabaseHealthMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnecting = false;
  private lastHealthCheck: Date | null = null;
  private invalidationTimeout: NodeJS.Timeout | null = null;
  private lastInvalidation: Date | null = null;
  private consecutiveFailures: number = 0;
  private currentInterval: number = 300000; // Start at 5 minutes
  
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
    
    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
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
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
  
  private handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      console.log('[Supabase Health] Tab became visible - checking connection');
      
      const timeSinceLastCheck = this.lastHealthCheck 
        ? Date.now() - this.lastHealthCheck.getTime()
        : Infinity;
      
      // If more than 2 minutes since last check, force reconnection
      if (timeSinceLastCheck > 120000) {
        console.warn('[Supabase Health] Stale connection detected, forcing reconnection');
        await this.forceReconnect();
      } else {
        await this.checkHealth();
      }
    }
  };
  
  private handleOnline = async () => {
    console.log('[Supabase Health] Network came online - reconnecting');
    await this.forceReconnect();
  };
  
  private handleOffline = () => {
    console.warn('[Supabase Health] Network went offline');
    this.notifyListeners(false);
  };
  
  async checkHealth(): Promise<boolean> {
    try {
      console.log('[Supabase Health] Checking connection...');
      
      // Skip health check if reconnection is already in progress
      if (this.reconnecting) {
        console.log('[Supabase Health] Skipping check - reconnection in progress');
        return true;
      }
      
      // Use auth session check with 10s timeout (increased from 5s)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 10000)
      );
      
      const healthPromise = supabase.auth.getSession();
      
      let result;
      try {
        result = await Promise.race([healthPromise, timeoutPromise]);
      } catch (firstError) {
        // Retry once after 1 second before declaring unhealthy
        console.log('[Supabase Health] First check failed, retrying in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout on retry')), 10000)
          )
        ]);
      }
      
      // Check if we have a valid session OR if we're not logged in (both are "healthy")
      const isHealthy = !result.error;
      
      if (isHealthy) {
        this.lastHealthCheck = new Date();
        this.consecutiveFailures = 0;
        this.currentInterval = 300000; // 5 minutes when healthy
        this.scheduleNextCheck();
        
        // PHASE C.2: Proactively refresh session if expiring soon (< 20 min)
        if (result.data?.session) {
          const expiresAt = result.data.session.expires_at;
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
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('[Supabase Health] ❌ Connection unhealthy:', error);
      
      // Exponential backoff on failures
      this.consecutiveFailures++;
      this.currentInterval = Math.min(
        30000 * Math.pow(2, this.consecutiveFailures), // 30s, 60s, 120s, etc.
        300000 // Max 5 minutes
      );
      this.scheduleNextCheck();
      
      this.notifyListeners(false);
      
      // Auto-attempt reconnection only on first failure
      if (this.consecutiveFailures === 1 && !this.reconnecting) {
        await this.forceReconnect();
      }
      
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
  
  private async forceReconnect() {
    if (this.reconnecting) {
      console.log('[Supabase Health] Reconnection already in progress');
      return;
    }
    
    this.reconnecting = true;
    console.log('[Supabase Health] 🔄 Force reconnecting...');
    
    try {
      // Only refresh auth session - no database queries
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
      
      console.log('[Supabase Health] ✅ Reconnection successful');
      this.notifyListeners(true);
    } catch (error) {
      console.error('[Supabase Health] Reconnection failed:', error);
      this.notifyListeners(false);
    } finally {
      this.reconnecting = false;
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
