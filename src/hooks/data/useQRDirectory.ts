import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface QRCodeInfo {
  id: string;
  roomNumber: string;
  guestName?: string;
  qrStatus: 'active' | 'inactive' | 'expired';
  services: string[];
  lastScanned?: Date;
  guestPhone?: string;
  guestEmail?: string;
  checkInDate?: string;
  checkOutDate?: string;
  qrUrl: string;
  issuedBy: string;
}

/**
 * QR Directory Data Hook
 * 
 * Fetches real QR codes from the database with:
 * - Room assignments
 * - Guest information
 * - Service configurations
 * - Scan history
 */
export const useQRDirectory = () => {
  const { tenant } = useAuth();
  
  return useQuery({
    queryKey: ['qr-directory', tenant?.tenant_id],
    queryFn: async () => {
      if (!tenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          id,
          label,
          qr_token,
          is_active,
          services,
          scan_type,
          room_id,
          rooms (
            room_number,
            status,
            reservations!reservations_room_id_fkey (
              guest_name,
              guest_email,
              guest_phone,
              check_in_date,
              check_out_date,
              status
            )
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching QR codes:', error);
        throw error;
      }

      return data.map((qr): QRCodeInfo => {
        // Get the most recent active reservation for the room
        const room = qr.rooms as any;
        const activeReservation = room?.reservations?.find(
          (r: any) => r.status === 'checked_in' || r.status === 'confirmed'
        );

        return {
          id: qr.id,
          roomNumber: room?.room_number || qr.label,
          guestName: activeReservation?.guest_name,
          qrStatus: qr.is_active ? 'active' : 'inactive',
          services: qr.services || [],
          lastScanned: undefined, // Column doesn't exist in database yet
          guestPhone: activeReservation?.guest_phone,
          guestEmail: activeReservation?.guest_email,
          checkInDate: activeReservation?.check_in_date,
          checkOutDate: activeReservation?.check_out_date,
          qrUrl: `${window.location.origin}/guest/qr/${qr.qr_token}`,
          issuedBy: 'Hotel Manager'
        };
      });
    },
    enabled: !!tenant?.tenant_id,
    staleTime: 0, // Always fresh - rely on real-time updates
    refetchInterval: false, // No polling - real-time handles updates
  });
};

/**
 * Hook to toggle QR code active status
 */
export const useToggleQRStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  return useMutation({
    mutationFn: async ({ qrId, isActive, reason }: { qrId: string; isActive: boolean; reason?: string }) => {
      const { data, error } = await supabase.rpc('toggle_qr_status', {
        p_qr_id: qrId,
        p_is_active: isActive,
        p_reason: reason || 'Manual status change'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qr-directory', tenant?.tenant_id] });
      toast({
        title: variables.isActive ? "QR Code Activated" : "QR Code Deactivated",
        description: `QR code has been ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update QR status",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });
};
