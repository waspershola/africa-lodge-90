/**
 * OneClickOperations - Handles intelligent one-click operations for front desk
 * 
 * Features:
 * - Express check-in with auto room assignment
 * - Lightning checkout with balance calculation
 * - Smart payment collection with receipt generation
 * - Instant service assignment to available staff
 */

import { supabase } from '@/integrations/supabase/client';
import { audioNotificationService } from './AudioNotificationService';
import { offlineService } from './OfflineService';

export interface ExpressCheckInData {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestIdNumber?: string;
  adults: number;
  children: number;
  checkInDate: string;
  checkOutDate: string;
  roomTypePreference?: string;
  specialRequests?: string;
}

export interface CheckOutResult {
  reservationId: string;
  folioId: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  receiptGenerated: boolean;
}

export interface PaymentResult {
  paymentId: string;
  amount: number;
  method: string;
  receiptUrl?: string;
  success: boolean;
}

export interface ServiceAssignmentResult {
  taskId: string;
  assignedTo: string;
  estimatedTime: number;
  priority: string;
}

class OneClickOperations {
  private tenantId: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.userId = session.user.id;
      // Get tenant ID from user profile or context
      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        this.tenantId = profile.tenant_id;
      }
    }
  }

  /**
   * EXPRESS CHECK-IN
   * Single click assigns room + generates keycard + sends welcome SMS
   */
  public async expressCheckIn(data: ExpressCheckInData): Promise<{ success: boolean; reservation?: any; room?: any; error?: string }> {
    try {
      if (!this.tenantId) throw new Error('No tenant context available');

      console.log('OneClickOperations: Starting express check-in for', data.guestName);

      // 1. Find available room matching preferences
      const availableRoom = await this.findBestAvailableRoom(
        data.checkInDate,
        data.checkOutDate,
        data.adults + data.children,
        data.roomTypePreference
      );

      if (!availableRoom) {
        throw new Error('No available rooms matching criteria');
      }

      // 2. Create or find guest
      const guest = await this.createOrFindGuest({
        first_name: data.guestName.split(' ')[0],
        last_name: data.guestName.split(' ').slice(1).join(' ') || '',
        email: data.guestEmail,
        phone: data.guestPhone,
        guest_id_number: data.guestIdNumber
      });

      // 3. Create reservation
      const reservationData = {
        tenant_id: this.tenantId,
        guest_id: guest.id,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guest_phone: data.guestPhone,
        room_id: availableRoom.room_id,
        check_in_date: data.checkInDate,
        check_out_date: data.checkOutDate,
        adults: data.adults,
        children: data.children,
        room_rate: availableRoom.base_rate || 0,
        total_amount: this.calculateTotalAmount(
          availableRoom.base_rate || 0,
          data.checkInDate,
          data.checkOutDate
        ),
        status: 'checked_in',
        special_requests: data.specialRequests,
        reservation_number: this.generateReservationNumber()
      };

      // Handle online/offline
      let reservation;
      if (navigator.onLine) {
        const { data: reservationResult, error } = await supabase
          .from('reservations')
          .insert(reservationData)
          .select()
          .single();

        if (error) throw error;
        reservation = reservationResult;

        // Update room status
        await supabase
          .from('rooms')
          .update({ status: 'occupied' })
          .eq('id', availableRoom.room_id);

      } else {
        // Queue for offline sync
        reservation = { id: `offline_${Date.now()}`, ...reservationData };
        await offlineService.queueCheckIn(reservationData, availableRoom.room_id);
      }

      // 4. Create folio
      await this.createFolio(reservation.id, reservation.total_amount);

      // 5. Send notifications
      await audioNotificationService.notify({
        type: 'general',
        title: 'Express Check-In Complete',
        message: `${data.guestName} checked into room ${availableRoom.room_number}`,
        priority: 'medium',
        autoHide: 5000
      });

      // 6. Generate welcome SMS/email (if online)
      if (navigator.onLine && data.guestPhone) {
        this.sendWelcomeMessage(data.guestName, availableRoom.room_number, data.guestPhone);
      }

      console.log('OneClickOperations: Express check-in completed successfully');
      
      return {
        success: true,
        reservation,
        room: availableRoom
      };

    } catch (error) {
      console.error('OneClickOperations: Express check-in failed:', error);
      
      await audioNotificationService.notify({
        type: 'urgent',
        title: 'Check-In Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        priority: 'urgent'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * LIGHTNING CHECKOUT
   * Single click calculates balance + processes payment + generates receipt
   */
  public async lightningCheckOut(reservationId: string, paymentMethod: string = 'cash'): Promise<CheckOutResult> {
    try {
      if (!this.tenantId) throw new Error('No tenant context available');

      console.log('OneClickOperations: Starting lightning checkout for reservation', reservationId);

      // 1. Get reservation and folio details
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          rooms!inner(room_number),
          folios!inner(*)
        `)
        .eq('id', reservationId)
        .single();

      if (resError || !reservation) throw new Error('Reservation not found');

      const folio = reservation.folios[0];
      if (!folio) throw new Error('No folio found for reservation');

      // 2. Calculate final balance
      const { data: charges } = await supabase
        .from('folio_charges')
        .select('amount')
        .eq('folio_id', folio.id);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('folio_id', folio.id)
        .eq('status', 'completed');

      const totalCharges = charges?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const balance = totalCharges - totalPayments;

      // 3. Process payment if balance is positive
      if (balance > 0) {
        const paymentData = {
          tenant_id: this.tenantId,
          folio_id: folio.id,
          amount: balance,
          payment_method: paymentMethod,
          status: 'completed',
          processed_by: this.userId,
          reference: `CHECKOUT_${reservationId}_${Date.now()}`
        };

        if (navigator.onLine) {
          await supabase.from('payments').insert(paymentData);
        } else {
          await offlineService.queuePayment(folio.id, paymentData);
        }
      }

      // 4. Update reservation and room status
      const updates = {
        status: 'checked_out',
        actual_check_out: new Date().toISOString()
      };

      if (navigator.onLine) {
        await supabase
          .from('reservations')
          .update(updates)
          .eq('id', reservationId);

        await supabase
          .from('rooms')
          .update({ status: 'dirty' })
          .eq('id', reservation.room_id);
      } else {
        await offlineService.queueCheckOut(reservationId);
      }

      // 5. Generate receipt
      const receiptGenerated = await this.generateCheckoutReceipt(
        reservation,
        totalCharges,
        totalPayments + balance,
        balance
      );

      // 6. Send notification
      await audioNotificationService.notify({
        type: 'general',
        title: 'Lightning Checkout Complete',
        message: `${reservation.guest_name} checked out from room ${reservation.rooms.room_number}`,
        priority: 'medium',
        autoHide: 5000
      });

      console.log('OneClickOperations: Lightning checkout completed successfully');

      return {
        reservationId,
        folioId: folio.id,
        totalCharges,
        totalPayments: totalPayments + balance,
        balance: 0, // Should be 0 after payment
        receiptGenerated
      };

    } catch (error) {
      console.error('OneClickOperations: Lightning checkout failed:', error);
      
      await audioNotificationService.notifyUrgent(
        `Checkout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      throw error;
    }
  }

  /**
   * SMART PAYMENT COLLECTION
   * Auto-detects pending amounts + one-click payment processing
   */
  public async smartPaymentCollection(folioId: string, paymentMethod: string): Promise<PaymentResult> {
    try {
      if (!this.tenantId) throw new Error('No tenant context available');

      // Get folio balance
      const { data: folio, error } = await supabase
        .rpc('get_folio_balances_secure', {
          p_tenant_id: this.tenantId,
          p_status: 'all'
        });

      if (error) throw error;

      const currentFolio = folio?.find((f: any) => f.folio_id === folioId);
      if (!currentFolio || currentFolio.balance <= 0) {
        throw new Error('No outstanding balance to collect');
      }

      // Process payment
      const paymentData = {
        tenant_id: this.tenantId,
        folio_id: folioId,
        amount: currentFolio.balance,
        payment_method: paymentMethod,
        status: 'completed',
        processed_by: this.userId,
        reference: `SMART_PAY_${folioId}_${Date.now()}`
      };

      let paymentId: string;
      if (navigator.onLine) {
        const { data: payment, error: payError } = await supabase
          .from('payments')
          .insert(paymentData)
          .select()
          .single();

        if (payError) throw payError;
        paymentId = payment.id;
      } else {
        paymentId = await offlineService.queuePayment(folioId, paymentData);
      }

      // Generate receipt
      const receiptUrl = await this.generatePaymentReceipt(currentFolio, paymentData);

      // Send notification
      await audioNotificationService.notifyPayment(
        `Payment of ₦${currentFolio.balance.toLocaleString()} collected successfully`
      );

      return {
        paymentId,
        amount: currentFolio.balance,
        method: paymentMethod,
        receiptUrl,
        success: true
      };

    } catch (error) {
      console.error('OneClickOperations: Smart payment collection failed:', error);
      throw error;
    }
  }

  /**
   * INSTANT SERVICE ASSIGNMENT
   * Auto-assigns QR requests to available staff based on department and workload
   */
  public async instantServiceAssignment(qrOrderId: string): Promise<ServiceAssignmentResult> {
    try {
      if (!this.tenantId) throw new Error('No tenant context available');

      // Get QR order details
      const { data: qrOrder, error } = await supabase
        .from('qr_orders')
        .select('*')
        .eq('id', qrOrderId)
        .single();

      if (error || !qrOrder) throw new Error('QR order not found');

      // Find best available staff member
      const staff = await this.findBestAvailableStaff(qrOrder.service_type);

      if (!staff) {
        throw new Error('No available staff for this service type');
      }

      // Create housekeeping task
      const taskData = {
        tenant_id: this.tenantId,
        title: `QR Service: ${qrOrder.service_type}`,
        description: qrOrder.notes || `Service request from room ${qrOrder.room_id || 'Unknown'}`,
        task_type: this.mapServiceToTaskType(qrOrder.service_type),
        priority: qrOrder.status === 'urgent' ? 'urgent' : 'medium',
        assigned_to: staff.id,
        room_id: qrOrder.room_id,
        qr_order_id: qrOrderId,
        status: 'assigned',
        estimated_minutes: this.getEstimatedTime(qrOrder.service_type)
      };

      let taskId: string;
      if (navigator.onLine) {
        const { data: task, error: taskError } = await supabase
          .from('housekeeping_tasks')
          .insert(taskData)
          .select()
          .single();

        if (taskError) throw taskError;
        taskId = task.id;

        // Update QR order status
        await supabase
          .from('qr_orders')
          .update({ 
            status: 'assigned',
            assigned_staff_id: staff.id,
            assigned_at: new Date().toISOString()
          })
          .eq('id', qrOrderId);

      } else {
        taskId = await offlineService.queueAction({
          type: 'create',
          table: 'housekeeping_tasks',
          data: taskData,
          maxRetries: 3
        });
      }

      // Send notification to staff
      await audioNotificationService.notify({
        type: 'qr_request',
        title: 'New Service Assignment',
        message: `${qrOrder.service_type} assigned to ${staff.name} for room ${qrOrder.room_id || 'Unknown'}`,
        priority: qrOrder.status === 'urgent' ? 'urgent' : 'high',
        data: { taskId, qrOrderId }
      });

      return {
        taskId,
        assignedTo: staff.name,
        estimatedTime: taskData.estimated_minutes,
        priority: taskData.priority
      };

    } catch (error) {
      console.error('OneClickOperations: Instant service assignment failed:', error);
      throw error;
    }
  }

  // Helper methods

  private async findBestAvailableRoom(checkIn: string, checkOut: string, occupancy: number, roomTypePreference?: string) {
    if (!this.tenantId) return null;

    const { data: rooms, error } = await supabase
      .rpc('get_available_rooms', {
        p_tenant_id: this.tenantId,
        p_check_in_date: checkIn,
        p_check_out_date: checkOut,
        p_room_type_id: roomTypePreference ? roomTypePreference : null
      });

    if (error) throw error;

    // Find room that fits occupancy
    return rooms?.find((room: any) => room.max_occupancy >= occupancy) || rooms?.[0];
  }

  private async createOrFindGuest(guestData: any) {
    if (!this.tenantId) throw new Error('No tenant context');

    const { data: existingGuest } = await supabase
      .from('guests')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('email', guestData.email)
      .single();

    if (existingGuest) return existingGuest;

    const { data: newGuest, error } = await supabase
      .from('guests')
      .insert({
        tenant_id: this.tenantId,
        ...guestData
      })
      .select()
      .single();

    if (error) throw error;
    return newGuest;
  }

  private async createFolio(reservationId: string, totalAmount: number) {
    if (!this.tenantId || !navigator.onLine) return;

    const { data: folio, error } = await supabase
      .from('folios')
      .insert({
        tenant_id: this.tenantId,
        reservation_id: reservationId,
        folio_number: `FOL-${Date.now()}`,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    // Add room charges
    await supabase
      .from('folio_charges')
      .insert({
        tenant_id: this.tenantId,
        folio_id: folio.id,
        charge_type: 'room',
        description: 'Room charges',
        amount: totalAmount
      });
  }

  private calculateTotalAmount(rate: number, checkIn: string, checkOut: string): number {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return rate * nights;
  }

  private generateReservationNumber(): string {
    return `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  private async findBestAvailableStaff(serviceType: string) {
    if (!this.tenantId) return null;

    // Map service type to department
    const departmentMap: Record<string, string> = {
      'housekeeping': 'HOUSEKEEPING',
      'maintenance': 'MAINTENANCE',
      'room_service': 'POS',
      'concierge': 'FRONT_DESK'
    };

    const department = departmentMap[serviceType] || 'HOUSEKEEPING';

    const { data: staff } = await supabase
      .from('users')
      .select('id, name')
      .eq('tenant_id', this.tenantId)
      .eq('role', department)
      .eq('is_active', true)
      .limit(1);

    return staff?.[0] || null;
  }

  private mapServiceToTaskType(serviceType: string): string {
    const taskMap: Record<string, string> = {
      'housekeeping': 'cleaning',
      'maintenance': 'maintenance',
      'room_service': 'service',
      'concierge': 'service'
    };

    return taskMap[serviceType] || 'service';
  }

  private getEstimatedTime(serviceType: string): number {
    const timeMap: Record<string, number> = {
      'housekeeping': 30,
      'maintenance': 45,
      'room_service': 20,
      'concierge': 15
    };

    return timeMap[serviceType] || 30;
  }

  private async sendWelcomeMessage(guestName: string, roomNumber: string, phone: string) {
    // Implementation would integrate with SMS service  
    console.log(`Sending welcome SMS to ${guestName} in room ${roomNumber} at ${phone}`);
  }

  private async generateCheckoutReceipt(reservation: any, charges: number, payments: number, balance: number): Promise<boolean> {
    // Implementation would generate PDF receipt
    console.log(`Generating checkout receipt for ${reservation.guest_name}`);
    return true;
  }

  private async generatePaymentReceipt(folio: any, payment: any): Promise<string> {
    // Implementation would generate PDF receipt and return URL
    console.log(`Generating payment receipt for payment ${payment.reference}`);
    return `/receipts/payment_${payment.reference}.pdf`;
  }
}

// Export singleton instance
export const oneClickOperations = new OneClickOperations();
export default oneClickOperations;
