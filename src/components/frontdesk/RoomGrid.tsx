import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, QrCode, CreditCard } from "lucide-react";
import { RoomTileEnhanced } from "./RoomTileEnhanced";
import { RoomActionDrawer } from "./RoomActionDrawer";
import { motion, AnimatePresence } from "framer-motion";

export interface Room {
  id: string;
  number: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved' | 'oos' | 'overstay';
  type: string;
  guest?: {
    name: string;
    phone?: string;
    idNumber?: string;
    bookingSource?: string;
    checkIn?: string;
    checkOut?: string;
    stayDuration?: number; // days
  };
  checkIn?: string;
  checkOut?: string;
  alerts: {
    cleaning?: boolean;
    depositPending?: boolean;
    idMissing?: boolean;
    maintenance?: boolean;
  };
  folio?: {
    balance: number;
    isPaid: boolean;
    qrCharges?: number; // QR-generated service charges
    status: 'up-to-date' | 'pending' | 'overdue' | 'pay-later';
  };
  qrCode?: {
    id: string;
    status: 'active' | 'inactive' | 'disabled';
    servicesEnabled: string[];
    pendingRequests: number;
    lastScanned?: Date;
  };
}

interface RoomGridProps {
  searchQuery: string;
  activeFilter?: string;
  onRoomSelect?: (room: Room) => void;
}

