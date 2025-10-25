// @ts-nocheck
// Real Supabase API calls replacing mockAdapter
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Type definitions
export type Tables = Database['public']['Tables'];
export type Tenant = Tables['tenants']['Row'];
export type User = Tables['users']['Row'];
export type Reservation = Tables['reservations']['Row'];
export type Room = Tables['rooms']['Row'];
export type RoomType = Tables['room_types']['Row'];
export type QRCode = Tables['qr_codes']['Row'];
export type QROrder = Tables['qr_requests']['Row'];
export type HousekeepingTask = Tables['housekeeping_tasks']['Row'];
export type WorkOrder = Tables['work_orders']['Row'];
export type Supply = Tables['supplies']['Row'];
export type MenuCategory = Tables['menu_categories']['Row'];
export type MenuItem = Tables['menu_items']['Row'];
export type POSOrder = Tables['pos_orders']['Row'];
export type POSOrderItem = Tables['pos_order_items']['Row'];
export type Plan = Tables['plans']['Row'];

// Authentication API
export const authApi = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: metadata
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }
};

// Tenant API
export const tenantApi = {
  async getTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getTenant(id: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('tenant_id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createTenant(tenant: Omit<Tenant, 'tenant_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('tenants')
      .insert([tenant])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTenant(id: string, updates: Partial<Tenant>) {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('tenant_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// User API
export const userApi = {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Reservation API
export const reservationApi = {
  async getReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        rooms!reservations_room_id_fkey (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getReservation(id: string) {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        rooms!reservations_room_id_fkey (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createReservation(reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateReservation(id: string, updates: Partial<Reservation>) {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteReservation(id: string) {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Room API
export const roomApi = {
  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_types:room_type_id (*)
      `)
      .order('room_number');
    
    if (error) throw error;
    return data;
  },

  async updateRoomStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Room Type API  
export const roomTypeApi = {
  async getRoomTypes() {
    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createRoomType(roomType: Omit<RoomType, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('room_types')
      .insert([roomType])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRoomType(id: string, updates: Partial<RoomType>) {
    const { data, error } = await supabase
      .from('room_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRoomType(id: string) {
    const { error } = await supabase
      .from('room_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// QR Code API
export const qrApi = {
  async getQRCodes() {
    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        rooms:room_id (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getQROrders() {
    const { data, error } = await supabase
      .from('qr_requests')
      .select(`
        *,
        qr_codes:qr_code_id (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Housekeeping API
export const housekeepingApi = {
  async getTasks() {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select(`
        *,
        rooms:room_id (*),
        assigned_user:assigned_to (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTask(task: Omit<HousekeepingTask, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .insert([task])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: Partial<HousekeepingTask>) {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Maintenance API
export const maintenanceApi = {
  async getWorkOrders() {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        rooms:room_id (*),
        assigned_user:assigned_to (name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('work_orders')
      .insert([workOrder])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>) {
    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// POS API
export const posApi = {
  async getMenuCategories() {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) throw error;
    return data;
  },

  async getMenuItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:category_id (*)
      `)
      .eq('is_available', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getOrders() {
    const { data, error } = await supabase
      .from('pos_orders')
      .select(`
        *,
        items:pos_order_items (*),
        room:room_id (room_number)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createOrder(order: Omit<POSOrder, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pos_orders')
      .insert([order])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateOrder(id: string, updates: Partial<POSOrder>) {
    const { data, error } = await supabase
      .from('pos_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Plans API
export const planApi = {
  async getPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_monthly');
    
    if (error) throw error;
    return data;
  }
};

// Export all APIs
export const supabaseApi = {
  auth: authApi,
  tenants: tenantApi,
  users: userApi,
  reservations: reservationApi,
  rooms: roomApi,
  roomTypes: roomTypeApi,
  qr: qrApi,
  housekeeping: housekeepingApi,
  maintenance: maintenanceApi,
  pos: posApi,
  plans: planApi
};
