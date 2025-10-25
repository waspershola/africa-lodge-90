/**
 * Connection Debug Utilities
 * 
 * Provides real-time monitoring and debugging tools for connection health
 * Access via window.__CONNECTION_DEBUG__ in browser console
 */

import { supabaseHealthMonitor } from './supabase-health-monitor';
import { realtimeChannelManager } from './realtime-channel-manager';
import { connectionManager } from './connection-manager';

interface ReconnectionMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lastAttemptTime: Date | null;
  lastSuccessTime: Date | null;
  averageRecoveryTime: number;
  circuitBreakerActivations: number;
}

class ConnectionDebugger {
  private metrics: ReconnectionMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    lastAttemptTime: null,
    lastSuccessTime: null,
    averageRecoveryTime: 0,
    circuitBreakerActivations: 0
  };

  private recoveryTimes: number[] = [];
  private startTime = Date.now();

  constructor() {
    this.setupEventListeners();
    console.log('[ConnectionDebug] 🔍 Monitoring initialized');
  }

  private setupEventListeners() {
    // Monitor custom reconnection events
    window.addEventListener('connection:force-reconnect', ((e: CustomEvent) => {
      this.logReconnectionAttempt(e.detail);
    }) as EventListener);
  }

  private logReconnectionAttempt(reason: string) {
    this.metrics.totalAttempts++;
    this.metrics.lastAttemptTime = new Date();
    
    console.log(`[ConnectionDebug] 🔄 Reconnection attempt #${this.metrics.totalAttempts}:`, {
      reason,
      timestamp: this.metrics.lastAttemptTime.toISOString()
    });
  }

  /**
   * Get current connection statistics
   */
  getStats() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const channelStats = realtimeChannelManager.getStats();
    
    return {
      uptime: `${Math.floor(uptime / 60)}m ${uptime % 60}s`,
      reconnections: {
        ...this.metrics,
        successRate: this.metrics.totalAttempts > 0 
          ? `${((this.metrics.successfulAttempts / this.metrics.totalAttempts) * 100).toFixed(1)}%`
          : 'N/A'
      },
      channels: channelStats,
      health: {
        lastCheck: this.metrics.lastAttemptTime,
        isHealthy: channelStats.unhealthy === 0
      }
    };
  }

  /**
   * Log current system state
   */
  logStatus() {
    const stats = this.getStats();
    console.log('[ConnectionDebug] 📊 System Status:', stats);
    return stats;
  }

  /**
   * Test reconnection manually
   */
  async testReconnection() {
    console.log('[ConnectionDebug] 🧪 Manual reconnection test started');
    const startTime = Date.now();
    
    try {
      await supabaseHealthMonitor.forceReconnect();
      const duration = Date.now() - startTime;
      
      this.metrics.successfulAttempts++;
      this.metrics.lastSuccessTime = new Date();
      this.recoveryTimes.push(duration);
      
      if (this.recoveryTimes.length > 0) {
        this.metrics.averageRecoveryTime = 
          this.recoveryTimes.reduce((a, b) => a + b, 0) / this.recoveryTimes.length;
      }
      
      console.log(`[ConnectionDebug] ✅ Manual test successful (${duration}ms)`);
      return { success: true, duration };
    } catch (error) {
      this.metrics.failedAttempts++;
      console.error('[ConnectionDebug] ❌ Manual test failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Monitor health checks for a duration
   */
  async monitorHealthChecks(durationSeconds: number = 60) {
    console.log(`[ConnectionDebug] 👀 Monitoring health checks for ${durationSeconds}s`);
    
    const results: any[] = [];
    const interval = 5000; // Check every 5s
    const iterations = Math.floor((durationSeconds * 1000) / interval);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const isHealthy = await supabaseHealthMonitor.checkHealth();
      const duration = Date.now() - startTime;
      
      results.push({
        iteration: i + 1,
        healthy: isHealthy,
        duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[ConnectionDebug] Check ${i + 1}/${iterations}: ${isHealthy ? '✅' : '❌'} (${duration}ms)`);
      
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    const summary = {
      total: results.length,
      successful: results.filter(r => r.healthy).length,
      failed: results.filter(r => !r.healthy).length,
      avgDuration: Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length),
      maxDuration: Math.max(...results.map(r => r.duration)),
      minDuration: Math.min(...results.map(r => r.duration))
    };
    
    console.log('[ConnectionDebug] 📈 Monitoring Summary:', summary);
    return { results, summary };
  }

  /**
   * Check for issues
   */
  diagnose() {
    const stats = this.getStats();
    const issues: string[] = [];
    
    // Check channel health
    if (stats.channels.unhealthy > 0) {
      issues.push(`⚠️ ${stats.channels.unhealthy} unhealthy channels detected`);
    }
    
    // Check reconnection rate
    if (this.metrics.totalAttempts > 10) {
      const failureRate = (this.metrics.failedAttempts / this.metrics.totalAttempts) * 100;
      if (failureRate > 20) {
        issues.push(`⚠️ High failure rate: ${failureRate.toFixed(1)}%`);
      }
    }
    
    // Check circuit breaker
    if (this.metrics.circuitBreakerActivations > 0) {
      issues.push(`⚠️ Circuit breaker activated ${this.metrics.circuitBreakerActivations} times`);
    }
    
    if (issues.length === 0) {
      console.log('[ConnectionDebug] ✅ No issues detected - system healthy');
      return { healthy: true, issues: [] };
    } else {
      console.warn('[ConnectionDebug] ⚠️ Issues detected:', issues);
      return { healthy: false, issues };
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      lastAttemptTime: null,
      lastSuccessTime: null,
      averageRecoveryTime: 0,
      circuitBreakerActivations: 0
    };
    this.recoveryTimes = [];
    this.startTime = Date.now();
    console.log('[ConnectionDebug] 🔄 Metrics reset');
  }

  /**
   * F.11.5: Generate health report with grade
   */
  getHealthReport(): string {
    const stats = this.getStats();
    const uptime = stats.uptime;
    
    const successRate = this.metrics.totalAttempts > 0
      ? ((this.metrics.successfulAttempts / this.metrics.totalAttempts) * 100).toFixed(1)
      : '100.0';
    
    const avgRecovery = Math.round(this.metrics.averageRecoveryTime);
    
    // Calculate grade based on performance
    let grade = 'A+';
    if (parseFloat(successRate) < 95 || avgRecovery > 5000) grade = 'A';
    if (parseFloat(successRate) < 90 || avgRecovery > 10000) grade = 'B';
    if (parseFloat(successRate) < 80 || avgRecovery > 15000) grade = 'C';
    if (parseFloat(successRate) < 70 || avgRecovery > 20000) grade = 'D';
    
    return `
╔════════════════════════════════════════╗
║    CONNECTION HEALTH REPORT            ║
╠════════════════════════════════════════╣
║ Grade: ${grade.padEnd(34)}║
║ Uptime: ${uptime.padEnd(33)}║
║ Success Rate: ${successRate}%${' '.repeat(25 - successRate.length)}║
║ Avg Recovery: ${avgRecovery}ms${' '.repeat(24 - avgRecovery.toString().length)}║
║ Circuit Breaker: ${this.metrics.circuitBreakerActivations} activations${' '.repeat(18 - this.metrics.circuitBreakerActivations.toString().length)}║
╚════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    const stats = this.getStats();
    const diagnosis = this.diagnose();
    const healthReport = this.getHealthReport();
    
    const report = {
      generatedAt: new Date().toISOString(),
      healthReport,
      stats,
      diagnosis,
      environment: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        visibilityState: document.visibilityState
      }
    };
    
    console.log('[ConnectionDebug] 📄 Debug Report:');
    console.log(healthReport);
    console.log(report);
    
    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2))
        .then(() => console.log('[ConnectionDebug] ✅ Report copied to clipboard'))
        .catch(() => console.log('[ConnectionDebug] ℹ️ Report logged to console'));
    }
    
    return report;
  }
}

