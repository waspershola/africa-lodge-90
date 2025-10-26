import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { calculateTaxesAndCharges } from '@/lib/tax-calculator';

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  preparation_time?: number;
  dietary_info?: string[];
  tags?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy compatibility
  category?: string;
  base_price?: number;
  prep_time_mins?: number;
  stations?: string[];
  inventory_tracked?: boolean;
  available?: boolean;
}

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  line_total?: number;
  special_requests?: string;
  tenant_id?: string;
  created_at?: string;
  // Legacy compatibility
  menu_item?: MenuItem;
  qty?: number;
  modifiers?: Array<{
    id: string;
    name: string;
    price_delta: number;
  }>;
  notes?: string;
  subtotal?: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  order_type: 'dine_in' | 'takeaway' | 'room_service' | 'delivery';
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  room_id?: string;
  subtotal: number;
  tax_amount?: number;
  service_charge?: number;
  total_amount?: number;
  special_instructions?: string;
  order_time?: string;
  promised_time?: string;
  completed_time?: string;
  taken_by?: string;
  prepared_by?: string;
  served_by?: string;
  folio_id?: string;
  created_at?: string;
  updated_at?: string;
  // Additional properties for component compatibility
  source: 'qr' | 'walkin' | 'phone';
  guest_name: string;
  items: OrderItem[];
  payment_status: 'unpaid' | 'charged' | 'paid';
  notes?: string;
  eta_minutes?: number;
  assigned_staff?: string;
  guest_id?: string;
}

export interface KitchenTicket {
  ticket_id: string;
  order_id: string;
  order_number: string;
  station: string;
  items: OrderItem[];
  start_time?: string;
  eta: string;
  status: 'pending' | 'preparing' | 'ready';
  assigned_chef?: string;
  room_id?: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface POSStats {
  ordersToday: number;
  revenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export function usePOSApi() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>([]);
  const [stats, setStats] = useState<POSStats>({
    ordersToday: 0,
    revenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.tenant_id) {
      loadOrders();
      loadMenuItems();
      loadMenuCategories();
      loadStats();
    }
  }, [user?.tenant_id]);

  const loadOrders = async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('pos_orders')
        .select(`
          *,
          items:pos_order_items (*),
          room:room_id (room_number)
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedOrders = (data || []).map(order => ({
        id: order.id,
        tenant_id: order.tenant_id,
        order_number: order.order_number,
        order_type: order.order_type as 'dine_in' | 'takeaway' | 'room_service' | 'delivery',
        status: order.status as 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
        room_id: order.room_id,
        subtotal: Number(order.subtotal) || 0,
        tax_amount: order.tax_amount ? Number(order.tax_amount) : undefined,
        service_charge: order.service_charge ? Number(order.service_charge) : undefined,
        total_amount: order.total_amount ? Number(order.total_amount) : undefined,
        special_instructions: order.special_instructions,
        order_time: order.order_time,
        promised_time: order.promised_time,
        completed_time: order.completed_time,
        taken_by: order.taken_by,
        prepared_by: order.prepared_by,
        served_by: order.served_by,
        folio_id: order.folio_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
        // Legacy compatibility mapping
        source: order.order_type === 'room_service' ? 'qr' as const : 'walkin' as const,
        guest_name: order.room_id ? `Room ${order.room_id}` : 'Walk-in Customer',
        items: (order.items || []).map((item: any) => ({
          menu_item_id: item.menu_item_id,
          menu_item: {
            id: item.menu_item_id,
            tenant_id: order.tenant_id,
            category_id: 'default',
            name: item.item_name,
            price: item.item_price,
            is_available: true,
            preparation_time: 15,
          } as MenuItem,
          qty: item.quantity,
          quantity: item.quantity,
          modifiers: [],
          subtotal: item.line_total || (item.quantity * item.item_price),
          item_name: item.item_name,
          item_price: item.item_price,
          line_total: item.line_total
        })),
        payment_status: 'unpaid' as const,
        notes: order.special_instructions,
        eta_minutes: 25,
        assigned_staff: order.prepared_by || 'Kitchen Staff',
        guest_id: order.room_id || 'walk-in'
      }));
      
      setOrders(processedOrders);
      generateKitchenTickets(processedOrders);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    }
  };

  const loadMenuItems = async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:category_id (*)
        `)
        .eq('tenant_id', user.tenant_id)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;

