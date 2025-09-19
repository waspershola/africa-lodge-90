import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface MenuItem {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  base_price: number;
  prep_time_mins: number;
  available: boolean;
  stations: string[];
  inventory_tracked: boolean;
  category: string;
  image_url?: string;
}

export interface OrderModifier {
  id: string;
  name: string;
  price_delta: number;
}

export interface OrderItem {
  menu_item_id: string;
  menu_item: MenuItem;
  qty: number;
  modifiers: OrderModifier[];
  notes?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  order_type: 'room_service' | 'dine_in' | 'takeaway';
  room_id?: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  subtotal: number;  
  tax_amount?: number;
  service_charge?: number;
  total_amount?: number;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  completed_time?: string;
  folio_id?: string;
  served_by?: string;
  prepared_by?: string;
  taken_by?: string;
  // Legacy compatibility properties
  source?: 'qr' | 'walkin' | 'phone';
  guest_name?: string;
  items?: OrderItem[];
  payment_status?: 'unpaid' | 'charged' | 'paid';
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

// Mock data for development
const mockMenuItems: MenuItem[] = [
  {
    id: 'menu-001',
    tenant_id: 'hotel-1',
    name: 'Grilled Chicken Breast',
    description: 'Tender grilled chicken with herbs and spices',
    base_price: 2500,
    prep_time_mins: 15,
    available: true,
    stations: ['grill', 'plating'],
    inventory_tracked: true,
    category: 'Main Course'
  },
  {
    id: 'menu-002',
    tenant_id: 'hotel-1',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with caesar dressing',
    base_price: 1200,
    prep_time_mins: 5,
    available: true,
    stations: ['cold'],
    inventory_tracked: false,
    category: 'Salads'
  },
  {
    id: 'menu-003',
    tenant_id: 'hotel-1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato, mozzarella, and basil',
    base_price: 1800,
    prep_time_mins: 12,
    available: true,
    stations: ['pizza', 'oven'],
    inventory_tracked: true,
    category: 'Pizza'
  }
];

const mockOrders: Order[] = [
  {
    id: 'ord-001',
    tenant_id: 'hotel-1',
    order_number: 'ORD-2024-001',
    order_type: 'room_service',
    room_id: '205',
    status: 'pending',
    subtotal: 3900,
    total_amount: 3900,
    created_at: '2024-01-19T14:30:00Z',
    updated_at: '2024-01-19T14:30:00Z',
    special_instructions: 'Please deliver to room 205'
  },
  {
    id: 'ord-002',
    tenant_id: 'hotel-1',
    order_number: 'ORD-2024-002',
    order_type: 'dine_in',
    status: 'preparing',
    subtotal: 3600,
    total_amount: 3600,
    created_at: '2024-01-19T13:45:00Z',
    updated_at: '2024-01-19T14:00:00Z',
    prepared_by: 'Chef Mike'
  }
];

export function usePOSApi() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>([]);
  const [stats, setStats] = useState<POSStats>({
    ordersToday: 15,
    revenue: 45000,
    averageOrderValue: 3000,
    pendingOrders: 3,
    preparingOrders: 5,
    readyOrders: 2,
    completedOrders: 12,
    cancelledOrders: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

    // Initialize kitchen tickets from orders (simplified)
    setKitchenTickets([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new orders occasionally
      if (Math.random() > 0.95) {
        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          tenant_id: 'hotel-1',
          order_number: `ORD-2024-${String(orders.length + 1).padStart(3, '0')}`,
          order_type: Math.random() > 0.5 ? 'room_service' : 'dine_in',
          room_id: Math.random() > 0.5 ? String(Math.floor(Math.random() * 500) + 100) : undefined,
          status: 'pending',
          subtotal: mockMenuItems[0].base_price,
          total_amount: mockMenuItems[0].base_price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setOrders(prev => [newOrder, ...prev]);
        setStats(prev => ({
          ...prev,
          pendingOrders: prev.pendingOrders + 1,
          ordersToday: prev.ordersToday + 1
        }));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [orders.length]);

  const acceptOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'accepted', prepared_by: 'Current Staff', updated_at: new Date().toISOString() }
          : order
      ));
      
      setStats(prev => ({
        ...prev,
        pendingOrders: prev.pendingOrders - 1,
        preparingOrders: prev.preparingOrders + 1
      }));
      
      toast({
        title: "Order Accepted",
        description: "Order has been accepted and sent to kitchen.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      ));
      
      // Update stats based on status change
      setStats(prev => {
        const updates = { ...prev };
        switch (status) {
          case 'preparing':
            updates.preparingOrders = prev.preparingOrders + 1;
            break;
          case 'ready':
            updates.preparingOrders = Math.max(0, prev.preparingOrders - 1);
            updates.readyOrders = prev.readyOrders + 1;
            break;
          case 'delivered':
            updates.readyOrders = Math.max(0, prev.readyOrders - 1);
            updates.completedOrders = prev.completedOrders + 1;
            updates.revenue = prev.revenue; // Would add order total in real app
            break;
          case 'cancelled':
            updates.cancelledOrders = prev.cancelledOrders + 1;
            break;
        }
        return updates;
      });
      
      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (orderId: string, method: 'room_folio' | 'card' | 'cash', amount: number) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, updated_at: new Date().toISOString() }
          : order
      ));
      
      toast({
        title: "Payment Processed",
        description: `Payment of ₦${(amount / 100).toFixed(2)} processed successfully via ${method}.`,
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setMenuItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, ...updates }
          : item
      ));
      
      toast({
        title: "Menu Updated",
        description: "Menu item has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const claimKitchenTicket = async (ticketId: string, chefId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setKitchenTickets(prev => prev.map(ticket => 
        ticket.ticket_id === ticketId 
          ? { ...ticket, status: 'preparing', assigned_chef: chefId, start_time: new Date().toISOString() }
          : ticket
      ));
      
      toast({
        title: "Ticket Claimed",
        description: "Kitchen ticket has been claimed and prep started.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeKitchenTicket = async (ticketId: string, notes?: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setKitchenTickets(prev => prev.map(ticket => 
        ticket.ticket_id === ticketId 
          ? { ...ticket, status: 'ready' }
          : ticket
      ));
      
      // Check if all tickets for an order are ready
      const ticket = kitchenTickets.find(t => t.ticket_id === ticketId);
      if (ticket) {
        const allOrderTickets = kitchenTickets.filter(t => t.order_id === ticket.order_id);
        const allReady = allOrderTickets.every(t => t.ticket_id === ticketId || t.status === 'ready');
        
        if (allReady) {
          await updateOrderStatus(ticket.order_id, 'ready');
        }
      }
      
      toast({
        title: "Item Ready",
        description: "Kitchen item marked as ready for service.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    orders,
    menuItems,
    kitchenTickets,
    stats,
    isLoading,
    acceptOrder,
    updateOrderStatus,
    processPayment,
    updateMenuItem,
    claimKitchenTicket,
    completeKitchenTicket
  };
}