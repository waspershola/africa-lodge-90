import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { RoomTile } from "./RoomTile";
import { RoomActionDrawer } from "./RoomActionDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { useRooms } from "@/hooks/useRooms";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useRoomStatusManager } from "@/hooks/useRoomStatusManager";

export interface Room {
  id: string;
  room_number: string;
  status: 'available' | 'occupied' | 'reserved' | 'oos' | 'overstay' | 'dirty' | 'clean' | 'maintenance';
  room_type?: {
    name: string;
    base_rate: number;
  };
  current_reservation?: {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
  };
  notes?: string;
  last_cleaned?: string;
  // Legacy compatibility
  number?: string;
  name?: string;
  type?: string;
  guest?: string;
  checkIn?: string;
  checkOut?: string;
  alerts?: {
    cleaning?: boolean;
    depositPending?: boolean;
    idMissing?: boolean;
    maintenance?: boolean;
  };
  folio?: {
    balance: number;
    isPaid: boolean;
  };
}

interface RoomGridProps {
  searchQuery: string;
  activeFilter?: string;
  onRoomSelect?: (room: Room) => void;
}

export const RoomGrid = ({ searchQuery, activeFilter, onRoomSelect }: RoomGridProps) => {
  const { data: roomsData = { rooms: [], roomTypes: [] }, isLoading: loading, error } = useRooms();
  const { logEvent } = useAuditLog();
  const rooms = roomsData.rooms || [];
  const roomTypes = roomsData.roomTypes || [];
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Transform Supabase room data to component format with real reservation data
  const roomData: Room[] = useMemo(() => {
    return rooms?.map(room => {
      // Map Supabase status to frontend status
      let mappedStatus: Room['status'] = 'available';
      
      // Determine status based on room status and reservations
      if (room.current_reservation?.status === 'checked_in') {
        mappedStatus = 'occupied';
      } else if (room.current_reservation?.status === 'confirmed') {
        mappedStatus = 'reserved';
      } else {
        switch (room.status) {
          case 'available':
            mappedStatus = 'available';
            break;
          case 'occupied':
            mappedStatus = 'occupied';
            break;
          case 'dirty':
            mappedStatus = 'dirty';
            break;
          case 'maintenance':
            mappedStatus = 'maintenance';
            break;
          case 'out_of_service':
          case 'out_of_order':
            mappedStatus = 'oos';
            break;
          default:
            mappedStatus = 'available';
        }
      }

      // Check for overstay
      if (room.current_reservation?.check_out_date && 
          new Date(room.current_reservation.check_out_date) < new Date() && 
          room.current_reservation.status === 'checked_in') {
        mappedStatus = 'overstay';
      }
      
      return {
        id: room.id,
        room_number: room.room_number,
        status: mappedStatus,
        room_type: room.room_type,
        current_reservation: room.current_reservation,
        notes: room.notes,
        last_cleaned: room.last_cleaned,
        folio: room.folio,
        // Legacy compatibility fields with real data
        number: room.room_number,
        name: room.room_type?.name || 'Standard',  
        type: room.room_type?.name || 'Standard',
        guest: room.current_reservation?.guest_name || 
               (room.current_reservation?.guests ? 
                `${room.current_reservation.guests.first_name} ${room.current_reservation.guests.last_name}` : 
                undefined),
        checkIn: room.current_reservation?.check_in_date,
        checkOut: room.current_reservation?.check_out_date,
        alerts: {
          cleaning: room.status === 'dirty',
          maintenance: room.status === 'maintenance',
          depositPending: room.folio && !room.folio.isPaid && room.folio.balance > 0,
          idMissing: false, // Can be enhanced based on guest verification data
        }
      };
    }) || [];
  }, [rooms]);

  // Filter rooms based on search query and active filter with dependency optimization
  const filteredRooms = useMemo(() => {
    let filtered = roomData;

    // Apply search filter with real guest names
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.room_number.toLowerCase().includes(query) ||
        room.room_type?.name.toLowerCase().includes(query) ||
        // Real guest name search from current reservations
        (room.guest && room.guest.toLowerCase().includes(query)) ||
        // Legacy field support
        (room.number && room.number.toLowerCase().includes(query)) ||
        (room.name && room.name.toLowerCase().includes(query)) ||
        (room.type && room.type.toLowerCase().includes(query))
      );
    }

    // Apply KPI filter
    if (activeFilter) {
      switch (activeFilter) {
        case 'available':
          filtered = filtered.filter(room => room.status === 'available');
          break;
        case 'arrivals':
          filtered = filtered.filter(room => 
            room.status === 'reserved' && room.checkIn === new Date().toISOString().split('T')[0]
          );
          break;
        case 'departures':
          filtered = filtered.filter(room => 
            room.status === 'occupied' && room.checkOut === new Date().toISOString().split('T')[0]
          );
          break;
        case 'overstays':
          filtered = filtered.filter(room => room.status === 'overstay');
          break;
        case 'pending-payments':
          filtered = filtered.filter(room => 
            room.folio && !room.folio.isPaid && room.folio.balance > 0
          );
          break;
        case 'oos':
          filtered = filtered.filter(room => room.status === 'oos');
          break;
        case 'in-house':
          filtered = filtered.filter(room => room.status === 'occupied');
          break;
      }
    }

    return filtered;
  }, [roomData, searchQuery, activeFilter]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
    onRoomSelect?.(room);
  };


  const handleRoomUpdate = (updatedRoom: Room) => {
    // No need to manually update state as useRooms hook will refetch
    // This ensures we always have the latest data from the database
    console.log('Room updated:', updatedRoom);
  };

  if (loading) {
    return (
      <div className="grid gap-4 p-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 p-4">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load rooms: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!filteredRooms || filteredRooms.length === 0) {
    return (
      <div className="grid gap-4 p-4">
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No rooms found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 
              `No rooms match "${searchQuery}"` : 
              activeFilter ? 
                `No rooms match the "${activeFilter}" filter` :
                'No rooms available'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {activeFilter && (
        <div className="flex items-center gap-2 px-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="capitalize">
            {activeFilter.replace('-', ' ')} ({filteredRooms.length})
          </Badge>
        </div>
      )}

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        <AnimatePresence>
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <RoomTile
                room={room}
                onClick={() => handleRoomClick(room)}
                isSelected={selectedRoom?.id === room.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Room Action Drawer */}
      <RoomActionDrawer
        room={selectedRoom}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRoom(null);
        }}
        onRoomUpdate={handleRoomUpdate}
      />
    </div>
  );
};