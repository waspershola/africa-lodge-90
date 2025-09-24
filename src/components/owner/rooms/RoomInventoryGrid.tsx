import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  BedDouble, 
  Wifi, 
  Tv, 
  Car, 
  Coffee,
  Bath,
  Wind
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { usePricingPlans } from "@/hooks/usePricingPlans";
import { useRoomLimits } from "@/hooks/useRoomLimits";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";
import { useRooms } from "@/hooks/useRooms";
import RoomDetailDrawer from "./RoomDetailDrawer";
import BulkEditModal from "./BulkEditModal";
import { AddRoomDialog } from "./AddRoomDialog";

interface Room {
  id: string;
  number: string;
  category: string;
  floor: number;
  status: "available" | "occupied" | "maintenance" | "cleaning" | "out-of-order";
  baseRate: number;
  currentRate: number;
  amenities: string[];
  lastCleaned: string;
  nextMaintenance: string;
  description?: string;
}

const amenityIcons = {
  wifi: Wifi,
  tv: Tv,
  ac: Wind,
  minibar: Coffee,
  balcony: BedDouble,
  jacuzzi: Bath,
  parking: Car,
};

const statusColors = {
  available: "bg-green-500",
  occupied: "bg-blue-500",
  maintenance: "bg-yellow-500",
  cleaning: "bg-orange-500",
  "out-of-order": "bg-red-500",
};

const statusLabels = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  cleaning: "Cleaning",
  "out-of-order": "Out of Order",
};

export default function RoomInventoryGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { formatPrice } = useCurrency();
  const { user, tenant } = useMultiTenantAuth();
  const roomLimits = useRoomLimits(tenant?.plan_id || '');
  const { rooms: liveRooms = [], updateRoomStatus } = useRooms();
  
  // Transform live rooms data to match component interface
  const rooms: Room[] = liveRooms.map(room => ({
    id: room.id,
    number: room.room_number,
    category: room.room_type?.name || 'Standard',
    floor: room.floor || 1,
    status: room.status === 'dirty' ? 'cleaning' : room.status === 'out_of_order' ? 'out-of-order' : room.status as Room['status'],
    baseRate: room.room_type?.base_rate || 0,
    currentRate: room.room_type?.base_rate || 0,
    amenities: room.room_type?.amenities || ['wifi', 'tv', 'ac'],
    lastCleaned: room.last_cleaned || new Date().toISOString(),
    nextMaintenance: room.updated_at ? new Date(new Date(room.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: room.notes || ''
  }));
  
  const currentRoomCount = rooms.length;

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    const matchesCategory = filterCategory === "all" || room.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(rooms.map(room => room.category))];

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsEditDialogOpen(true);
  };

  const handleAddRoom = () => {
    if (!roomLimits.canAddRoom(currentRoomCount)) {
      alert(`Room limit exceeded. Your plan allows a maximum of ${roomLimits.maxRooms} rooms.`);
      return;
    }
    setIsAddDialogOpen(true);
  };

  const handleSaveNewRoom = async (newRoomData: Partial<Room>) => {
    if (!roomLimits.canAddRoom(currentRoomCount)) {
      alert(`Cannot add room. Room limit (${roomLimits.maxRooms}) reached.`);
      return;
    }
    
    try {
      // This would need a createRoom function in useRooms hook
      // For now, just close the dialog
      setIsAddDialogOpen(false);
      console.log('New room data:', newRoomData);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleSaveRoom = async () => {
    if (selectedRoom) {
      try {
        // Map component status back to database status
        const dbStatus = selectedRoom.status === 'cleaning' ? 'dirty' : 
                        selectedRoom.status === 'out-of-order' ? 'out_of_order' : 
                        selectedRoom.status;
        await updateRoomStatus(selectedRoom.id, dbStatus as any);
        setIsEditDialogOpen(false);
        setSelectedRoom(null);
      } catch (error) {
        console.error('Error updating room:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Room Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentRoomCount} / {roomLimits.maxRooms === 9999 ? '∞' : roomLimits.maxRooms} rooms
              </Badge>
              <Button 
                onClick={handleAddRoom}
                disabled={!roomLimits.canAddRoom(currentRoomCount)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search Rooms</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Room number or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="out-of-order">Out of Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category Filter</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="relative group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room {room.number}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[room.status]}`} />
                  <Badge variant="outline" className="text-xs">
                    {statusLabels[room.status]}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{room.category}</span>
                <span className="text-sm font-medium">Floor {room.floor}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base Rate</span>
                <span className="font-medium">{formatPrice(room.baseRate)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Rate</span>
                <span className="font-bold text-lg">{formatPrice(room.currentRate)}</span>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Amenities</span>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity as keyof typeof amenityIcons];
                    return Icon ? (
                      <div
                        key={amenity}
                        className="flex items-center justify-center w-8 h-8 bg-muted rounded-md"
                        title={amenity}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRoom(room)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Room {selectedRoom?.number}</DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input
                    value={selectedRoom.number}
                    onChange={(e) => setSelectedRoom({
                      ...selectedRoom,
                      number: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    value={selectedRoom.floor}
                    onChange={(e) => setSelectedRoom({
                      ...selectedRoom,
                      floor: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedRoom.category}
                  onValueChange={(value) => setSelectedRoom({
                    ...selectedRoom,
                    category: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                    <SelectItem value="Suite">Suite</SelectItem>
                    <SelectItem value="Presidential">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedRoom.status}
                  onValueChange={(value: Room['status']) => setSelectedRoom({
                    ...selectedRoom,
                    status: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="out-of-order">Out of Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Rate</Label>
                  <Input
                    type="number"
                    value={selectedRoom.baseRate}
                    onChange={(e) => setSelectedRoom({
                      ...selectedRoom,
                      baseRate: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Current Rate</Label>
                  <Input
                    type="number"
                    value={selectedRoom.currentRate}
                    onChange={(e) => setSelectedRoom({
                      ...selectedRoom,
                      currentRate: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Room description..."
                  value={selectedRoom.description || ""}
                  onChange={(e) => setSelectedRoom({
                    ...selectedRoom,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveRoom} className="flex-1">
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <AddRoomDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveNewRoom}
      />
    </div>
  );
}