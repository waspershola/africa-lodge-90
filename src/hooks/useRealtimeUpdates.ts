import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRateLimiting } from './useRateLimiting';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export interface RealtimeConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onUpdate: (payload: any) => void;
  enabled?: boolean;
}

export const useRealtimeUpdates = (configs: RealtimeConfig[]) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Rate limiting per tenant
  const rateLimiter = useRateLimiting({
    maxConnections: 10, // Max 10 realtime connections per tenant
    windowMs: 60000, // 1 minute window
    tenantId: user?.tenant_id
  });

  useEffect(() => {
    const channels: any[] = [];

    configs.forEach((config) => {
      if (!config.enabled) return;

      const tenantId = user?.tenant_id;
      if (!tenantId) return;

      // Check rate limit before creating connection
      if (!rateLimiter.recordConnection()) {
        toast({
          title: "Connection Limited",
          description: `Too many realtime connections. Try again in ${rateLimiter.getRemainingTime()}s`,
          variant: "destructive"
        });
        return;
      }

      // Create tenant-scoped channel name
      const channelName = `hotel_${tenantId}_${config.table}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: config.event,
            schema: 'public',
            table: config.table,
            filter: `tenant_id=eq.${tenantId}`
          } as any,
          (payload: any) => {
            config.onUpdate(payload);
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [configs, user?.tenant_id, rateLimiter]);
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