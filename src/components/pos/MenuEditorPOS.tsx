import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit3, 
  Eye, 
  EyeOff, 
  Clock, 
  DollarSign,
  Package,
  Filter,
  Search,
  ChefHat
} from 'lucide-react';
import { usePOSApi, type MenuItem } from '@/hooks/usePOSApi';
import { useToast } from '@/hooks/use-toast';

export default function MenuEditorPOS() {
  const { menuItems, isLoading, updateMenuItem, addMenuItem } = usePOSApi();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    preparation_time: 10,
    is_available: true,
    category_id: '',
    tenant_id: ''
  });

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category?.name))).filter(Boolean);

  const handleToggleAvailability = async (itemId: string, is_available: boolean) => {
    try {
      await updateMenuItem(itemId, { is_available });
      toast({
        title: "Menu Item Updated",
        description: `Item ${is_available ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Unable to update menu item availability.",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!selectedItem) return;

    try {
      await updateMenuItem(selectedItem.id, {
        name: selectedItem.name,
        description: selectedItem.description,
        price: selectedItem.price,
        preparation_time: selectedItem.preparation_time,
        is_available: selectedItem.is_available,
      });
      
      toast({
        title: "Menu Item Updated",
        description: "Changes saved successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save menu item changes.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewItem = async () => {
    if (!newItem.name || (newItem.price || 0) <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (addMenuItem) {
        await addMenuItem({
          category_id: newItem.category_id || '',
          name: newItem.name || '',
          description: newItem.description,
          price: newItem.price || 0,
          preparation_time: newItem.preparation_time,
          dietary_info: newItem.dietary_info,
          tags: newItem.tags
        });
        
        toast({
          title: "Menu Item Added",
          description: "New menu item created successfully.",
        });
      } else {
        toast({
          title: "New Item Request Submitted",
          description: "Your request to add this menu item has been sent to a manager for approval.",
        });
      }
      
      // Reset form
      setNewItem({
        name: '',
        description: '',
        price: 0,
        preparation_time: 15,
        is_available: true,
        category_id: '',
        tenant_id: ''
      });
      setIsAddItemDialogOpen(false);
    } catch (error) {
      toast({
        title: "Add Failed",
        description: "Unable to add new menu item.",
        variant: "destructive",
      });
    }
  };

  // Stats
  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(item => item.is_available).length;
  const unavailableItems = totalItems - availableItems;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage menu items, availability, and pricing
          </p>
        </div>
        <Button onClick={() => setIsAddItemDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableItems}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unavailable</p>
                <p className="text-2xl font-bold text-red-600">{unavailableItems}</p>
              </div>
              <EyeOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-orange-600">{categories.length}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category || ''}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <Card key={item.id} className={`${!item.is_available ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.category?.name || 'No Category'}
                  </p>
                </div>
                <Badge variant={item.is_available ? "default" : "secondary"}>
                  {item.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {item.description || "No description available"}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="font-bold">₦{item.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{item.preparation_time || 15}m</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`available-${item.id}`} className="text-sm">
                    Available
                  </Label>
                  <Switch
                    id={`available-${item.id}`}
                    checked={item.is_available}
                    onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditItem(item)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Item Name *</Label>
                <Input
                  id="new-name"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="Enter item name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-category">Category ID</Label>
                <Input
                  id="new-category"
                  value={newItem.category_id || ''}
                  onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                  placeholder="Enter category ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                value={newItem.description || ''}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Describe the menu item..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-price">Price (NGN) *</Label>
                <Input
                  id="new-price"
                  type="number"
                  value={newItem.price || 0}
                  onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., 25.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-prep-time">Prep Time (minutes)</Label>
                <Input
                  id="new-prep-time"
                  type="number"
                  value={newItem.preparation_time || 0}
                  onChange={(e) => setNewItem({...newItem, preparation_time: parseInt(e.target.value) || 0})}
                  placeholder="e.g., 15"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-available"
                  checked={newItem.is_available || false}
                  onCheckedChange={(checked) => setNewItem({...newItem, is_available: checked})}
                />
                <Label htmlFor="new-available">Available</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNewItem} disabled={isLoading}>
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name *</Label>
                  <Input
                    id="edit-name"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={selectedItem.category?.name || ''}
                    disabled
                    placeholder="Category (read-only)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedItem.description || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                  placeholder="Describe the menu item..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (NGN) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={selectedItem.price}
                    onChange={(e) => setSelectedItem({...selectedItem, price: parseFloat(e.target.value) || 0})}
                    placeholder="e.g., 25.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-prep-time">Prep Time (minutes)</Label>
                  <Input
                    id="edit-prep-time"
                    type="number"
                    value={selectedItem.preparation_time || 0}
                    onChange={(e) => setSelectedItem({...selectedItem, preparation_time: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 15"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-available"
                    checked={selectedItem.is_available || false}
                    onCheckedChange={(checked) => setSelectedItem({...selectedItem, is_available: checked})}
                  />
                  <Label htmlFor="edit-available">Available</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={isLoading}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}