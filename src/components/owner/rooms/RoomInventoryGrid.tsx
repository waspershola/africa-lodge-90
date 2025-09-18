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
import RoomDetailDrawer from "./RoomDetailDrawer";
import BulkEditModal from "./BulkEditModal";

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

const mockRooms: Room[] = [
  {
    id: "1",
    number: "101",
    category: "Standard",
    floor: 1,
    status: "available",
    baseRate: 120,
    currentRate: 135,
    amenities: ["wifi", "tv", "ac"],
    lastCleaned: "2024-01-22T10:00:00",
    nextMaintenance: "2024-02-15",
  },
  {
    id: "2",
    number: "102",
    category: "Deluxe",
    floor: 1,
    status: "occupied",
    baseRate: 180,
    currentRate: 195,
    amenities: ["wifi", "tv", "ac", "minibar", "balcony"],
    lastCleaned: "2024-01-21T14:00:00",
    nextMaintenance: "2024-02-20",
  },
  {
    id: "3",
    number: "201",
    category: "Suite",
    floor: 2,
    status: "maintenance",
    baseRate: 320,
    currentRate: 320,
    amenities: ["wifi", "tv", "ac", "minibar", "balcony", "jacuzzi"],
    lastCleaned: "2024-01-20T09:00:00",
    nextMaintenance: "2024-01-23",
  },
];

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
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { formatPrice } = useCurrency();

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

  const handleSaveRoom = () => {
    if (selectedRoom) {
      setRooms(rooms.map(room => 
        room.id === selectedRoom.id ? selectedRoom : room
      ));
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Room Filters
          </CardTitle>
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
    </div>
  );
}