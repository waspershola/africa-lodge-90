import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, AlertCircle, User, Wrench, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import RoomTile from './RoomTile';

export interface Room {
  id: string;
  number: string;
  name: string;
  type: string;
  status: 'available' | 'occupied' | 'reserved' | 'oos' | 'overstay';
  guestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  alerts?: Array<{
    type: 'id_missing' | 'deposit_due' | 'cleaning_required' | 'maintenance';
    message: string;
  }>;
  cleaning?: {
    required: boolean;
    completed: boolean;
  };
  revenue?: number;
}

interface RoomGridProps {
  rooms: Room[];
  selectedRoom?: string;
  onRoomSelect: (roomId: string) => void;
  onRoomAction: (roomId: string, action: string) => void;
  filterBy?: string;
  isReadOnly?: boolean;
}

const statusColors = {
  available: 'bg-success text-success-foreground',
  occupied: 'bg-destructive text-destructive-foreground',
  reserved: 'bg-primary text-primary-foreground',
  oos: 'bg-warning text-warning-foreground',
  overstay: 'bg-purple-600 text-white'
};

const statusLabels = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  oos: 'Out of Service',
  overstay: 'Overstay'
};

export default function RoomGrid({
  rooms,
  selectedRoom,
  onRoomSelect,
  onRoomAction,
  filterBy,
  isReadOnly = false
}: RoomGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Filter rooms based on search and status
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = !searchQuery || 
      room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.guestName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = !filterStatus || room.status === filterStatus;

    // Apply dashboard card filters
    if (filterBy) {
      switch (filterBy) {
        case 'arrivals':
          return matchesSearch && room.status === 'reserved';
        case 'departures':
          return matchesSearch && room.status === 'occupied' && room.checkOutDate === new Date().toISOString().split('T')[0];
        case 'overstays':
          return matchesSearch && room.status === 'overstay';
        case 'oos':
          return matchesSearch && room.status === 'oos';
        case 'pending_payments':
          return matchesSearch && room.alerts?.some(alert => alert.type === 'deposit_due');
        default:
          return matchesSearch && matchesFilter;
      }
    }

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    reserved: rooms.filter(r => r.status === 'reserved').length,
    oos: rooms.filter(r => r.status === 'oos').length,
    overstay: rooms.filter(r => r.status === 'overstay').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Search and Filters */}
      <div className="flex flex-col gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search rooms, guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {filterBy && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              Filtered by {filterBy}
            </Badge>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
            className="gap-1"
          >
            All ({rooms.length})
          </Button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={`gap-1 ${filterStatus === status ? statusColors[status as keyof typeof statusColors] : ''}`}
            >
              {statusLabels[status as keyof typeof statusLabels]} ({count})
            </Button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="flex-1 overflow-auto p-4">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
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
                  isSelected={selectedRoom === room.id}
                  onSelect={() => onRoomSelect(room.id)}
                  onAction={(action) => onRoomAction(room.id, action)}
                  isReadOnly={isReadOnly}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No rooms found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>

      {/* Room Count Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredRooms.length} of {rooms.length} rooms
          {selectedRoom && (
            <span className="ml-2 text-primary">
              • Room {rooms.find(r => r.id === selectedRoom)?.number} selected
            </span>
          )}
        </p>
      </div>
    </div>
  );
}