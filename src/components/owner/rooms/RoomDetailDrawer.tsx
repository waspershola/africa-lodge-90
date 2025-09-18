import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BedDouble, 
  DollarSign, 
  Calendar, 
  Users, 
  Wifi, 
  Tv, 
  Coffee,
  Car,
  Utensils,
  Shield,
  Save,
  X,
  Edit,
  Image,
  Settings,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'dirty';
  guest?: string;
  rate: number;
  maxOccupancy: number;
  amenities: string[];
  description: string;
  images: string[];
  lastCleaned?: string;
  nextMaintenance?: string;
}

interface RoomDetailDrawerProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (room: Room) => void;
}

const roomStatuses = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'occupied', label: 'Occupied', color: 'bg-blue-100 text-blue-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'dirty', label: 'Dirty', color: 'bg-red-100 text-red-800' }
];

const amenityOptions = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'tv', label: 'TV/Cable', icon: Tv },
  { id: 'minibar', label: 'Mini Bar', icon: Coffee },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'dining', label: 'Room Service', icon: Utensils },
  { id: 'safe', label: 'Safe', icon: Shield }
];

export default function RoomDetailDrawer({ room, open, onOpenChange, onSave }: RoomDetailDrawerProps) {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  const [formData, setFormData] = useState<Room>(() => 
    room || {
      id: '',
      number: '',
      type: '',
      floor: 1,
      status: 'available',
      rate: 0,
      maxOccupancy: 2,
      amenities: [],
      description: '',
      images: [],
      lastCleaned: new Date().toISOString().split('T')[0],
      nextMaintenance: ''
    }
  );

  const handleSave = () => {
    if (!formData.number || !formData.type || !formData.rate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    setIsEditing(false);
    toast({
      title: "Room Updated",
      description: `Room ${formData.number} has been successfully updated`
    });
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = roomStatuses.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    );
  };

  // Mock booking history data
  const bookingHistory = [
    { id: 1, guest: "John Doe", checkIn: "2024-09-15", checkOut: "2024-09-18", amount: 450 },
    { id: 2, guest: "Jane Smith", checkIn: "2024-09-10", checkOut: "2024-09-13", amount: 375 },
    { id: 3, guest: "Mike Wilson", checkIn: "2024-09-05", checkOut: "2024-09-08", amount: 400 }
  ];

  if (!room && !isEditing) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-3">
                <BedDouble className="h-6 w-6" />
                Room {formData.number || 'New'}
                {formData.status && getStatusBadge(formData.status)}
              </DrawerTitle>
              <p className="text-muted-foreground">
                {formData.type} • Floor {formData.floor} • {formData.maxOccupancy} guests max
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setFormData(room || formData);
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="room-number">Room Number *</Label>
                        <Input
                          id="room-number"
                          value={formData.number}
                          onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="room-type">Room Type *</Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Deluxe">Deluxe</SelectItem>
                            <SelectItem value="Suite">Suite</SelectItem>
                            <SelectItem value="Presidential">Presidential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="floor">Floor</Label>
                        <Input
                          id="floor"
                          type="number"
                          value={formData.floor}
                          onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-occupancy">Max Occupancy</Label>
                        <Input
                          id="max-occupancy"
                          type="number"
                          value={formData.maxOccupancy}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxOccupancy: parseInt(e.target.value) }))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roomStatuses.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        disabled={!isEditing}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.guest && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">Current Guest</span>
                        </div>
                        <p className="text-blue-800">{formData.guest}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Cleaned</span>
                        <span className="text-sm font-medium">
                          {formData.lastCleaned ? new Date(formData.lastCleaned).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Next Maintenance</span>
                        <span className="text-sm font-medium">
                          {formData.nextMaintenance ? new Date(formData.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Room Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenityOptions.map((amenity) => {
                      const IconComponent = amenity.icon;
                      const isSelected = formData.amenities.includes(amenity.id);
                      return (
                        <div
                          key={amenity.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                          } ${!isEditing ? 'pointer-events-none' : ''}`}
                          onClick={() => isEditing && handleAmenityToggle(amenity.id)}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="font-medium">{amenity.label}</span>
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => isEditing && handleAmenityToggle(amenity.id)}
                            disabled={!isEditing}
                            className="ml-auto"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="base-rate">Base Rate *</Label>
                    <Input
                      id="base-rate"
                      type="number"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Current rate: {formatPrice(formData.rate)} per night
                    </p>
                  </div>

                  {/* Pricing history mock data */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Pricing History</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Sept 1-15, 2024</span>
                        <span className="font-medium">{formatPrice(formData.rate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Aug 15-31, 2024</span>
                        <span className="font-medium">{formatPrice(formData.rate * 0.9)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm">Aug 1-14, 2024</span>
                        <span className="font-medium">{formatPrice(formData.rate * 1.1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Booking History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookingHistory.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{booking.guest}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.checkIn} to {booking.checkOut}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatPrice(booking.amount)}</div>
                          <Badge variant="outline" className="text-xs">
                            Completed
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}