import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { RoomTile } from "./RoomTile";
import { RoomActionDrawer } from "./RoomActionDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { useRooms } from "@/hooks/useRooms";
import { useAuditLog } from "@/hooks/useAuditLog";

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
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
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

  // Filter rooms based on search query and active filter
  useEffect(() => {
    let filtered = roomData;

        // Apply search filter with real guest names
        if (searchQuery.trim()) {
          filtered = filtered.filter(room => 
            room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.room_type?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            // Real guest name search from current reservations
            (room.guest && room.guest.toLowerCase().includes(searchQuery.toLowerCase())) ||
            // Legacy field support
            (room.number && room.number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (room.name && room.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (room.type && room.type.toLowerCase().includes(searchQuery.toLowerCase()))
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

    setFilteredRooms(filtered);
  }, [searchQuery, activeFilter, roomData]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
    onRoomSelect?.(room);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedRoom) return;
      
      switch (event.key.toLowerCase()) {
        case 'i':
          event.preventDefault();
          // Check-in action
          console.log('Check-in:', selectedRoom.number);
          break;
        case 'o':
          event.preventDefault();
          // Check-out action
          console.log('Check-out:', selectedRoom.number);
          break;
        case 'a':
          event.preventDefault();
          // Assign room action
          console.log('Assign room:', selectedRoom.number);
          break;
        case 'escape':
          setSelectedRoom(null);
          setIsDrawerOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedRoom]);

  // Get status counts for summary
  const statusCounts = roomData.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRoomUpdate = (updatedRoom: Room) => {
    // Log the room update action
    logEvent({
      action: 'ROOM_UPDATE',
      resource_type: 'ROOM',
      resource_id: updatedRoom.id,
      description: `Room ${updatedRoom.number} status updated`,
      metadata: {
        room_number: updatedRoom.number,
        new_status: updatedRoom.status,
        guest_name: updatedRoom.guest,
        update_source: 'front_desk'
      }
    });

    // Update local state and close drawer
    setSelectedRoom(null);
    setIsDrawerOpen(false);
    
    // The useRooms query will be invalidated by real-time updates
    // This ensures all connected terminals see the changes immediately
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-destructive">Error loading rooms</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Room Status Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-room-available/10 text-room-available border-room-available/20">
            Available: {statusCounts.available || 0}
          </Badge>
          <Badge variant="outline" className="bg-room-occupied/10 text-room-occupied border-room-occupied/20">
            Occupied: {statusCounts.occupied || 0}
          </Badge>
          <Badge variant="outline" className="bg-room-reserved/10 text-room-reserved border-room-reserved/20">
            Reserved: {statusCounts.reserved || 0}
          </Badge>
        </div>

        {/* Active Filter Display */}
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Badge variant="secondary" className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              Filtered by: {activeFilter.replace('-', ' ')}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
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
                isSelected={selectedRoom?.id === room.id}
                onClick={() => handleRoomClick(room)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}

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

      {/* Keyboard Shortcuts Help */}
      {selectedRoom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-4 bg-card border rounded-lg p-3 shadow-lg"
        >
          <p className="text-sm font-medium mb-2">Room {selectedRoom.number} Selected</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><kbd className="bg-muted px-1 rounded">I</kbd> Check-In</div>
            <div><kbd className="bg-muted px-1 rounded">O</kbd> Check-Out</div>
            <div><kbd className="bg-muted px-1 rounded">A</kbd> Assign Room</div>
            <div><kbd className="bg-muted px-1 rounded">Esc</kbd> Deselect</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};