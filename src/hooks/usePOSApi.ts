// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

// Updated interfaces to match Supabase schema
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
  category?: {
    name: string;
    description?: string;
  };
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  order_type: 'room_service' | 'dine_in' | 'takeaway';
  room_id?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
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
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  tenant_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  line_total?: number;
  special_requests?: string;
  menu_item?: MenuItem;
}

export interface KitchenTicket {
  id: string;
  order_id: string;
  order_number: string;
  room_number?: string;
  items: {
    name: string;
    quantity: number;
    special_requests?: string;
    preparation_time?: number;
  }[];
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'acknowledged' | 'preparing' | 'ready';
  order_time: string;
  promised_time?: string;
  eta_minutes?: number;
  assigned_staff?: string;
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

  // Load menu items from Supabase
  const loadMenuItems = useCallback(async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(name, description)
        `)
        .eq('tenant_id', user.tenant_id)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;

      const formattedItems: MenuItem[] = (data || []).map(item => ({
        id: item.id,
        tenant_id: item.tenant_id,
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        is_available: item.is_available,
        preparation_time: item.preparation_time,
        dietary_info: item.dietary_info,
        tags: item.tags,
        image_url: item.image_url,
        category: item.category ? {
          name: item.category.name,
          description: item.category.description
        } : undefined
      }));

      setMenuItems(formattedItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    }
  }, [user?.tenant_id, toast]);

  // Load orders from Supabase
  const loadOrders = useCallback(async () => {
    if (!user?.tenant_id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('pos_orders')
        .select(`
          *,
          pos_order_items(
            *,
            menu_item:menu_items(name, price)
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        tenant_id: order.tenant_id,
        order_number: order.order_number,
        order_type: order.order_type as Order['order_type'],
        room_id: order.room_id,
        status: order.status as Order['status'],
        subtotal: Number(order.subtotal),
        tax_amount: Number(order.tax_amount || 0),
        service_charge: Number(order.service_charge || 0),
        total_amount: Number(order.total_amount || 0),
        special_instructions: order.special_instructions,
        order_time: order.order_time,
        promised_time: order.promised_time,
        completed_time: order.completed_time,
        taken_by: order.taken_by,
        prepared_by: order.prepared_by,
        served_by: order.served_by,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: (order.pos_order_items || []).map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          tenant_id: item.tenant_id,
          item_name: item.item_name,
          item_price: Number(item.item_price),
          quantity: item.quantity,
          line_total: Number(item.line_total || 0),
          special_requests: item.special_requests,
          menu_item: item.menu_item ? {
            id: item.menu_item_id,
            tenant_id: item.tenant_id,
            category_id: '',
            name: item.menu_item.name,
            price: Number(item.menu_item.price),
            is_available: true
          } : undefined
        }))
      }));

      setOrders(formattedOrders);
      calculateStats(formattedOrders);
      
      // Create kitchen tickets from orders
      const tickets: KitchenTicket[] = formattedOrders
        .filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status))
        .map(order => ({
          id: `ticket-${order.id}`,
          order_id: order.id,
          order_number: order.order_number,
          room_number: order.room_id || 'Dine-in',
          items: (order.items || []).map(item => ({
            name: item.item_name,
            quantity: item.quantity,
            special_requests: item.special_requests,
            preparation_time: item.menu_item?.preparation_time
          })),
          priority: 'medium',
          status: order.status === 'pending' ? 'new' : 
                  order.status === 'confirmed' ? 'acknowledged' :
                  'preparing',
          order_time: order.order_time || order.created_at || '',
          promised_time: order.promised_time,
          assigned_staff: order.prepared_by || 'Kitchen Staff'
        }));

      setKitchenTickets(tickets);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenant_id, toast]);

  // Calculate statistics
  const calculateStats = (ordersList: Order[]) => {
    const today = new Date().toDateString();
    const todayOrders = ordersList.filter(order => 
      new Date(order.created_at || '').toDateString() === today
    );

    const stats: POSStats = {
      ordersToday: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      averageOrderValue: todayOrders.length > 0 
        ? todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / todayOrders.length 
        : 0,
      pendingOrders: ordersList.filter(order => order.status === 'pending').length,
      preparingOrders: ordersList.filter(order => order.status === 'preparing').length,
      readyOrders: ordersList.filter(order => order.status === 'ready').length,
      completedOrders: ordersList.filter(order => order.status === 'served').length,
      cancelledOrders: ordersList.filter(order => order.status === 'cancelled').length
    };

    setStats(stats);
  };

  // Create new order
  const createOrder = async (orderData: {
    order_type: Order['order_type'];
    room_id?: string;
    items: { menu_item_id: string; quantity: number; special_requests?: string }[];
    special_instructions?: string;
  }) => {
    if (!user?.tenant_id || !user?.id) return;

    try {
      setIsLoading(true);

      // Calculate totals
      const itemsWithPrices = await Promise.all(
        orderData.items.map(async (item) => {
          const { data: menuItem } = await supabase
            .from('menu_items')
            .select('name, price')
            .eq('id', item.menu_item_id)
            .single();

          const price = Number(menuItem?.price || 0);
          return {
            ...item,
            item_name: menuItem?.name || '',
            item_price: price,
            line_total: price * item.quantity
          };
        })
      );

      const subtotal = itemsWithPrices.reduce((sum, item) => sum + item.line_total, 0);
      const serviceCharge = subtotal * 0.1; // 10% service charge
      const taxAmount = (subtotal + serviceCharge) * 0.075; // 7.5% VAT
      const totalAmount = subtotal + serviceCharge + taxAmount;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('pos_orders')
        .insert({
          tenant_id: user.tenant_id,
          order_number: `POS-${Date.now()}`,
          order_type: orderData.order_type,
          room_id: orderData.room_id,
          status: 'pending',
          subtotal,
          service_charge: serviceCharge,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          special_instructions: orderData.special_instructions,
          taken_by: user.id,
          order_time: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('pos_order_items')
        .insert(
          itemsWithPrices.map(item => ({
            order_id: order.id,
            tenant_id: user.tenant_id,
            menu_item_id: item.menu_item_id,
            item_name: item.item_name,
            item_price: item.item_price,
            quantity: item.quantity,
            line_total: item.line_total,
            special_requests: item.special_requests
          }))
        );

      if (itemsError) throw itemsError;

      // Create audit log
      await supabase
        .from('audit_log')
        .insert([{
          action: 'order_created',
          resource_type: 'pos_order',
          resource_id: order.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.role,
          tenant_id: user.tenant_id,
          description: `POS order ${order.order_number} created`,
          new_values: { order_number: order.order_number, total_amount: totalAmount }
        }]);

      // Reload orders
      await loadOrders();

      toast({
        title: "Order Created",
        description: `Order ${order.order_number} created successfully`,
      });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!user?.id) return;

    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'preparing') {
        updateData.prepared_by = user.id;
      } else if (status === 'served') {
        updateData.served_by = user.id;
        updateData.completed_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pos_orders')
        .update(updateData)
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

      // Reload orders
      await loadOrders();

      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  // Add menu item
  const addMenuItem = async (itemData: {
    category_id: string;
    name: string;
    description?: string;
    price: number;
    preparation_time?: number;
    dietary_info?: string[];
    tags?: string[];
  }) => {
    if (!user?.tenant_id || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          tenant_id: user.tenant_id,
          ...itemData,
          is_available: true
        })
        .select()
        .single();

      if (error) throw error;

      // Reload menu items
      await loadMenuItems();

      toast({
        title: "Menu Item Added",
        description: `${itemData.name} has been added to the menu`,
      });

      return data;
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update menu item
  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    if (!user?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;

      // Reload menu items
      await loadMenuItems();

      toast({
        title: "Menu Item Updated",
        description: "Menu item has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive"
      });
    }
  };

  // Kitchen ticket management
  const claimKitchenTicket = async (ticketId: string) => {
    if (!user?.id) return;

    const ticket = kitchenTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    await updateOrderStatus(ticket.order_id, 'preparing');
  };

  const completeKitchenTicket = async (ticketId: string) => {
    const ticket = kitchenTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    await updateOrderStatus(ticket.order_id, 'ready');
  };

  // Load data on mount and user change
  useEffect(() => {
    if (user?.tenant_id) {
      loadMenuItems();
      loadOrders();
    }
  }, [user?.tenant_id, loadMenuItems, loadOrders]);

  return {
    orders,
    menuItems,
    kitchenTickets,
    stats,
    isLoading,
    createOrder,
    updateOrderStatus,
    addMenuItem,
    updateMenuItem,
    claimKitchenTicket,
    completeKitchenTicket,
    refreshOrders: loadOrders,
    refreshMenuItems: loadMenuItems
  };
}