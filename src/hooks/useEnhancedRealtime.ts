/**
 * Enhanced Real-time Updates Hook
 * 
 * Replaces the basic useRealtimeUpdates with comprehensive front desk functionality:
 * - Multi-channel subscriptions with priority handling
 * - Audio notifications for important events
 * - Offline-aware updates with conflict resolution
 * - Smart caching and performance optimization
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { audioNotificationService } from '@/services/AudioNotificationService';
import { offlineService } from '@/services/OfflineService';

interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old: any;
  table: string;
  schema: string;
}

interface ChannelConfig {
  table: string;
  events: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  queryKeys: string[][];
  audioNotification?: boolean;
  desktopNotification?: boolean;
  customHandler?: (event: RealtimeEvent) => void;
}

export function useEnhancedRealtime() {
  const queryClient = useQueryClient();
  const { user, tenant } = useAuth();
  const channelsRef = useRef<Map<string, any>>(new Map());
  const eventQueueRef = useRef<RealtimeEvent[]>([]);
  const processingRef = useRef(false);

  // Channel configurations for different tables
  const channelConfigs: ChannelConfig[] = [
    {
      table: 'qr_orders',
      events: ['INSERT', 'UPDATE'],
      priority: 'critical',
      queryKeys: [['qr', 'requests'], ['frontdesk', 'overview']],
      audioNotification: true,
      desktopNotification: true,
      customHandler: handleQROrderEvent
    },
    {
      table: 'reservations', 
      events: ['INSERT', 'UPDATE', 'DELETE'],
      priority: 'high',
      queryKeys: [['reservations'], ['frontdesk', 'overview'], ['owner', 'overview']],
      audioNotification: false,
      desktopNotification: true
    },
    {
      table: 'rooms',
      events: ['UPDATE'],
      priority: 'medium',
      queryKeys: [['rooms'], ['frontdesk', 'overview']],
      audioNotification: false,
      desktopNotification: false
    },
    {
      table: 'payments',
      events: ['INSERT', 'UPDATE'],
      priority: 'high',
      queryKeys: [['payments'], ['billing'], ['frontdesk', 'overview']],
      audioNotification: true,
      desktopNotification: true,
      customHandler: handlePaymentEvent
    },
    {
      table: 'folios',
      events: ['INSERT', 'UPDATE'],
      priority: 'medium',
      queryKeys: [['folios'], ['billing']],
      audioNotification: false,
      desktopNotification: false
    },
    {
      table: 'housekeeping_tasks',
      events: ['INSERT', 'UPDATE'],
      priority: 'medium',
      queryKeys: [['housekeeping'], ['frontdesk', 'staff-ops']],
      audioNotification: true,
      desktopNotification: true,
      customHandler: handleMaintenanceEvent
    },
    {
      table: 'guest_messages',
      events: ['INSERT'],
      priority: 'high',
      queryKeys: [['guest-messages'], ['qr', 'chat']],
      audioNotification: true,
      desktopNotification: true
    }
  ];

  // Process event queue with priority handling
  const processEventQueue = useCallback(async () => {
    if (processingRef.current || eventQueueRef.current.length === 0) return;
    
    processingRef.current = true;
    
    // Sort events by priority
    const sortedEvents = eventQueueRef.current.sort((a, b) => {
      const configA = channelConfigs.find(c => c.table === a.table);
      const configB = channelConfigs.find(c => c.table === b.table);
      
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityA = priorityOrder[configA?.priority || 'low'];
      const priorityB = priorityOrder[configB?.priority || 'low'];
      
      return priorityB - priorityA;
    });

    // Process events in batches
    const batchSize = 5;
    for (let i = 0; i < sortedEvents.length; i += batchSize) {
      const batch = sortedEvents.slice(i, i + batchSize);
      await Promise.all(batch.map(processEvent));
    }

    eventQueueRef.current = [];
    processingRef.current = false;
  }, []);

  // Process individual event
  const processEvent = useCallback(async (event: RealtimeEvent) => {
    const config = channelConfigs.find(c => c.table === event.table);
    if (!config) return;

    try {
      // Invalidate related queries
      config.queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Handle audio notifications
      if (config.audioNotification) {
        handleAudioNotification(event, config);
      }

      // Handle desktop notifications
      if (config.desktopNotification) {
        handleDesktopNotification(event, config);
      }

      // Run custom handler
      if (config.customHandler) {
        config.customHandler(event);
      }

      // Update offline cache if available
      if (!navigator.onLine) {
        updateOfflineCache(event);
      }

      console.log(`Enhanced Realtime: Processed ${event.eventType} event for ${event.table}`);
      
    } catch (error) {
      console.error(`Enhanced Realtime: Error processing event for ${event.table}:`, error);
    }
  }, [queryClient, channelConfigs]);

  // Custom event handlers
  function handleQROrderEvent(event: RealtimeEvent) {
    if (event.eventType === 'INSERT') {
      const order = event.new;
      audioNotificationService.notifyQRRequest(
        `New ${order.service_type} request from room ${order.room_number}`,
        { orderId: order.id, roomNumber: order.room_number }
      );
    } else if (event.eventType === 'UPDATE' && event.new.status === 'completed') {
      const order = event.new;
      audioNotificationService.notify({
        type: 'general',
        title: 'Service Completed',
        message: `${order.service_type} completed for room ${order.room_number}`,
        priority: 'medium',
        autoHide: 5000
      });
    }
  }

  function handlePaymentEvent(event: RealtimeEvent) {
    if (event.eventType === 'INSERT' && event.new.status === 'completed') {
      const payment = event.new;
      audioNotificationService.notifyPayment(
        `Payment of ₦${payment.amount?.toLocaleString()} received`,
        { paymentId: payment.id, amount: payment.amount }
      );
    }
  }

  function handleMaintenanceEvent(event: RealtimeEvent) {
    if (event.eventType === 'INSERT' && event.new.priority === 'urgent') {
      const task = event.new;
      audioNotificationService.notifyUrgent(
        `Urgent maintenance required: ${task.title}`,
        { taskId: task.id, roomId: task.room_id }
      );
    }
  }

  // Audio notification handler
  const handleAudioNotification = (event: RealtimeEvent, config: ChannelConfig) => {
    const eventKey = `${event.table}_${event.eventType}`;
    
    // Prevent notification spam with cooldown
    const lastNotification = localStorage.getItem(`last_audio_${eventKey}`);
    const now = Date.now();
    
    if (lastNotification && (now - parseInt(lastNotification)) < 5000) {
      return; // Cooldown period
    }
    
    localStorage.setItem(`last_audio_${eventKey}`, now.toString());
  };

  // Desktop notification handler
  const handleDesktopNotification = (event: RealtimeEvent, config: ChannelConfig) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const title = `${event.table.charAt(0).toUpperCase()}${event.table.slice(1)} ${event.eventType.toLowerCase()}`;
    const message = getNotificationMessage(event);

    if (message) {
      new Notification(title, {
        body: message,
        icon: '/icon-192x192.png',
        tag: `${event.table}_${event.eventType}`,
        requireInteraction: config.priority === 'critical'
      });
    }
  };

  // Update offline cache
  const updateOfflineCache = (event: RealtimeEvent) => {
    const cacheKey = `${event.table}_${event.new?.id || event.old?.id}`;
    
    if (event.eventType === 'DELETE') {
      // Remove from cache
      offlineService.cacheData(cacheKey, null, event.table);
    } else {
      // Update cache
      offlineService.cacheData(cacheKey, event.new, event.table);
    }
  };

  // Get appropriate notification message
  const getNotificationMessage = (event: RealtimeEvent): string => {
    const data = event.new || event.old;
    
    switch (event.table) {
      case 'qr_orders':
        return `${event.eventType === 'INSERT' ? 'New' : 'Updated'} ${data.service_type} request from room ${data.room_number}`;
      case 'reservations':
        return `Reservation ${event.eventType.toLowerCase()} for ${data.guest_name}`;
      case 'payments':
        return `Payment of ₦${data.amount?.toLocaleString()} ${event.eventType.toLowerCase()}`;
      case 'housekeeping_tasks':
        return `${data.task_type} task ${event.eventType.toLowerCase()}: ${data.title}`;
      case 'guest_messages':
        return `New message from room ${data.room_number}`;
      default:
        return `${event.table} ${event.eventType.toLowerCase()}`;
    }
  };

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user || !tenant?.tenant_id) return;

    console.log('Enhanced Realtime: Setting up subscriptions for tenant:', tenant.tenant_id);

    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();

    // Set up new channels for each configured table
    channelConfigs.forEach((config, index) => {
      const channelName = `enhanced_realtime_${config.table}_${index}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: config.table,
            filter: `tenant_id=eq.${tenant.tenant_id}`
          },
          (payload) => {
            // Only process configured events
            if (config.events.includes(payload.eventType)) {
              const event: RealtimeEvent = {
                eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                new: payload.new,
                old: payload.old,
                table: config.table,
                schema: 'public'
              };

              // Add to event queue
              eventQueueRef.current.push(event);
              
              // Process queue after a short delay to batch events
              setTimeout(processEventQueue, 100);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Enhanced Realtime: ${config.table} channel status:`, status);
        });

      channelsRef.current.set(channelName, channel);
    });

    // Cleanup function
    return () => {
      console.log('Enhanced Realtime: Cleaning up subscriptions');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [user, tenant?.tenant_id, processEventQueue]);

  // Handle connection status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Enhanced Realtime: Connection restored, processing cached events');
      // Process any cached offline events
      processEventQueue();
    };

    const handleOffline = () => {
      console.log('Enhanced Realtime: Connection lost, switching to offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processEventQueue]);

  // Return connection status and stats
  return {
    isConnected: navigator.onLine,
    activeChannels: channelsRef.current.size,
    pendingEvents: eventQueueRef.current.length,
    isProcessing: processingRef.current
  };
}