// Mock room data - Enhanced with QR integration and detailed guest info
let mockRooms: Room[] = [
  { 
    id: '101', 
    number: '101', 
    name: 'Standard', 
    status: 'available', 
    type: 'Standard', 
    alerts: {},
    qrCode: { id: 'QR_101', status: 'inactive', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '102', 
    number: '102', 
    name: 'Standard', 
    status: 'occupied', 
    type: 'Standard', 
    guest: {
      name: 'John Doe',
      phone: '+234 801 234 5678',
      idNumber: 'A12345678',
      bookingSource: 'Booking.com',
      checkIn: '2024-01-15',
      checkOut: '2024-01-18',
      stayDuration: 3
    },
    alerts: { cleaning: true },
    folio: { balance: 15000, isPaid: false, qrCharges: 5000, status: 'pending' },
    qrCode: { 
      id: 'QR_102', 
      status: 'active', 
      servicesEnabled: ['Wi-Fi', 'Room Service', 'Housekeeping'],
      pendingRequests: 2,
      lastScanned: new Date(Date.now() - 30 * 60 * 1000)
    }
  },
  { 
    id: '103', 
    number: '103', 
    name: 'Standard', 
    status: 'reserved', 
    type: 'Standard', 
    guest: {
      name: 'Jane Smith',
      phone: '+234 802 345 6789',
      bookingSource: 'Direct',
      checkIn: '2024-01-22'
    },
    alerts: { depositPending: true },
    qrCode: { id: 'QR_103', status: 'inactive', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '201', 
    number: '201', 
    name: 'Deluxe', 
    status: 'occupied', 
    type: 'Deluxe', 
    guest: {
      name: 'Mike Wilson',
      phone: '+234 803 456 7890',
      bookingSource: 'Expedia',
      checkIn: '2024-01-14',
      checkOut: '2024-01-20',
      stayDuration: 6
    },
    alerts: { idMissing: true }, 
    folio: { balance: 25000, isPaid: false, qrCharges: 8000, status: 'overdue' },
    qrCode: { 
      id: 'QR_201', 
      status: 'active', 
      servicesEnabled: ['Wi-Fi', 'Room Service', 'Digital Menu', 'Maintenance'],
      pendingRequests: 1,
      lastScanned: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  },
  { 
    id: '202', 
    number: '202', 
    name: 'Deluxe', 
    status: 'available', 
    type: 'Deluxe', 
    alerts: {},
    qrCode: { id: 'QR_202', status: 'inactive', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '203', 
    number: '203', 
    name: 'Deluxe', 
    status: 'oos', 
    type: 'Deluxe', 
    alerts: { maintenance: true },
    qrCode: { id: 'QR_203', status: 'disabled', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '301', 
    number: '301', 
    name: 'Suite', 
    status: 'overstay', 
    type: 'Executive Suite', 
    guest: {
      name: 'Sarah Johnson',
      phone: '+234 804 567 8901',
      bookingSource: 'Hotels.com',
      checkIn: '2024-01-10',
      checkOut: '2024-01-20',
      stayDuration: 10
    },
    alerts: { depositPending: true },
    folio: { balance: 45000, isPaid: false, qrCharges: 12000, status: 'pay-later' },
    qrCode: { 
      id: 'QR_301', 
      status: 'active', 
      servicesEnabled: ['Wi-Fi', 'Room Service', 'Housekeeping', 'Digital Menu', 'Events'],
      pendingRequests: 3,
      lastScanned: new Date(Date.now() - 45 * 60 * 1000)
    }
  },
  { 
    id: '302', 
    number: '302', 
    name: 'Suite', 
    status: 'available', 
    type: 'Executive Suite', 
    alerts: {},
    qrCode: { id: 'QR_302', status: 'inactive', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '303', 
    number: '303', 
    name: 'Deluxe', 
    status: 'reserved', 
    type: 'Deluxe', 
    guest: {
      name: 'Adebayo Johnson',
      phone: '+234 805 678 9012',
      bookingSource: 'Agoda',
      checkIn: '2024-01-22'
    },
    alerts: {},
    qrCode: { id: 'QR_303', status: 'inactive', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '304', 
    number: '304', 
    name: 'Standard', 
    status: 'occupied', 
    type: 'Standard', 
    guest: {
      name: 'Fatima Hassan',
      phone: '+234 806 789 0123',
      bookingSource: 'Direct',
      checkIn: '2024-01-16',
      checkOut: '2024-01-19',
      stayDuration: 3
    },
    alerts: {}, 
    folio: { balance: 18000, isPaid: true, qrCharges: 3000, status: 'up-to-date' },
    qrCode: { 
      id: 'QR_304', 
      status: 'active', 
      servicesEnabled: ['Wi-Fi', 'Room Service'],
      pendingRequests: 0,
      lastScanned: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  },
  { 
    id: '401', 
    number: '401', 
    name: 'Presidential', 
    status: 'available', 
    type: 'Presidential Suite', 
    alerts: {},
    qrCode: { id: 'QR_401', status: 'inactive', servicesEnabled: [], pendingRequests: 0 }
  },
  { 
    id: '402', 
    number: '402', 
    name: 'Suite', 
    status: 'occupied', 
    type: 'Executive Suite', 
    guest: {
      name: 'David Okoro',
      phone: '+234 807 890 1234',
      bookingSource: 'Trivago',
      checkIn: '2024-01-17',
      checkOut: '2024-01-21',
      stayDuration: 4
    },
    alerts: { cleaning: true },
    folio: { balance: 32000, isPaid: false, qrCharges: 7500, status: 'pending' },
    qrCode: { 
      id: 'QR_402', 
      status: 'active', 
      servicesEnabled: ['Wi-Fi', 'Room Service', 'Housekeeping', 'Digital Menu'],
      pendingRequests: 1,
      lastScanned: new Date(Date.now() - 15 * 60 * 1000)
    }
  },
];

export const RoomGrid = ({ searchQuery, activeFilter, onRoomSelect }: RoomGridProps) => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(mockRooms);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roomData, setRoomData] = useState<Room[]>(mockRooms);

  // Filter rooms based on search query and active filter
  useEffect(() => {
    let filtered = roomData;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(room => 
        room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.guest?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.guest?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.guest?.idNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.type.toLowerCase().includes(searchQuery.toLowerCase())
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
            room.folio && (room.folio.status === 'pending' || room.folio.status === 'overdue') && room.folio.balance > 0
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

  // Get enhanced status counts for summary
  const statusCounts = roomData.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const qrStats = roomData.reduce((acc, room) => {
    if (room.qrCode) {
      acc.active += room.qrCode.status === 'active' ? 1 : 0;
      acc.totalRequests += room.qrCode.pendingRequests || 0;
      acc.withCharges += (room.folio?.qrCharges && room.folio.qrCharges > 0) ? 1 : 0;
    }
    return acc;
  }, { active: 0, totalRequests: 0, withCharges: 0 });

  const handleRoomUpdate = (updatedRoom: Room) => {
    setRoomData(prevRooms => {
      const updatedRooms = prevRooms.map(room => 
        room.id === updatedRoom.id ? updatedRoom : room
      );
      // Also update the global mock data
      const roomIndex = mockRooms.findIndex(r => r.id === updatedRoom.id);
      if (roomIndex !== -1) {
        mockRooms[roomIndex] = updatedRoom;
      }
      return updatedRooms;
    });
    setSelectedRoom(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Room Status Summary */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-room-available/10 text-room-available border-room-available/20">
            Available: {statusCounts.available || 0}
          </Badge>
          <Badge variant="outline" className="bg-room-occupied/10 text-room-occupied border-room-occupied/20">
            Occupied: {statusCounts.occupied || 0}
          </Badge>
          <Badge variant="outline" className="bg-room-reserved/10 text-room-reserved border-room-reserved/20">
            Reserved: {statusCounts.reserved || 0}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <QrCode className="h-3 w-3" />
            QR Active: {qrStats.active}
          </Badge>
          {qrStats.totalRequests > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              {qrStats.totalRequests} QR Requests
            </Badge>
          )}
          {qrStats.withCharges > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              {qrStats.withCharges} with QR Charges
            </Badge>
          )}
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
              <RoomTileEnhanced
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