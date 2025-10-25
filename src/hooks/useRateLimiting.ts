import { useState, useEffect } from 'react';

interface RateLimitConfig {
  maxConnections: number;
  windowMs: number;
  tenantId?: string;
}

interface ConnectionAttempt {
  timestamp: number;
  tenantId?: string;
}

export const useRateLimiting = (config: RateLimitConfig) => {
  const [connections, setConnections] = useState<ConnectionAttempt[]>([]);
  const [isLimited, setIsLimited] = useState(false);

  useEffect(() => {
    // Clean up old connections periodically
    const cleanup = setInterval(() => {
      const now = Date.now();
      setConnections(prev => 
        prev.filter(conn => now - conn.timestamp < config.windowMs)
      );
    }, config.windowMs / 4);

    return () => clearInterval(cleanup);
  }, [config.windowMs]);

  const checkLimit = (): boolean => {
    const now = Date.now();
    const recentConnections = connections.filter(conn => {
      const withinWindow = now - conn.timestamp < config.windowMs;
      const sameTenant = !config.tenantId || conn.tenantId === config.tenantId;
      return withinWindow && sameTenant;
    });

    const limited = recentConnections.length >= config.maxConnections;
    setIsLimited(limited);
    return limited;
  };

  const recordConnection = () => {
    if (!checkLimit()) {
      setConnections(prev => [...prev, {
        timestamp: Date.now(),
        tenantId: config.tenantId
      }]);
      return true;
    }
    return false;
  };

  const getRemainingTime = (): number => {
    if (!isLimited) return 0;
    
    const oldestConnection = connections
      .filter(conn => !config.tenantId || conn.tenantId === config.tenantId)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    
    if (!oldestConnection) return 0;
    
    const remainingMs = config.windowMs - (Date.now() - oldestConnection.timestamp);
    return Math.max(0, Math.ceil(remainingMs / 1000));
  };

  return {
    isLimited,
    checkLimit,
    recordConnection,
    getRemainingTime,
    activeConnections: connections.length
  };
};

// Global Request Rate Limiter
class RequestRateLimiter {
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private readonly WINDOW_MS = 60000;
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset window if 1 minute has passed
    if (now - this.windowStart > this.WINDOW_MS) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // Check if we're over the limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      console.warn('[Rate Limiter] Request throttled - too many requests');
      return false;
    }
    
    this.requestCount++;
    return true;
  }
  
  getStats() {
    return {
      count: this.requestCount,
      limit: this.MAX_REQUESTS_PER_MINUTE,
      remaining: Math.max(0, this.MAX_REQUESTS_PER_MINUTE - this.requestCount)
    };
  }
  
  reset() {
    this.requestCount = 0;
    this.windowStart = Date.now();
    console.log('[Rate Limiter] Stats reset');
  }
}

export const requestRateLimiter = new RequestRateLimiter();
