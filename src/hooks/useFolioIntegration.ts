import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

export interface ServiceCharge {
  service_type: string;
  amount: number;
  description: string;
  room_id?: string;
}

export const useFolioIntegration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const addServiceCharge = async (
    reservationId: string,
    serviceCharge: ServiceCharge
  ) => {
    if (!user?.tenant_id) {
      toast.error('Authentication required');
      return false;
    }

    setLoading(true);
    try {
      // Get the folio for this reservation
      const { data: folios, error: folioError } = await supabase
        .from('folios')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('tenant_id', user.tenant_id)
        .eq('status', 'open')
        .limit(1);

      if (folioError) throw folioError;

      if (!folios?.length) {
        toast.error('No open folio found for this reservation');
        return false;
      }

      const folioId = folios[0].id;

      // Add charge to folio
      const { error: chargeError } = await supabase
        .from('folio_charges')
        .insert({
          tenant_id: user.tenant_id,
          folio_id: folioId,
          charge_type: 'service',
          description: serviceCharge.description,
          amount: serviceCharge.amount,
          reference_type: 'qr_service',
          posted_by: user.id
        });

      if (chargeError) throw chargeError;

      toast.success(`Service charge added: ${serviceCharge.description}`);
      return true;
    } catch (error) {
      console.error('Error adding service charge:', error);
      toast.error('Failed to add service charge');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getServiceChargeAmount = (serviceType: string): number => {
    // Default service charges - these could be configurable per tenant
    const serviceCharges: Record<string, number> = {
      room_service: 0, // Usually charged per item ordered
      housekeeping: 20, // Extra cleaning fee
      maintenance: 0, // Usually no charge for maintenance
      concierge: 15, // Concierge service fee
      wifi_support: 10, // Tech support fee
      laundry: 25, // Laundry service
      transport: 0, // Calculated based on distance/time
    };

    return serviceCharges[serviceType] || 0;
  };

  const processServiceCompletion = async (
    orderId: string,
    serviceType: string,
    roomId?: string,
    additionalAmount?: number
  ) => {
    if (!user?.tenant_id || !roomId) return false;

    try {
      // Find active reservation for this room
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('id, guest_name')
        .eq('tenant_id', user.tenant_id)
        .eq('room_id', roomId)
        .eq('status', 'checked_in')
        .limit(1);

      if (reservationError) throw reservationError;

      if (!reservations?.length) {
        // No active reservation, don't charge
        return true;
      }

      const reservation = reservations[0];
      const baseAmount = getServiceChargeAmount(serviceType);
      const totalAmount = baseAmount + (additionalAmount || 0);

      if (totalAmount <= 0) {
        // No charge for this service
        return true;
      }

      const serviceCharge: ServiceCharge = {
        service_type: serviceType,
        amount: totalAmount,
        description: `${serviceType.replace('_', ' ').toUpperCase()} service`,
        room_id: roomId
      };

      return await addServiceCharge(reservation.id, serviceCharge);
    } catch (error) {
      console.error('Error processing service completion:', error);
      return false;
    }
  };

  return {
    addServiceCharge,
    processServiceCompletion,
    getServiceChargeAmount,
    loading
  };
};