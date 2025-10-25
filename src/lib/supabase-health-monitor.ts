import { supabase } from '@/integrations/supabase/client';

class SupabaseHealthMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnecting = false;
  private lastHealthCheck: Date | null = null;
  private invalidationTimeout: NodeJS.Timeout | null = null;
  private lastInvalidation: Date | null = null;
  
  private listeners: Array<(healthy: boolean) => void> = [];
  
  /**
   * Start monitoring Supabase connection health
   * Checks every 30 seconds, plus on visibility change
   */
  start() {
    console.log('[Supabase Health] Starting connection monitor');
    
    // Initial health check
    this.checkHealth();
    
    // Periodic health checks (every 60 seconds)
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, 60000);
    
    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
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
      
      // Simple ping query with 5-second timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      );
      
      const healthPromise = supabase
        .from('tenants')
        .select('tenant_id')
        .limit(1)
        .single();
      
      await Promise.race([healthPromise, timeoutPromise]);
      
      this.lastHealthCheck = new Date();
      console.log('[Supabase Health] ✅ Connection healthy');
      this.notifyListeners(true);
      return true;
    } catch (error) {
      console.error('[Supabase Health] ❌ Connection unhealthy:', error);
      this.notifyListeners(false);
      
      // Auto-attempt reconnection
      if (!this.reconnecting) {
        await this.forceReconnect();
      }
      
      return false;
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
      // 1. Refresh auth session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Supabase Health] Session refresh failed:', error);
        throw error;
      }
      
      console.log('[Supabase Health] Session refreshed successfully');
      
      // 2. Verify connection with health check
      const healthy = await this.checkHealth();
      
      if (healthy) {
        console.log('[Supabase Health] ✅ Reconnection successful');
        this.notifyListeners(true);
      }
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
