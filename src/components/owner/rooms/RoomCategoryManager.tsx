import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BedDouble, 
  Users, 
  DollarSign, 
  Edit, 
  Trash2, 
  Plus, 
  Upload,
  Wifi,
  Snowflake,
  Tv,
  Coffee,
  Car,
  Utensils,
  Loader2
} from "lucide-react";
import { useOwnerRoomCategories, useCreateRoomCategory, useUpdateRoomCategory, useDeleteRoomCategory } from "@/hooks/useApi";
import { toast } from "sonner";

interface RoomCategory {
  id: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  size: number;
  amenities: string[];
  totalRooms: number;
  availableRooms: number;
  images?: string[];
}

const availableAmenities = [
  { id: 'wifi', name: 'Wi-Fi', icon: Wifi },
  { id: 'ac', name: 'Air Conditioning', icon: Snowflake },
  { id: 'tv', name: 'Smart TV', icon: Tv },
  { id: 'minibar', name: 'Mini Bar', icon: Coffee },
  { id: 'parking', name: 'Parking', icon: Car },
  { id: 'room-service', name: 'Room Service', icon: Utensils },
];

export default function RoomCategoryManager() {
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const { data: categoriesData, isLoading, error } = useOwnerRoomCategories();
  const createCategoryMutation = useCreateRoomCategory();
  const updateCategoryMutation = useUpdateRoomCategory();
  const deleteCategoryMutation = useDeleteRoomCategory();

  const categories = categoriesData?.data || [];

  const handleNewCategory = () => {
    setSelectedCategory({
      id: '',
      name: "",
      description: "",
      baseRate: 0,
      maxOccupancy: 2,
      size: 0,
      amenities: [],
      totalRooms: 0,
      availableRooms: 0,
      images: []
    });
    setIsNewCategory(true);
    setIsEditDialogOpen(true);
  };

  const handleEditCategory = (category: RoomCategory) => {
    setSelectedCategory({ ...category });
    setIsNewCategory(false);
    setIsEditDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!selectedCategory) return;

    try {
      if (isNewCategory) {
        await createCategoryMutation.mutateAsync(selectedCategory);
      } else {
        await updateCategoryMutation.mutateAsync({ 
          id: selectedCategory.id, 
          data: selectedCategory 
        });
      }
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      toast.error('Failed to save room category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this room category?')) {
      try {
        await deleteCategoryMutation.mutateAsync(id);
      } catch (error) {
        toast.error('Failed to delete room category');
      }
    }
  };

  const handleAmenityChange = (amenityId: string) => {
    if (!selectedCategory) return;
    
    const amenities = selectedCategory.amenities.includes(amenityId)
      ? selectedCategory.amenities.filter(id => id !== amenityId)
      : [...selectedCategory.amenities, amenityId];
    
    setSelectedCategory({ ...selectedCategory, amenities });
  };

  const getAmenityIcon = (amenityId: string) => {
    const amenity = availableAmenities.find(a => a.id === amenityId);
    return amenity ? amenity.icon : Wifi;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load room categories. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Room Categories</h3>
          <p className="text-sm text-muted-foreground">
            Manage your hotel's room types and pricing
          </p>
        </div>
        <Button onClick={handleNewCategory} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading categories...</span>
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && categories.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              No room categories yet. Create your first category to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: RoomCategory) => (
            <Card key={category.id} className="luxury-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <div className="flex gap-2">
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
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm">₦{category.baseRate.toLocaleString()}/night</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">Max {category.maxOccupancy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="text-sm">{category.size}m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.totalRooms} rooms</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {category.availableRooms} available
                    </Badge>
                    <Badge variant={category.availableRooms > 0 ? "default" : "destructive"}>
                      {category.availableRooms > 0 ? "Available" : "Full"}
                    </Badge>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1">
                    {category.amenities.slice(0, 4).map((amenityId) => {
                      const amenity = availableAmenities.find(a => a.id === amenityId);
                      const Icon = amenity?.icon || Wifi;
                      return (
                        <Badge key={amenityId} variant="outline" className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {amenity?.name || amenityId}
                        </Badge>
                      );
                    })}
                    {category.amenities.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{category.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewCategory ? 'Create Room Category' : 'Edit Room Category'}
            </DialogTitle>
          </DialogHeader>

          {selectedCategory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={selectedCategory.name}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      name: e.target.value
                    })}
                    placeholder="e.g. Deluxe Suite"
                  />
                </div>
                <div>
                  <Label htmlFor="baseRate">Base Rate (₦)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={selectedCategory.baseRate}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      baseRate: parseInt(e.target.value) || 0
                    })}
                    placeholder="25000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedCategory.description}
                  onChange={(e) => setSelectedCategory({
                    ...selectedCategory,
                    description: e.target.value
                  })}
                  placeholder="Describe this room category..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                  <Input
                    id="maxOccupancy"
                    type="number"
                    value={selectedCategory.maxOccupancy}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      maxOccupancy: parseInt(e.target.value) || 2
                    })}
                    min="1"
                    max="8"
                  />
                </div>
                <div>
                  <Label htmlFor="size">Room Size (m²)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={selectedCategory.size}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      size: parseInt(e.target.value) || 0
                    })}
                    placeholder="35"
                  />
                </div>
                <div>
                  <Label htmlFor="totalRooms">Total Rooms</Label>
                  <Input
                    id="totalRooms"
                    type="number"
                    value={selectedCategory.totalRooms}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      totalRooms: parseInt(e.target.value) || 0,
                      availableRooms: parseInt(e.target.value) || 0
                    })}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {availableAmenities.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = selectedCategory.amenities.includes(amenity.id);
                    return (
                      <div
                        key={amenity.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleAmenityChange(amenity.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{amenity.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="bg-gradient-primary"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isNewCategory ? 'Create Category' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}