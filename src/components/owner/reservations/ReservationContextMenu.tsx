import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Edit, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { 
  useAssignRoom, 
  useDeleteReservation, 
  useCheckInGuest, 
  useCheckOutGuest,
  useCheckRoomConflicts
} from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { validateAndRefreshToken } from '@/lib/auth-token-validator';

interface ReservationContextMenuProps {
  reservation: any;
  onEdit?: () => void;
  onViewDetails?: () => void;
  onReassignRoom?: () => void;
  children: React.ReactNode;
}

export default function ReservationContextMenu({
  reservation,
  onEdit,
  onViewDetails,
  onReassignRoom,
  children
}: ReservationContextMenuProps) {
  const { toast } = useToast();
  const checkInGuest = useCheckInGuest();
  const checkOutGuest = useCheckOutGuest();
  const deleteReservation = useDeleteReservation();
  const checkConflicts = useCheckRoomConflicts();

  const handleCheckIn = async () => {
    if (reservation.status !== 'confirmed') {
      toast({
        title: 'Cannot Check In',
        description: 'Only confirmed reservations can be checked in.',
        variant: 'destructive'
      });
      return;
    }

    // Check for room conflicts first
    try {
      const conflictResult = await checkConflicts.mutateAsync({
        roomId: reservation.room,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        reservationId: reservation.id
      });

      if (conflictResult.hasConflicts) {
        toast({
          title: 'Room Conflict Detected',
          description: `Room ${reservation.room} has conflicts. Please resolve before check-in.`,
          variant: 'destructive'
        });
        return;
      }

      checkInGuest.mutate(reservation.id);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      // Proceed with check-in if conflict check fails
      checkInGuest.mutate(reservation.id);
    }
  };

  const handleCheckOut = () => {
    if (reservation.status !== 'checked-in') {
      toast({
        title: 'Cannot Check Out',
        description: 'Only checked-in guests can be checked out.',
        variant: 'destructive'
      });
      return;
    }

    checkOutGuest.mutate(reservation.id);
  };

  const handleCancel = () => {
    if (reservation.status === 'checked-out') {
      toast({
        title: 'Cannot Cancel',
        description: 'Cannot cancel a completed reservation.',
        variant: 'destructive'
      });
      return;
    }

    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      deleteReservation.mutate(reservation.id);
    }
  };

  const handleSendConfirmation = async () => {
    try {
      // Phase 6: Validate token before edge function call
      await validateAndRefreshToken();
      
      // Real email sending using Supabase edge function
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('send-reservation-confirmation', {
        body: {
          reservationId: reservation.id,
          guestEmail: reservation.email,
          guestName: reservation.guestName || reservation.guest_name,
          roomNumber: reservation.room || reservation.room_number,
          checkInDate: reservation.checkIn || reservation.check_in_date,
          checkOutDate: reservation.checkOut || reservation.check_out_date
        }
      });

      if (error) throw error;

      toast({
        title: 'Confirmation Sent',
        description: `Confirmation email sent to ${reservation.email}`,
      });
    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send confirmation email. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-blue-600';
      case 'checked-in': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'checked-out': return 'text-gray-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* View Details */}
        <ContextMenuItem onClick={onViewDetails} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          View Details
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Status Actions */}
        {reservation.status === 'confirmed' && (
          <ContextMenuItem onClick={handleCheckIn} className="cursor-pointer text-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Check In Guest
          </ContextMenuItem>
        )}

        {reservation.status === 'checked-in' && (
          <ContextMenuItem onClick={handleCheckOut} className="cursor-pointer text-blue-700">
            <LogOut className="mr-2 h-4 w-4" />
            Check Out Guest
          </ContextMenuItem>
        )}

        {/* Edit Actions */}
        <ContextMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Reservation
        </ContextMenuItem>

        <ContextMenuItem onClick={onReassignRoom} className="cursor-pointer">
          <MapPin className="mr-2 h-4 w-4" />
          Reassign Room
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Communication */}
        <ContextMenuItem onClick={handleSendConfirmation} className="cursor-pointer">
          <Mail className="mr-2 h-4 w-4" />
          Send Confirmation
        </ContextMenuItem>

        <ContextMenuItem 
          onClick={() => window.open(`tel:${reservation.phone}`)}
          className="cursor-pointer"
        >
          <Phone className="mr-2 h-4 w-4" />
          Call Guest
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Status Info */}
        <ContextMenuItem disabled className="opacity-70">
          <div className="flex items-center justify-between w-full">
            <span>Status:</span>
            <span className={`capitalize font-medium ${getStatusColor(reservation.status)}`}>
              {reservation.status.replace('-', ' ')}
            </span>
          </div>
        </ContextMenuItem>

        <ContextMenuItem disabled className="opacity-70">
          <div className="flex items-center justify-between w-full">
            <span>Balance:</span>
            <span className={reservation.balanceDue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
              ₦{(reservation.balanceDue || 0).toLocaleString()}
            </span>
          </div>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Danger Zone */}
        {reservation.status !== 'checked-out' && reservation.status !== 'cancelled' && (
          <ContextMenuItem 
            onClick={handleCancel} 
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Cancel Reservation
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}