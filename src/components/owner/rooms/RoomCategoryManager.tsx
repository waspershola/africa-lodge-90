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
  Car,
  UtensilsCrossed,
  Dumbbell,
  Waves,
  Coffee,
  Shirt
} from "lucide-react";
import { useRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType } from "@/hooks/useApi";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";
import { useCurrency } from "@/hooks/useCurrency";
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
  { id: 'parking', name: 'Free Parking', icon: Car },
  { id: 'breakfast', name: 'Breakfast Included', icon: UtensilsCrossed },
  { id: 'gym', name: 'Gym Access', icon: Dumbbell },
  { id: 'pool', name: 'Swimming Pool', icon: Waves },
  { id: 'minibar', name: 'Mini Bar', icon: Coffee },
  { id: 'laundry', name: 'Laundry Service', icon: Shirt },
];

export default function RoomCategoryManager() {
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // API hooks
  const { data: categoriesData, isLoading } = useRoomTypes();
  const createCategoryMutation = useCreateRoomType();
  const updateCategoryMutation = useUpdateRoomType();
  const deleteCategoryMutation = useDeleteRoomType();
  const { user, tenant } = useMultiTenantAuth();
  const { formatPrice } = useCurrency();

  const categories = categoriesData || [];

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
        await createCategoryMutation.mutateAsync({
          name: selectedCategory.name,
          description: selectedCategory.description,
          base_rate: selectedCategory.baseRate,
          max_occupancy: selectedCategory.maxOccupancy,
          amenities: selectedCategory.amenities,
          tenant_id: tenant?.tenant_id || user?.tenant_id
        });
      } else {
        await updateCategoryMutation.mutateAsync({ 
          id: selectedCategory.id, 
          updates: {
            name: selectedCategory.name,
            description: selectedCategory.description,
            base_rate: selectedCategory.baseRate,
            max_occupancy: selectedCategory.maxOccupancy,
            amenities: selectedCategory.amenities
          }
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
        await deleteCategoryMutation.mutateAsync({ id });
      } catch (error) {
        toast.error('Failed to delete room category');
      }
    }
  };

  const toggleAmenity = (amenityId: string) => {
    if (!selectedCategory) return;
    
    const amenities = selectedCategory.amenities.includes(amenityId)
      ? selectedCategory.amenities.filter(id => id !== amenityId)
      : [...selectedCategory.amenities, amenityId];
    
    setSelectedCategory({ ...selectedCategory, amenities });
  };

  if (isLoading) {
    return <div>Loading room categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Categories</h2>
          <p className="text-muted-foreground">
            Manage different types of rooms and their configurations
          </p>
        </div>
        <Button onClick={handleNewCategory}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              No room categories yet. Create your first category to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((dbCategory) => {
            // Map Supabase schema to component interface
            const category: RoomCategory = {
              id: dbCategory.id,
              name: dbCategory.name,
              description: dbCategory.description || '',
              baseRate: dbCategory.base_rate,
              maxOccupancy: dbCategory.max_occupancy,
              size: 0, // Not in current schema
              amenities: dbCategory.amenities || [],
              totalRooms: 0, // Would need to be calculated
              availableRooms: 0, // Would need to be calculated
              images: []
            };
            
            return (
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
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatPrice(category.baseRate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{category.maxOccupancy} guests</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Amenities</div>
                      <div className="flex flex-wrap gap-1">
                        {category.amenities.slice(0, 4).map((amenityId) => {
                          const amenity = availableAmenities.find(a => a.id === amenityId);
                          return amenity ? (
                            <Badge key={amenityId} variant="secondary" className="text-xs">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={selectedCategory.name}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      name: e.target.value
                    })}
                    placeholder="e.g., Deluxe Suite"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={selectedCategory.baseRate}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      baseRate: Number(e.target.value)
                    })}
                    placeholder="150000"
                  />
                </div>
              </div>

              <div className="space-y-2">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                  <Select
                    value={selectedCategory.maxOccupancy.toString()}
                    onValueChange={(value) => setSelectedCategory({
                      ...selectedCategory,
                      maxOccupancy: Number(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'guest' : 'guests'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Room Size (sq ft)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={selectedCategory.size}
                    onChange={(e) => setSelectedCategory({
                      ...selectedCategory,
                      size: Number(e.target.value)
                    })}
                    placeholder="450"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-3">
                  {availableAmenities.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = selectedCategory.amenities.includes(amenity.id);
                    
                    return (
                      <Button
                        key={amenity.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAmenity(amenity.id)}
                        className="justify-start h-auto p-3"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{amenity.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {isNewCategory ? 'Create Category' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}