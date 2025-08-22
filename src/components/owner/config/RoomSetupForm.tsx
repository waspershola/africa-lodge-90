import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  BedDouble, 
  Plus, 
  Edit, 
  Trash2, 
  Wifi, 
  Tv, 
  Car, 
  Coffee,
  Bath,
  Wind,
  Dumbbell,
  Utensils,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RoomSetupFormProps {
  onDataChange: () => void;
}

interface RoomCategory {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: {
    adults: number;
    children: number;
  };
  size: number; // in square meters
  amenities: string[];
  images: string[];
  isActive: boolean;
}

interface Amenity {
  id: string;
  name: string;
  icon: any;
  category: 'room' | 'bathroom' | 'entertainment' | 'service' | 'facilities';
}

const RoomSetupForm = ({ onDataChange }: RoomSetupFormProps) => {
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([
    {
      id: '1',
      name: 'Standard Room',
      description: 'Comfortable accommodation with modern amenities',
      basePrice: 25000,
      capacity: { adults: 2, children: 1 },
      size: 25,
      amenities: ['wifi', 'tv', 'ac', 'minibar'],
      images: [],
      isActive: true
    },
    {
      id: '2', 
      name: 'Deluxe Room',
      description: 'Spacious room with premium furnishings and city view',
      basePrice: 45000,
      capacity: { adults: 2, children: 2 },
      size: 35,
      amenities: ['wifi', 'tv', 'ac', 'minibar', 'safe', 'balcony'],
      images: [],
      isActive: true
    },
    {
      id: '3',
      name: 'Executive Suite',
      description: 'Luxury suite with separate living area and premium services',
      basePrice: 85000,
      capacity: { adults: 4, children: 2 },
      size: 65,
      amenities: ['wifi', 'tv', 'ac', 'minibar', 'safe', 'balcony', 'kitchenette', 'butler'],
      images: [],
      isActive: true
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);

  const availableAmenities: Amenity[] = [
    { id: 'wifi', name: 'Free WiFi', icon: Wifi, category: 'room' },
    { id: 'tv', name: 'Smart TV', icon: Tv, category: 'entertainment' },
    { id: 'ac', name: 'Air Conditioning', icon: Wind, category: 'room' },
    { id: 'minibar', name: 'Mini Bar', icon: Coffee, category: 'room' },
    { id: 'safe', name: 'In-room Safe', icon: BedDouble, category: 'room' },
    { id: 'balcony', name: 'Private Balcony', icon: BedDouble, category: 'room' },
    { id: 'kitchenette', name: 'Kitchenette', icon: Utensils, category: 'room' },
    { id: 'butler', name: 'Butler Service', icon: BedDouble, category: 'service' },
    { id: 'parking', name: 'Free Parking', icon: Car, category: 'facilities' },
    { id: 'gym', name: 'Gym Access', icon: Dumbbell, category: 'facilities' },
    { id: 'spa', name: 'Spa Access', icon: Bath, category: 'facilities' },
    { id: 'pool', name: 'Pool Access', icon: BedDouble, category: 'facilities' }
  ];

  const handleAddCategory = () => {
    const newCategory: RoomCategory = {
      id: Date.now().toString(),
      name: 'New Room Category',
      description: '',
      basePrice: 20000,
      capacity: { adults: 2, children: 0 },
      size: 20,
      amenities: ['wifi', 'tv', 'ac'],
      images: [],
      isActive: true
    };
    setRoomCategories(prev => [...prev, newCategory]);
    setEditingCategory(newCategory);
    onDataChange();
  };

  const handleEditCategory = (category: RoomCategory) => {
    setEditingCategory({ ...category });
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;
    
    setRoomCategories(prev => 
      prev.map(cat => cat.id === editingCategory.id ? editingCategory : cat)
    );
    setEditingCategory(null);
    onDataChange();
    toast({
      title: "Room Category Updated",
      description: "Room category has been saved successfully.",
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    setRoomCategories(prev => prev.filter(cat => cat.id !== categoryId));
    onDataChange();
    toast({
      title: "Room Category Deleted",
      description: "Room category has been removed.",
    });
  };

  const toggleAmenity = (amenityId: string) => {
    if (!editingCategory) return;
    
    const hasAmenity = editingCategory.amenities.includes(amenityId);
    const newAmenities = hasAmenity 
      ? editingCategory.amenities.filter(id => id !== amenityId)
      : [...editingCategory.amenities, amenityId];
    
    setEditingCategory({
      ...editingCategory,
      amenities: newAmenities
    });
  };

  const uploadRoomImage = (categoryId: string) => {
    // Simulate image upload
    toast({
      title: "Image Upload",
      description: "Room image uploaded successfully",
    });
    onDataChange();
  };

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-semibold">Room Categories</h3>
          <p className="text-muted-foreground">
            Configure your room types, pricing, and amenities
          </p>
        </div>
        <Button 
          onClick={handleAddCategory}
          className="bg-gradient-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Room Category
        </Button>
      </div>

      {/* Room Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roomCategories.map((category) => (
          <Card key={category.id} className="luxury-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Base Price:</span>
                  <div className="text-lg font-bold text-primary">
                    ₦{category.basePrice.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Capacity:</span>
                  <div>
                    {category.capacity.adults} adults
                    {category.capacity.children > 0 && `, ${category.capacity.children} children`}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <div>{category.size} m²</div>
                </div>
                <div>
                  <span className="font-medium">Amenities:</span>
                  <div>{category.amenities.length} included</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {category.amenities.slice(0, 4).map(amenityId => {
                  const amenity = availableAmenities.find(a => a.id === amenityId);
                  return amenity ? (
                    <Badge key={amenityId} variant="outline" className="text-xs">
                      {amenity.name}
                    </Badge>
                  ) : null;
                })}
                {category.amenities.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{category.amenities.length - 4} more
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => uploadRoomImage(category.id)}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Category Modal/Form */}
      {editingCategory && (
        <Card className="luxury-card border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              Edit Room Category: {editingCategory.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    name: e.target.value
                  })}
                  placeholder="e.g., Standard Room"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (₦) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={editingCategory.basePrice}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    basePrice: parseInt(e.target.value) || 0
                  })}
                  placeholder="25000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingCategory.description}
                onChange={(e) => setEditingCategory({
                  ...editingCategory,
                  description: e.target.value
                })}
                placeholder="Describe the room category features and benefits"
                rows={2}
              />
            </div>

            {/* Capacity & Size */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adults">Max Adults *</Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  value={editingCategory.capacity.adults}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    capacity: {
                      ...editingCategory.capacity,
                      adults: parseInt(e.target.value) || 1
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Max Children</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  value={editingCategory.capacity.children}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    capacity: {
                      ...editingCategory.capacity,
                      children: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size (m²)</Label>
                <Input
                  id="size"
                  type="number"
                  value={editingCategory.size}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    size: parseInt(e.target.value) || 0
                  })}
                  placeholder="25"
                />
              </div>
            </div>

            {/* Amenities Selection */}
            <div className="space-y-4">
              <Label>Room Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableAmenities.map((amenity) => {
                  const isSelected = editingCategory.amenities.includes(amenity.id);
                  const Icon = amenity.icon;
                  
                  return (
                    <div
                      key={amenity.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleAmenity(amenity.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{amenity.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this room category for bookings
                </p>
              </div>
              <Switch
                id="isActive"
                checked={editingCategory.isActive}
                onCheckedChange={(checked) => setEditingCategory({
                  ...editingCategory,
                  isActive: checked
                })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                className="bg-gradient-primary"
              >
                Save Category
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomSetupForm;