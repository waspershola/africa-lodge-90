/**
 * Centralized Realtime Channel Manager
 * 
 * Manages lifecycle of all Supabase Realtime channels:
 * - Registration/unregistration from hooks
 * - Automatic reconnection on tab focus/network recovery
 * - Health monitoring and dead channel detection
 * - Priority-based reconnection waves
 * - Status broadcasting for UI components
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChannelPriority = 'critical' | 'high' | 'normal';

interface ChannelMetadata {
  id: string;
  type: string;
  priority: ChannelPriority;
  createdAt: number;
  lastActivity: number;
  reconnectAttempts: number;
  retryLimit: number;
}

interface ChannelRegistration {
  channel: RealtimeChannel;
  metadata: ChannelMetadata;
}

type ConnectionStatus = 'connected' | 'disconnected';

class RealtimeChannelManager {
  private channels = new Map<string, ChannelRegistration>();
  private reconnecting = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private currentStatus: ConnectionStatus = 'connected';
  private statusDebounceTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startHealthMonitoring();
    console.log('[RealtimeChannelManager] Initialized');
  }
  
  /**
   * Register a channel from a hook for lifecycle management
   */
  registerChannel(
    id: string, 
    channel: RealtimeChannel, 
    metadata?: Partial<ChannelMetadata>
  ): void {
    if (this.channels.has(id)) {
      console.warn(`[RealtimeChannelManager] Channel ${id} already registered`);
      return;
    }
    
    this.channels.set(id, {
      channel,
      metadata: {
        id,
        type: metadata?.type || 'unknown',
        priority: metadata?.priority || 'normal',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        reconnectAttempts: 0,
        retryLimit: metadata?.retryLimit || 10  // Phase 3: Increased from 5 to 10
      }
    });
    
    // PHASE F.3: Immediately update status when first channel registers
    if (this.channels.size === 1) {
      console.log('[RealtimeChannelManager] 🎯 First channel registered - updating status to connected');
      console.log(`[RealtimeChannelManager] Channel ID: ${id}, Type: ${metadata?.type || 'unknown'}`);
      this.updateStatus('connected');
    }
    
    console.log(`[RealtimeChannelManager] ✅ Registered channel: ${id} (type: ${metadata?.type || 'unknown'}, total: ${this.channels.size})`);
  }
  
  /**
   * Unregister and cleanup a channel
   */
  unregisterChannel(id: string): void {
    const entry = this.channels.get(id);
    if (entry) {
      try {
        supabase.removeChannel(entry.channel);
      } catch (error) {
        console.error(`[RealtimeChannelManager] Error removing channel ${id}:`, error);
      }
      this.channels.delete(id);
      console.log(`[RealtimeChannelManager] Unregistered channel: ${id} (remaining: ${this.channels.size})`);
    }
  }
  
  /**
   * Reconnect all channels (called by ConnectionManager on tab focus/network recovery)
   */
  async reconnectAll(): Promise<void> {
    if (this.reconnecting) {
      console.log('[RealtimeChannelManager] Reconnection already in progress');
      return;
    }
    
    if (this.channels.size === 0) {
      console.log('[RealtimeChannelManager] No channels to reconnect');
      return;
    }
    
    this.reconnecting = true;
    console.log(`[RealtimeChannelManager] Reconnecting ${this.channels.size} channels...`);
    
    try {
      // Sort by priority (critical > high > normal)
      const entries = Array.from(this.channels.entries()).sort((a, b) => {
        const priorityOrder: Record<ChannelPriority, number> = { 
          critical: 0, 
          high: 1, 
          normal: 2 
        };
        return priorityOrder[a[1].metadata.priority] - priorityOrder[b[1].metadata.priority];
      });
      
      // Group into priority waves
      const waves = {
        critical: entries.filter(([_, e]) => e.metadata.priority === 'critical'),
        high: entries.filter(([_, e]) => e.metadata.priority === 'high'),
        normal: entries.filter(([_, e]) => e.metadata.priority === 'normal')
      };
      
      // Reconnect critical channels first
      if (waves.critical.length > 0) {
        console.log(`[RealtimeChannelManager] Wave 1: Reconnecting ${waves.critical.length} critical channels`);
        await Promise.all(waves.critical.map(([id]) => this.refreshChannel(id)));
      }
      
      // Wait 100ms before high priority
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (waves.high.length > 0) {
        console.log(`[RealtimeChannelManager] Wave 2: Reconnecting ${waves.high.length} high priority channels`);
        await Promise.all(waves.high.map(([id]) => this.refreshChannel(id)));
      }
      
      // Wait 100ms before normal priority
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (waves.normal.length > 0) {
        console.log(`[RealtimeChannelManager] Wave 3: Reconnecting ${waves.normal.length} normal priority channels`);
        await Promise.all(waves.normal.map(([id]) => this.refreshChannel(id)));
      }
      
      console.log('[RealtimeChannelManager] Reconnection complete');
      this.updateStatus('connected');
    } finally {
      this.reconnecting = false;
    }
  }
  
  /**
   * Force refresh a single channel (unsubscribe + resubscribe)
   */
  async refreshChannel(id: string): Promise<boolean> {
    const entry = this.channels.get(id);
    if (!entry) {
      console.warn(`[RealtimeChannelManager] Channel ${id} not found for refresh`);
      return false;
    }
    
    const { channel, metadata } = entry;
    const state = channel.state;
    
    // Only refresh if unhealthy
    if (state === 'joined' || state === 'joining') {
      metadata.lastActivity = Date.now();
      return true;
    }
    
    console.log(`[RealtimeChannelManager] Refreshing unhealthy channel: ${id} (state: ${state}, type: ${metadata.type})`);
    
    // Check retry limit
    if (metadata.reconnectAttempts >= metadata.retryLimit) {
      console.error(`[RealtimeChannelManager] Channel ${id} exceeded retry limit (${metadata.retryLimit}) - removing`);
      this.unregisterChannel(id);
      return false;
    }
    
    metadata.reconnectAttempts++;
    
    try {
      // Unsubscribe first
      await channel.unsubscribe();
      
      // Brief pause to ensure clean disconnect
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Resubscribe with timeout
      await new Promise<void>((resolve, reject) => {
        // Phase 1: Increased timeout from 5s to 15s
        const timeout = setTimeout(() => {
          reject(new Error(`Subscription timeout for channel ${id}`));
        }, 15000);
        
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            metadata.reconnectAttempts = 0;
            metadata.lastActivity = Date.now();
            console.log(`[RealtimeChannelManager] Channel ${id} reconnected successfully`);
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            reject(new Error(`Failed to reconnect channel ${id}: ${status}`));
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error(`[RealtimeChannelManager] Error refreshing channel ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Get list of unhealthy channels (not joined/joining)
   */
  getUnhealthyChannels(): string[] {
    const unhealthy: string[] = [];
    
    for (const [id, { channel }] of this.channels.entries()) {
      if (channel.state !== 'joined' && channel.state !== 'joining') {
        unhealthy.push(id);
      }
    }
    
    return unhealthy;
  }
  
  /**
   * Get channel statistics for debugging
   */
  getStats() {
    const stats = {
      total: this.channels.size,
      byPriority: { critical: 0, high: 0, normal: 0 },
      byState: { joined: 0, joining: 0, closed: 0, errored: 0 },
      unhealthy: 0
    };
    
    for (const [_, { channel, metadata }] of this.channels.entries()) {
      stats.byPriority[metadata.priority]++;
      
      const state = channel.state;
      if (state === 'joined') stats.byState.joined++;
      else if (state === 'joining') stats.byState.joining++;
      else if (state === 'closed') stats.byState.closed++;
      else stats.byState.errored++;
      
      if (state !== 'joined' && state !== 'joining') {
        stats.unhealthy++;
      }
    }
    
    return stats;
  }
  
  /**
   * Phase 2: Passive health monitoring (reports status only, doesn't reconnect)
   * ConnectionManager handles actual reconnection logic
   */
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (this.channels.size === 0) {
        console.log('[RealtimeChannelManager] No channels registered - passive monitoring mode');
        return;
      }
      
      const unhealthy = this.getUnhealthyChannels();
      
      if (unhealthy.length > 0) {
        console.warn(`[RealtimeChannelManager] Passive monitor: ${unhealthy.length} unhealthy channels detected`);
        this.updateStatus('disconnected');
        
        // Phase 2: NO auto-repair - ConnectionManager handles reconnection
        // Just report status, don't attempt fixes
        console.log('[RealtimeChannelManager] Passive mode - waiting for ConnectionManager to handle reconnection');
      } else if (this.channels.size > 0) {
        // All channels healthy
        this.updateStatus('connected');
      }
      
      // Log stats periodically (every 5 minutes)
      if (Date.now() % (5 * 60 * 1000) < 30000) {
        const stats = this.getStats();
        console.log('[RealtimeChannelManager] Stats:', stats);
      }
    }, 30000);
  }
  
  /**
   * Update connection status and notify listeners
   * PHASE G.3: Add 2-second debounce to prevent banner flicker
   */
  private updateStatus(status: ConnectionStatus): void {
    // Clear any pending status update
    if (this.statusDebounceTimeout) {
      clearTimeout(this.statusDebounceTimeout);
      this.statusDebounceTimeout = null;
    }
    
    // Immediately update to 'connected' (no delay for good news)
    if (status === 'connected') {
      if (this.currentStatus !== status) {
        this.currentStatus = status;
        console.log(`[RealtimeChannelManager] Status changed: ${status}`);
        this.statusListeners.forEach(listener => listener(status));
      }
      return;
    }
    
    // Debounce 'disconnected' status (wait 2s to confirm it's real)
    this.statusDebounceTimeout = setTimeout(() => {
      if (this.currentStatus !== status) {
        this.currentStatus = status;
        console.log(`[RealtimeChannelManager] Status changed: ${status} (debounced)`);
        this.statusListeners.forEach(listener => listener(status));
      }
    }, 2000);
  }
  
  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    
    // Immediately call with current status
    callback(this.currentStatus);
    
    return () => {
      this.statusListeners.delete(callback);
    };
  }
  
  /**
   * Phase 4: Get debug information for diagnostics
   */
  getDebugInfo() {
    const now = Date.now();
    const channels = Array.from(this.channels.entries()).map(([id, { channel, metadata }]) => ({
      id,
      type: metadata.type,
      priority: metadata.priority,
      state: channel.state,
      age: Math.floor((now - metadata.createdAt) / 1000),
      lastActivity: Math.floor((now - metadata.lastActivity) / 1000),
      reconnectAttempts: metadata.reconnectAttempts,
      retryLimit: metadata.retryLimit
    }));
    
    const stats = this.getStats();
    
    return {
      status: this.currentStatus,
      totalChannels: this.channels.size,
      channels,
      stats,
      reconnecting: this.reconnecting,
      lastCheck: new Date().toISOString()
    };
  }
  
  /**
   * Cleanup all channels and stop monitoring
   */
  destroy(): void {
    console.log('[RealtimeChannelManager] Destroying...');
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clear debounce timeout
    if (this.statusDebounceTimeout) {
      clearTimeout(this.statusDebounceTimeout);
      this.statusDebounceTimeout = null;
    }
    
    // Remove all channels
    const channelIds = Array.from(this.channels.keys());
    channelIds.forEach(id => this.unregisterChannel(id));
    
    // Clear listeners
    this.statusListeners.clear();
    
    console.log('[RealtimeChannelManager] Destroyed');
  }
}

// Export singleton instance
export const realtimeChannelManager = new RealtimeChannelManager();
