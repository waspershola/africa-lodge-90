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
  errored?: boolean; // F.8.2: Track errored state
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
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startHealthMonitoring();
    this.startHeartbeat();
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
   * F.8.2: Force refresh a single channel with IN-PLACE recreation (no removal)
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
      console.error(`[RealtimeChannelManager] Channel ${id} exceeded retry limit (${metadata.retryLimit})`);
      metadata.errored = true;
      return false;
    }
    
    metadata.reconnectAttempts++;
    
    try {
      // F.8.2: For errored/closed channels, recreate IN-PLACE (don't remove entry)
      if (state === 'errored' || state === 'closed') {
        console.log(`[RealtimeChannelManager] Channel ${id} in ${state} state - recreating in-place`);
        return await this._recreateChannelInPlace(id);
      }
      
      // For other states, try normal reconnection
      await channel.unsubscribe();
      
      // Brief pause to ensure clean disconnect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Resubscribe with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Subscription timeout for channel ${id}`));
        }, 20000);
        
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            metadata.reconnectAttempts = 0;
            metadata.lastActivity = Date.now();
            console.log(`[RealtimeChannelManager] ✅ Channel ${id} reconnected successfully`);
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
      
      // F.8.2: On persistent errors, mark as errored but keep entry
      if (metadata.reconnectAttempts >= 3) {
        console.warn(`[RealtimeChannelManager] Channel ${id} failed 3 times - marked as errored`);
        metadata.errored = true;
      }
      
      return false;
    }
  }
  
  /**
   * F.8.2: Recreate channel in-place with exponential backoff
   */
  private async _recreateChannelInPlace(id: string): Promise<boolean> {
    const entry = this.channels.get(id);
    if (!entry) return false;
    
    const { metadata } = entry;
    const maxAttempts = metadata.retryLimit;
    
    // Cleanup old channel
    try {
      await entry.channel.unsubscribe();
    } catch (e) {
      console.warn(`[RealtimeChannelManager] Error unsubscribing old channel ${id}:`, e);
    }
    
    // Create new channel instance with same ID
    const newChannel = supabase.channel(id);
    
    // Update registry in-place (keep same metadata)
    this.channels.set(id, {
      channel: newChannel,
      metadata: {
        ...metadata,
        lastActivity: Date.now()
      }
    });
    
    console.log(`[RealtimeChannelManager] 🔄 Channel ${id} recreated - attempting subscription with backoff`);
    
    // Subscribe with exponential backoff
    return await this._subscribeChannelWithBackoff(id, maxAttempts);
  }
  
  /**
   * F.8.2: Subscribe channel with exponential backoff
   */
  private async _subscribeChannelWithBackoff(id: string, maxAttempts: number): Promise<boolean> {
    const entry = this.channels.get(id);
    if (!entry) return false;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Subscription timeout on attempt ${attempt}`));
          }, 20000);
          
          entry.channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              entry.metadata.reconnectAttempts = 0;
              entry.metadata.lastActivity = Date.now();
              console.log(`[RealtimeChannelManager] ✅ Channel ${id} subscribed on attempt ${attempt}`);
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              clearTimeout(timeout);
              reject(new Error(`Subscription failed: ${status}`));
            }
          });
        });
        
        // Success!
        this.updateStatus('connected');
        return true;
      } catch (err) {
        entry.metadata.reconnectAttempts = attempt;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 15000); // Cap at 15s
        console.warn(`[RealtimeChannelManager] Subscribe attempt ${attempt}/${maxAttempts} failed for ${id}, retrying in ${delay}ms`, err);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All attempts failed - mark as errored but keep entry
    console.error(`[RealtimeChannelManager] ❌ Channel ${id} failed to subscribe after ${maxAttempts} attempts`);
    entry.metadata.errored = true;
    return false;
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
   * Phase F.5: Enhanced with auto-recovery for closed/errored channels
   */
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (this.channels.size === 0) {
        console.log('[RealtimeChannelManager] No channels registered - passive monitoring mode');
        return;
      }
      
      const unhealthy = this.getUnhealthyChannels();
      const now = Date.now();
      
      // F.5: Check for dead channels (no activity >2 minutes)
      for (const [id, { channel, metadata }] of this.channels.entries()) {
        const timeSinceActivity = now - metadata.lastActivity;
        
        if (timeSinceActivity > 120000 && channel.state !== 'closed') {
          console.warn(`[RealtimeChannelManager] Dead channel detected: ${id} (${Math.floor(timeSinceActivity / 1000)}s inactive)`);
          this.refreshChannel(id);
        }
      }
      
      if (unhealthy.length > 0) {
        console.warn(`[RealtimeChannelManager] Passive monitor: ${unhealthy.length} unhealthy channels detected`);
        
        // F.5: If >3 channels unhealthy, trigger full reconnection
        if (unhealthy.length >= 3) {
          console.error('[RealtimeChannelManager] Critical: >3 channels unhealthy - triggering full reconnect');
          this.reconnectAll();
        }
        
        this.updateStatus('disconnected');
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
   * Phase F.5: Channel heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      // Skip heartbeat if tab is hidden (browser optimization)
      if (document.hidden) {
        return;
      }
      
      for (const [id, { channel, metadata }] of this.channels.entries()) {
        if (channel.state === 'joined') {
          // Update last activity timestamp
          metadata.lastActivity = Date.now();
        }
      }
    }, 60000); // Every 60 seconds
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
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
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
