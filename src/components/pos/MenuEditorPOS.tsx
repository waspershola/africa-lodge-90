import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  ChefHat,
  AlertTriangle
} from 'lucide-react';
import { usePOSApi, type MenuItem } from '@/hooks/usePOSApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard, { ProtectedButton } from './RoleGuard';
import ApprovalDialog, { type ApprovalRequest } from './ApprovalDialog';

export default function MenuEditorPOS() {
  const { menuItems, isLoading, updateMenuItem } = usePOSApi();
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean);

  const handleToggleAvailability = async (itemId: string, available: boolean) => {
    // Check if user can modify availability
    if (!hasPermission('menu:modify_availability')) {
      // Create approval request
      const approvalRequest: ApprovalRequest = {
        id: `req-${Date.now()}`,
        type: 'menu_availability',
        requestor_id: user?.id || '',
        requestor_name: user?.name || '',
        entity_id: itemId,
        entity_name: menuItems.find(item => item.id === itemId)?.name || '',
        current_value: !available,
        requested_value: available,
        reason: `Staff request to ${available ? 'enable' : 'disable'} menu item`,
        status: 'pending',
        created_at: new Date().toISOString(),
        urgency: 'medium'
      };
      
      setApprovalRequests(prev => [...prev, approvalRequest]);
      toast({
        title: "Approval Required",
        description: "Your request has been sent to a manager for approval.",
      });
      return;
    }

    try {
      await updateMenuItem(itemId, { available });
      toast({
        title: "Menu Item Updated",
        description: `Item ${available ? 'enabled' : 'disabled'} successfully.`,
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
        base_price: selectedItem.base_price,
        prep_time_mins: selectedItem.prep_time_mins,
        category: selectedItem.category,
        available: selectedItem.available,
        inventory_tracked: selectedItem.inventory_tracked,
        stations: selectedItem.stations,
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

  // Stats
  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(item => item.available).length;
  const unavailableItems = totalItems - availableItems;
  const inventoryTracked = menuItems.filter(item => item.inventory_tracked).length;

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
        <ProtectedButton requiredRole={['manager', 'owner']}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </ProtectedButton>
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
                <p className="text-sm font-medium text-muted-foreground">Inventory Tracked</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryTracked}</p>
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
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <Card key={item.id} className={`${!item.available ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.category}
                  </p>
                </div>
                <Badge variant={item.available ? "default" : "secondary"}>
                  {item.available ? "Available" : "Unavailable"}
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
                  <span className="font-bold">₦{(item.base_price / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{item.prep_time_mins}m</span>
                </div>
              </div>

              {item.stations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.stations.map(station => (
                    <Badge key={station} variant="outline" className="text-xs">
                      {station}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`available-${item.id}`} className="text-sm">
                    Available
                  </Label>
                  <Switch
                    id={`available-${item.id}`}
                    checked={item.available}
                    onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                    disabled={isLoading}
                  />
                </div>
                <ProtectedButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditItem(item)}
                  requiredPermission="menu:edit_items"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </ProtectedButton>
              </div>

              {item.inventory_tracked && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Inventory Tracked</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approval Requests */}
      {approvalRequests.length > 0 && hasPermission('menu:approve_changes') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Approval Requests ({approvalRequests.filter(r => r.status === 'pending').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvalRequests.filter(r => r.status === 'pending').map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.entity_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested by {request.requestor_name} • {request.type.replace('_', ' ')}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedApproval(request)}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={selectedItem.category}
                    onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
                    placeholder="e.g., Appetizers, Main Course"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedItem.description || ''}
                  onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                  placeholder="Describe the menu item..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (in kobo)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={selectedItem.base_price}
                    onChange={(e) => setSelectedItem({...selectedItem, base_price: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 2500 for ₦25.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    value={selectedItem.prep_time_mins}
                    onChange={(e) => setSelectedItem({...selectedItem, prep_time_mins: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stations">Kitchen Stations (comma separated)</Label>
                <Input
                  id="stations"
                  value={selectedItem.stations.join(', ')}
                  onChange={(e) => setSelectedItem({
                    ...selectedItem, 
                    stations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., grill, cold, bar"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={selectedItem.available}
                    onCheckedChange={(checked) => setSelectedItem({...selectedItem, available: checked})}
                  />
                  <Label htmlFor="available">Available for ordering</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inventory-tracked"
                    checked={selectedItem.inventory_tracked}
                    onCheckedChange={(checked) => setSelectedItem({...selectedItem, inventory_tracked: checked})}
                  />
                  <Label htmlFor="inventory-tracked">Track inventory</Label>
                </div>
              </div>

              <div className="flex gap-3">
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

      {/* Approval Dialog */}
      {selectedApproval && (
        <ApprovalDialog
          isOpen={!!selectedApproval}
          onClose={() => setSelectedApproval(null)}
          request={selectedApproval}
          canApprove={hasPermission('menu:approve_changes')}
          onApprove={async (requestId) => {
            // Handle approval logic here
            setApprovalRequests(prev => 
              prev.map(r => r.id === requestId ? {...r, status: 'approved' as const} : r)
            );
            toast({
              title: "Request Approved",
              description: "The approval request has been processed.",
            });
          }}
          onReject={async (requestId, reason) => {
            // Handle rejection logic here
            setApprovalRequests(prev => 
              prev.map(r => r.id === requestId ? {...r, status: 'rejected' as const} : r)
            );
            toast({
              title: "Request Rejected",
              description: "The request has been rejected.",
            });
          }}
        />
      )}
    </div>
  );
}