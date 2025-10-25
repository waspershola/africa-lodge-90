/**
 * F.10.3: Multi-Tab Coordination
 * Ensures only one tab (leader) performs intensive operations like health checks
 */

class TabCoordinator {
  private channel: BroadcastChannel;
  private isLeader = false;
  public readonly tabId = Math.random().toString(36).substring(2, 15);
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private leaderTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    this.channel = new BroadcastChannel('hotel-pms-tabs');
    
    // Listen for messages from other tabs
    this.channel.onmessage = (e) => {
      switch (e.data.type) {
        case 'tab-join':
          // If a tab with lower ID joins, defer to it
          if (e.data.tabId < this.tabId) {
            this.isLeader = false;
            console.log('[TabCoordinator] Deferring leadership to older tab');
          } else {
            // Tell the new tab we're the leader
            this.channel.postMessage({ type: 'leader-announce', tabId: this.tabId });
          }
          break;
          
        case 'leader-announce':
          // Another tab claims leadership
          if (e.data.tabId < this.tabId) {
            this.isLeader = false;
          }
          break;
          
        case 'leader-heartbeat':
          // Leader is alive, reset our timeout
          if (e.data.tabId !== this.tabId) {
            this.resetLeaderTimeout();
          }
          break;
      }
    };
    
    // Announce our presence
    this.channel.postMessage({ type: 'tab-join', tabId: this.tabId });
    
    // Assume leadership if no response in 1s
    setTimeout(() => {
      if (!this.isLeader) {
        this.becomeLeader();
      }
    }, 1000);
    
    // Setup leader detection timeout
    this.resetLeaderTimeout();
  }
  
  private becomeLeader() {
    this.isLeader = true;
    console.log('[TabCoordinator] ✅ This tab is the leader:', this.tabId);
    this.channel.postMessage({ type: 'leader-announce', tabId: this.tabId });
    
    // Start sending heartbeats
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.channel.postMessage({ type: 'leader-heartbeat', tabId: this.tabId });
    }, 5000);
  }
  
  private resetLeaderTimeout() {
    if (this.leaderTimeout) clearTimeout(this.leaderTimeout);
    
    // If no heartbeat from leader in 10s, become leader
    this.leaderTimeout = setTimeout(() => {
      if (!this.isLeader) {
        console.log('[TabCoordinator] Leader timeout - becoming leader');
        this.becomeLeader();
      }
    }, 10000);
  }
  
  /**
   * Check if this tab should run health checks
   */
  shouldRunHealthCheck(): boolean {
    // Leader always runs checks
    // Non-leader runs checks only if visible (for redundancy)
    return this.isLeader || document.visibilityState === 'visible';
  }
  
  /**
   * Broadcast health status to all tabs
   */
  broadcastHealthStatus(healthy: boolean) {
    this.channel.postMessage({ 
      type: 'health-status', 
      healthy,
      tabId: this.tabId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Listen for health status updates from other tabs
   */
  onHealthStatus(callback: (data: { healthy: boolean; tabId: string; timestamp: number }) => void) {
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'health-status') {
        callback({
          healthy: e.data.healthy,
          tabId: e.data.tabId,
          timestamp: e.data.timestamp
        });
      }
    };
    
    this.channel.addEventListener('message', handler);
    
    return () => {
      this.channel.removeEventListener('message', handler);
    };
  }
  
  destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.leaderTimeout) clearTimeout(this.leaderTimeout);
    this.channel.close();
  }
}

// Singleton instance
export const tabCoordinator = new TabCoordinator();