// Initialize and expose globally
const connectionDebugger = new ConnectionDebugger();

// Expose debugging utilities
(window as any).__CONNECTION_DEBUG__ = {
  getStats: () => connectionDebugger.getStats(),
  logStatus: () => connectionDebugger.logStatus(),
  testReconnection: () => connectionDebugger.testReconnection(),
  monitorHealthChecks: (seconds?: number) => connectionDebugger.monitorHealthChecks(seconds),
  diagnose: () => connectionDebugger.diagnose(),
  resetMetrics: () => connectionDebugger.resetMetrics(),
  exportLogs: () => connectionDebugger.exportLogs(),
  healthReport: () => {
    console.log(connectionDebugger.getHealthReport());
  },
  help: () => {
    console.log(`
🔍 Connection Debug Utilities

Available commands:
  __CONNECTION_DEBUG__.getStats()           - Get current statistics
  __CONNECTION_DEBUG__.logStatus()          - Log detailed status
  __CONNECTION_DEBUG__.testReconnection()   - Manually test reconnection
  __CONNECTION_DEBUG__.monitorHealthChecks(60) - Monitor for 60 seconds
  __CONNECTION_DEBUG__.diagnose()           - Check for issues
  __CONNECTION_DEBUG__.healthReport()       - Show health grade report
  __CONNECTION_DEBUG__.resetMetrics()       - Reset all metrics
  __CONNECTION_DEBUG__.exportLogs()         - Export debug report
  __CONNECTION_DEBUG__.help()               - Show this help

Example usage:
  // Check current status
  __CONNECTION_DEBUG__.logStatus()
  
  // View health grade
  __CONNECTION_DEBUG__.healthReport()
  
  // Run 2-minute health monitoring
  await __CONNECTION_DEBUG__.monitorHealthChecks(120)
  
  // Diagnose issues
  __CONNECTION_DEBUG__.diagnose()
    `);
  }
};

console.log('[ConnectionDebug] 💡 Type __CONNECTION_DEBUG__.help() for available commands');

export { connectionDebugger };
