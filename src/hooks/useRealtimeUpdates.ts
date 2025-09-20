import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMultiTenantAuth } from './useMultiTenantAuth';
import { useToast } from './use-toast';

export interface RealtimeConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onUpdate: (payload: any) => void;
  enabled?: boolean;
}

export const useRealtimeUpdates = (configs: RealtimeConfig[]) => {
  const { tenant } = useMultiTenantAuth();
  const { toast } = useToast();

  const setupRealtimeChannels = useCallback(() => {
    if (!tenant?.tenant_id) return () => {};

    const channels = configs
      .filter(config => config.enabled !== false)
      .map(config => {
        const channelName = `hotel_${tenant.tenant_id}_${config.table}`;
        
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes' as any,
            {
              event: config.event,
              schema: 'public',
              table: config.table,
              filter: `tenant_id=eq.${tenant.tenant_id}`
            },
            (payload) => {
              console.log(`Realtime update on ${config.table}:`, payload);
              config.onUpdate(payload);
            }
          )
          .subscribe();

        return channel;
      });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [tenant?.tenant_id, configs]);

  useEffect(() => {
    const cleanup = setupRealtimeChannels();
    return cleanup;
  }, [setupRealtimeChannels]);
};

// Specialized hooks for different domains
export const useRealtimeQROrders = (onUpdate?: (payload: any) => void) => {
  const { toast } = useToast();

  useRealtimeUpdates([{
    table: 'qr_orders',
    event: 'INSERT',
    onUpdate: (payload) => {
      toast({
        title: "New QR Order",
        description: `Guest service request received for ${payload.new.service_type}`,
      });
      onUpdate?.(payload);
    }
  }]);
};

export const useRealtimePOSOrders = (onUpdate?: (payload: any) => void) => {
  const { toast } = useToast();

  useRealtimeUpdates([{
    table: 'pos_orders',
    event: '*',
    onUpdate: (payload) => {
      if (payload.eventType === 'INSERT') {
        toast({
          title: "New Order",
          description: `Order ${payload.new.order_number} created`,
        });
      }
      onUpdate?.(payload);
    }
  }]);
};

export const useRealtimeRooms = (onUpdate?: (payload: any) => void) => {
  const { toast } = useToast();

  useRealtimeUpdates([{
    table: 'rooms',
    event: 'UPDATE',
    onUpdate: (payload) => {
      if (payload.new.status !== payload.old?.status) {
        toast({
          title: "Room Status Updated",
          description: `Room ${payload.new.room_number} is now ${payload.new.status}`,
        });
      }
      onUpdate?.(payload);
    }
  }]);
};

export const useRealtimeHousekeeping = (onUpdate?: (payload: any) => void) => {
  const { toast } = useToast();

  useRealtimeUpdates([{
    table: 'housekeeping_tasks',
    event: '*',
    onUpdate: (payload) => {
      if (payload.eventType === 'INSERT') {
        toast({
          title: "New Housekeeping Task",
          description: `${payload.new.title} assigned`,
        });
      }
      onUpdate?.(payload);
    }
  }]);
};

export const useRealtimeMaintenance = (onUpdate?: (payload: any) => void) => {
  const { toast } = useToast();

  useRealtimeUpdates([{
    table: 'work_orders',
    event: '*',
    onUpdate: (payload) => {
      if (payload.eventType === 'INSERT') {
        toast({
          title: "New Work Order",
          description: `${payload.new.title} created`,
        });
      }
      onUpdate?.(payload);
    }
  }]);
};

export const useRealtimeAudit = (onUpdate?: (payload: any) => void) => {
  useRealtimeUpdates([{
    table: 'audit_log',
    event: 'INSERT',
    onUpdate: onUpdate || (() => {}),
  }]);
};