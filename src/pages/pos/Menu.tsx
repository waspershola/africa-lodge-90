import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Edit,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Package,
  Filter
} from 'lucide-react';
import { usePOSApi, type MenuItem } from '@/hooks/usePOS';

export default function MenuManagementPage() {
  const { menuItems, isLoading, updateMenuItem } = usePOSApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<MenuItem>>({});

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(menuItems.map(item => item.category_id))];

  const handleToggleAvailability = async (itemId: string, available: boolean) => {
    await updateMenuItem(itemId, { is_available: available });
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setEditedItem(item);
    setEditMode(true);
  };

  const handleSaveItem = async () => {
    if (selectedItem && editedItem) {
      await updateMenuItem(selectedItem.id, editedItem);
      setEditMode(false);
      setSelectedItem(null);
      setEditedItem({});
    }
  };

  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(item => item.available).length;
  const inventoryTrackedItems = menuItems.filter(item => item.inventory_tracked).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage menu items, pricing, and availability
          </p>
        </div>
        <Button>
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
              <Package className="h-8 w-8 text-blue-500" />
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
                <p className="text-2xl font-bold text-red-600">{totalItems - availableItems}</p>
              </div>
              <EyeOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inventory Tracked</p>
                <p className="text-2xl font-bold text-purple-600">{inventoryTrackedItems}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
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
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <Card key={item.id} className={`hover:shadow-md transition-shadow ${
            !item.available ? 'opacity-60 bg-gray-50' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={item.available ? 'default' : 'destructive'}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Badge>
                    {item.inventory_tracked && (
                      <Badge variant="outline">Tracked</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <Badge variant="outline" className="mb-2">{item.category}</Badge>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">₦{(item.base_price / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prep Time:</span>
                  <span>{item.prep_time_mins} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stations:</span>
                  <span className="text-xs">{item.stations.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`availability-${item.id}`} className="text-sm">
                    Available
                  </Label>
                  <Switch
                    id={`availability-${item.id}`}
                    checked={item.available}
                    onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditItem(item)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editMode && selectedItem && (
        <Dialog open={editMode} onOpenChange={setEditMode}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Menu Item - {selectedItem.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={editedItem.name || ''}
                    onChange={(e) => setEditedItem({...editedItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={editedItem.category || ''} onValueChange={(value) => setEditedItem({...editedItem, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedItem.description || ''}
                  onChange={(e) => setEditedItem({...editedItem, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={(editedItem.base_price || 0) / 100}
                    onChange={(e) => setEditedItem({...editedItem, base_price: Math.round(Number(e.target.value) * 100)})}
                  />
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={editedItem.prep_time_mins || 0}
                    onChange={(e) => setEditedItem({...editedItem, prep_time_mins: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stations">Stations (comma-separated)</Label>
                <Input
                  id="stations"
                  value={editedItem.stations?.join(', ') || ''}
                  onChange={(e) => setEditedItem({...editedItem, stations: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="e.g., grill, cold, bar"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="inventory_tracked"
                  checked={editedItem.inventory_tracked || false}
                  onCheckedChange={(checked) => setEditedItem({...editedItem, inventory_tracked: checked})}
                />
                <Label htmlFor="inventory_tracked">Track inventory for this item</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={editedItem.available || false}
                  onCheckedChange={(checked) => setEditedItem({...editedItem, available: checked})}
                />
                <Label htmlFor="available">Item is available</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={isLoading}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}