      setMenuItems((data || []).map(item => ({
        ...item,
        category: item.category?.name || 'Uncategorized'
      })));
    } catch (err: any) {
      console.error('Failed to load menu items:', err);
    }
  };

  const loadMenuCategories = async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      setMenuCategories(data || []);
    } catch (err: any) {
      console.error('Failed to load menu categories:', err);
    }
  };

  const loadStats = async () => {
    if (!user?.tenant_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's orders count
      const { count: todayCount } = await supabase
        .from('pos_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .gte('created_at', today);

      // Get revenue for today
      const { data: revenueData } = await supabase
        .from('pos_orders')
        .select('total_amount')
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'delivered')
        .gte('created_at', today);

      const revenue = revenueData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

      // Get status counts
      const { count: pendingCount } = await supabase
        .from('pos_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'pending');

      const { count: preparingCount } = await supabase
        .from('pos_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'preparing');

      const { count: readyCount } = await supabase
        .from('pos_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'ready');

      const { count: completedCount } = await supabase
        .from('pos_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'delivered')
        .gte('created_at', today);

      const { count: cancelledCount } = await supabase
        .from('pos_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'cancelled')
        .gte('created_at', today);

      setStats({
        ordersToday: todayCount || 0,
        revenue,
        averageOrderValue: todayCount ? revenue / todayCount : 0,
        pendingOrders: pendingCount || 0,
        preparingOrders: preparingCount || 0,
        readyOrders: readyCount || 0,
        completedOrders: completedCount || 0,
        cancelledOrders: cancelledCount || 0
      });
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const generateKitchenTickets = (orders: Order[]) => {
    const tickets: KitchenTicket[] = orders
      .filter(order => ['accepted', 'preparing'].includes(order.status))
      .map(order => ({
        ticket_id: `${order.id}-kitchen`,
        order_id: order.id,
        order_number: order.order_number,
        station: 'kitchen',
        items: [], // Would be populated from order items
        eta: new Date(Date.now() + 20 * 60000).toISOString(),
        status: order.status as 'pending' | 'preparing' | 'ready',
        room_id: order.room_id,
        priority: order.room_id ? 'high' : 'normal'
      }));

    setKitchenTickets(tickets);
  };

  const acceptOrder = async (orderId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pos_orders')
        .update({
          status: 'accepted',
          taken_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'order_accepted',
          resource_type: 'pos_order',
          resource_id: orderId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `POS order accepted by ${user.name || user.email}`
        }]);

      await loadOrders();
      await loadStats();
      
      toast({
        title: "Order Accepted",
        description: "Order has been accepted and sent to kitchen.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'preparing') {
        updates.prepared_by = user.id;
      } else if (status === 'delivered') {
        updates.served_by = user.id;
        updates.completed_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pos_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'order_status_updated',
          resource_type: 'pos_order',
          resource_id: orderId,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `Order status changed to ${status}`,
          new_values: { status }
        }]);

      await loadOrders();
      await loadStats();
      
      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (orderId: string, paymentMethodId: string, amount: number) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const order = orders.find(o => o.id === orderId);
      
      // If payment method is credit/folio type, charge to room folio
      const { data: paymentMethod } = await supabase
        .from('payment_methods')
        .select('type')
        .eq('id', paymentMethodId)
        .single();

      if (paymentMethod?.type === 'credit' && order?.room_id) {
        // Get active reservation and folio
        const { data: reservation } = await supabase
          .from('reservations')
          .select('id, guest_id')
          .eq('room_id', order.room_id)
          .eq('status', 'checked_in')
          .single();

        if (reservation) {
          // Fetch hotel configuration for tax calculation
          const { data: hotelSettings } = await supabase
            .from('hotel_settings')
            .select('*')
            .eq('tenant_id', user.tenant_id)
            .single();

          // Check if guest is tax exempt
          const { data: guest } = await supabase
            .from('guests')
            .select('tax_exempt')
            .eq('id', reservation.guest_id)
            .single();

          // Calculate tax breakdown for food/beverage charges
          const taxCalculation = calculateTaxesAndCharges({
            baseAmount: amount,
            chargeType: 'food',
            guestTaxExempt: guest?.tax_exempt || false,
            configuration: {
              tax: {
                vat_rate: hotelSettings?.tax_rate || 7.5,
                service_charge_rate: hotelSettings?.service_charge_rate || 10.0,
                tax_inclusive: hotelSettings?.tax_inclusive || false,
                service_charge_inclusive: hotelSettings?.service_charge_inclusive || false,
                vat_applicable_to: hotelSettings?.vat_applicable_to || ['room', 'food', 'beverage', 'laundry', 'spa'],
                service_applicable_to: hotelSettings?.service_applicable_to || ['room', 'food', 'beverage', 'spa']
              }
            } as any
          });

          // Use safe folio handler
          const { data: folioId } = await supabase
            .rpc('handle_multiple_folios', {
              p_reservation_id: reservation.id
            });

          if (folioId) {
            await supabase
              .from('folio_charges')
              .insert([{
                folio_id: folioId,
                charge_type: 'food',
                description: `POS Order ${order.order_number}`,
                amount: taxCalculation.totalAmount,
                base_amount: taxCalculation.baseAmount,
                vat_amount: taxCalculation.vatAmount,
                service_charge_amount: taxCalculation.serviceChargeAmount,
                is_taxable: true,
                is_service_chargeable: true,
                posted_by: user.id,
                tenant_id: user.tenant_id
              }]);
          }
        }
      } else {
        // For other payment types, create payment record
        await supabase
          .from('payments')
          .insert([{
            tenant_id: user.tenant_id,
            folio_id: null,
            amount,
            payment_method: paymentMethodId,
            payment_method_id: paymentMethodId,
            status: 'completed',
            processed_by: user.id
          }]);
      }

      // Update order payment status
      await supabase
        .from('pos_orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', orderId);

      await loadOrders();
      
      toast({
        title: "Payment Processed",
        description: `Payment of ₦${amount.toLocaleString()} processed successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      await loadMenuItems();
      
      toast({
        title: "Menu Updated",
        description: "Menu item has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update menu item",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    orders,
    menuItems,
    menuCategories,
    kitchenTickets,
    stats,
    isLoading,
    acceptOrder,
    updateOrderStatus,
    processPayment,
    updateMenuItem,
    refresh: loadOrders
  };
}