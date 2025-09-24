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
import { Room, useRooms } from "@/hooks/useRooms";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import RoomDetailDrawer from "./RoomDetailDrawer";
import BulkEditModal from "./BulkEditModal";
import { AddRoomDialog } from "./AddRoomDialog";



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
  dirty: "bg-orange-500",
  out_of_order: "bg-red-500",
};

const statusLabels = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  dirty: "Dirty",
  out_of_order: "Out of Order",
};

export default function RoomInventoryGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { formatPrice } = useCurrency();
  const { user, tenant } = useAuth();
  const { rooms = [], roomTypes = [] } = useRooms();
  
  const currentRoomCount = rooms.length;

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.room_type?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    const matchesCategory = filterCategory === "all" || (room.room_type?.name || '') === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(rooms.map(room => room.room_type?.name).filter(Boolean))];

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsEditDialogOpen(true);
  };

  const handleAddRoom = () => {
    setIsAddDialogOpen(true);
  };

  const handleSaveNewRoom = (newRoomData: Partial<Room>) => {
    // This would typically call an API to create the room
    console.log('Creating new room:', newRoomData);
    setIsAddDialogOpen(false);
  };

  const handleSaveRoom = () => {
    if (selectedRoom) {
      // This would typically call an API to update the room
      console.log('Updating room:', selectedRoom);
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
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
                {currentRoomCount} rooms
              </Badge>
              <Button 
                onClick={handleAddRoom}
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
                    <SelectItem value="dirty">Dirty</SelectItem>
                    <SelectItem value="out_of_order">Out of Order</SelectItem>
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
                <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[room.status] || 'bg-gray-500'}`} />
                  <Badge variant="outline" className="text-xs">
                    {statusLabels[room.status] || room.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{room.room_type?.name || 'Unknown'}</span>
                <span className="text-sm font-medium">Floor {room.floor || 1}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Base Rate</span>
                <span className="font-medium">{formatPrice(room.room_type?.base_rate || 0)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Occupancy</span>
                <span className="font-bold text-lg">{room.room_type?.max_occupancy || 2} guests</span>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Amenities</span>
                <div className="flex flex-wrap gap-1">
                  {(room.room_type?.amenities || []).map((amenity) => {
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
            <DialogTitle>Edit Room {selectedRoom?.room_number}</DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input
                    value={selectedRoom.room_number}
                    onChange={(e) => setSelectedRoom({
                      ...selectedRoom,
                      room_number: e.target.value
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
                  value={selectedRoom.room_type_id || ''}
                  onValueChange={(value) => setSelectedRoom({
                    ...selectedRoom,
                    room_type_id: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedRoom.status}
                  onValueChange={(value) => setSelectedRoom({
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
                    <SelectItem value="dirty">Dirty</SelectItem>
                    <SelectItem value="out_of_order">Out of Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Room notes..."
                  value={selectedRoom.notes || ""}
                  onChange={(e) => setSelectedRoom({
                    ...selectedRoom,
                    notes: e.target.value
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
                onSave={(roomData: Partial<Room>) => {
                  console.log('Creating new room:', roomData);
                  setIsAddDialogOpen(false);
                }}
      />
    </div>
  );
}