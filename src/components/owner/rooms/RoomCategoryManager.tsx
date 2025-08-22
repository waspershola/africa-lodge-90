import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BedDouble, 
  Maximize, 
  Wifi,
  Tv,
  Car,
  Coffee,
  Bath,
  Wind,
  Shield,
  Utensils
} from "lucide-react";

interface RoomCategory {
  id: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  bedType: string;
  roomSize: number; // in sqft
  amenities: string[];
  images: string[];
  totalRooms: number;
  availableRooms: number;
}

const availableAmenities = [
  { id: "wifi", name: "Free Wi-Fi", icon: Wifi },
  { id: "tv", name: "Smart TV", icon: Tv },
  { id: "ac", name: "Air Conditioning", icon: Wind },
  { id: "minibar", name: "Mini Bar", icon: Coffee },
  { id: "balcony", name: "Balcony", icon: BedDouble },
  { id: "jacuzzi", name: "Jacuzzi", icon: Bath },
  { id: "parking", name: "Free Parking", icon: Car },
  { id: "safe", name: "In-room Safe", icon: Shield },
  { id: "room-service", name: "24/7 Room Service", icon: Utensils },
];

const mockCategories: RoomCategory[] = [
  {
    id: "1",
    name: "Standard Room",
    description: "Comfortable accommodation with essential amenities for a pleasant stay.",
    baseRate: 120,
    maxOccupancy: 2,
    bedType: "Queen Bed",
    roomSize: 300,
    amenities: ["wifi", "tv", "ac"],
    images: [],
    totalRooms: 80,
    availableRooms: 65,
  },
  {
    id: "2",
    name: "Deluxe Room",
    description: "Spacious rooms with premium amenities and city or garden views.",
    baseRate: 180,
    maxOccupancy: 3,
    bedType: "King Bed",
    roomSize: 450,
    amenities: ["wifi", "tv", "ac", "minibar", "balcony", "safe"],
    images: [],
    totalRooms: 50,
    availableRooms: 42,
  },
  {
    id: "3",
    name: "Executive Suite",
    description: "Luxurious suite with separate living area and premium services.",
    baseRate: 320,
    maxOccupancy: 4,
    bedType: "King Bed + Sofa Bed",
    roomSize: 700,
    amenities: ["wifi", "tv", "ac", "minibar", "balcony", "jacuzzi", "safe", "room-service"],
    images: [],
    totalRooms: 20,
    availableRooms: 13,
  },
];

export default function RoomCategoryManager() {
  const [categories, setCategories] = useState<RoomCategory[]>(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const handleNewCategory = () => {
    setSelectedCategory({
      id: Date.now().toString(),
      name: "",
      description: "",
      baseRate: 0,
      maxOccupancy: 2,
      bedType: "",
      roomSize: 0,
      amenities: [],
      images: [],
      totalRooms: 0,
      availableRooms: 0,
    });
    setIsNewCategory(true);
    setIsEditDialogOpen(true);
  };

  const handleEditCategory = (category: RoomCategory) => {
    setSelectedCategory({ ...category });
    setIsNewCategory(false);
    setIsEditDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (selectedCategory) {
      if (isNewCategory) {
        setCategories([...categories, selectedCategory]);
      } else {
        setCategories(categories.map(cat => 
          cat.id === selectedCategory.id ? selectedCategory : cat
        ));
      }
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setIsNewCategory(false);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (!selectedCategory) return;
    
    const newAmenities = checked
      ? [...selectedCategory.amenities, amenityId]
      : selectedCategory.amenities.filter(id => id !== amenityId);
    
    setSelectedCategory({
      ...selectedCategory,
      amenities: newAmenities
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Room Categories</h2>
        <Button onClick={handleNewCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <Badge variant="secondary">
                  {category.availableRooms}/{category.totalRooms} Available
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {category.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Max {category.maxOccupancy} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span>{category.bedType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="h-4 w-4 text-muted-foreground" />
                  <span>{category.roomSize} sq ft</span>
                </div>
                <div className="text-right font-semibold">
                  ${category.baseRate}/night
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Amenities</span>
                <div className="flex flex-wrap gap-1">
                  {category.amenities.map((amenityId) => {
                    const amenity = availableAmenities.find(a => a.id === amenityId);
                    return amenity ? (
                      <div
                        key={amenityId}
                        className="flex items-center justify-center w-8 h-8 bg-muted rounded-md"
                        title={amenity.name}
                      >
                        <amenity.icon className="h-4 w-4" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditCategory(category)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewCategory ? "Create New Category" : `Edit ${selectedCategory?.name}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    value={selectedCategory.name}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      name: e.target.value
                    })}
                    placeholder="e.g., Deluxe Room"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Base Rate (USD)</Label>
                  <Input
                    type="number"
                    value={selectedCategory.baseRate}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      baseRate: parseFloat(e.target.value) || 0
                    })}
                    placeholder="120"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedCategory.description}
                  onChange={(e) => setSelectedCategory({
                    ...selectedCategory,
                    description: e.target.value
                  })}
                  placeholder="Describe the room category..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Occupancy</Label>
                  <Select
                    value={selectedCategory.maxOccupancy.toString()}
                    onValueChange={(value) => setSelectedCategory({
                      ...selectedCategory,
                      maxOccupancy: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Room Size (sq ft)</Label>
                  <Input
                    type="number"
                    value={selectedCategory.roomSize}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      roomSize: parseInt(e.target.value) || 0
                    })}
                    placeholder="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Rooms</Label>
                  <Input
                    type="number"
                    value={selectedCategory.totalRooms}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      totalRooms: parseInt(e.target.value) || 0
                    })}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bed Type</Label>
                <Select
                  value={selectedCategory.bedType}
                  onValueChange={(value) => setSelectedCategory({
                    ...selectedCategory,
                    bedType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Bed">Single Bed</SelectItem>
                    <SelectItem value="Twin Beds">Twin Beds</SelectItem>
                    <SelectItem value="Double Bed">Double Bed</SelectItem>
                    <SelectItem value="Queen Bed">Queen Bed</SelectItem>
                    <SelectItem value="King Bed">King Bed</SelectItem>
                    <SelectItem value="King Bed + Sofa Bed">King Bed + Sofa Bed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableAmenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={selectedCategory.amenities.includes(amenity.id)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                      />
                      <label
                        htmlFor={amenity.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <amenity.icon className="h-4 w-4" />
                        {amenity.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveCategory} className="flex-1">
                  {isNewCategory ? "Create Category" : "Save Changes"}
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