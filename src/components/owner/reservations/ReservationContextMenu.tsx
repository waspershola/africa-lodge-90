import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Calendar,
  Edit,
  UserCheck,
  UserX,
  MapPin,
  Trash2,
  CreditCard,
  Mail,
  Phone,
  FileText
} from 'lucide-react';
import { useUpdateReservation, useDeleteReservation, useCheckInGuest, useCheckOutGuest } from '@/hooks/useApi';

interface ReservationContextMenuProps {
  children: React.ReactNode;
  reservation: any;
  onEdit?: (reservation: any) => void;
  onViewDetails?: (reservation: any) => void;
  onReassignRoom?: (reservation: any) => void;
}

export default function ReservationContextMenu({
  children,
  reservation,
  onEdit,
  onViewDetails,
  onReassignRoom
}: ReservationContextMenuProps) {
  const updateReservation = useUpdateReservation();
  const deleteReservation = useDeleteReservation();
  const checkInGuest = useCheckInGuest();
  const checkOutGuest = useCheckOutGuest();

  const handleCheckIn = () => {
    if (reservation.status === 'confirmed') {
      checkInGuest.mutate(reservation.id);
    }
  };

  const handleCheckOut = () => {
    if (reservation.status === 'checked-in') {
      checkOutGuest.mutate(reservation.id);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      updateReservation.mutate({
        id: reservation.id,
        data: { status: 'cancelled' }
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to permanently delete this reservation? This action cannot be undone.')) {
      deleteReservation.mutate(reservation.id);
    }
  };

  const handleSendEmail = () => {
    // Placeholder for email functionality
    window.open(`mailto:${reservation.email}?subject=Reservation ${reservation.id} - ${reservation.guestName}`);
  };

  const handleCall = () => {
    // Placeholder for call functionality
    window.open(`tel:${reservation.phone}`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onViewDetails?.(reservation)}>
          <FileText className="mr-2 h-4 w-4" />
          View Details
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onEdit?.(reservation)}>
          <Edit className="mr-2 h-4 w-4" />
          Modify Reservation
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {reservation.status === 'confirmed' && (
          <ContextMenuItem onClick={handleCheckIn}>
            <UserCheck className="mr-2 h-4 w-4" />
            Check In Guest
          </ContextMenuItem>
        )}
        
        {reservation.status === 'checked-in' && (
          <ContextMenuItem onClick={handleCheckOut}>
            <UserX className="mr-2 h-4 w-4" />
            Check Out Guest
          </ContextMenuItem>
        )}
        
        {(reservation.status === 'confirmed' || reservation.status === 'checked-in') && (
          <ContextMenuItem onClick={() => onReassignRoom?.(reservation)}>
            <MapPin className="mr-2 h-4 w-4" />
            Reassign Room
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleSendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCall}>
          <Phone className="mr-2 h-4 w-4" />
          Call Guest
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {['confirmed', 'pending'].includes(reservation.status) && (
          <ContextMenuItem onClick={handleCancel} className="text-orange-600">
            <Calendar className="mr-2 h-4 w-4" />
            Cancel Reservation
          </ContextMenuItem>
        )}
        
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Reservation
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}