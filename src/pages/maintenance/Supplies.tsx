import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search,
  Wrench,
  Zap,
  Droplets,
  Shield
} from 'lucide-react';
import { useMaintenanceApi } from '@/hooks/useMaintenance';

export default function MaintenanceSuppliesPage() {
  const { supplies, updateSupplyStock, isLoading } = useMaintenanceApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(1);

  const filteredSupplies = supplies.filter(supply =>
    supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supply.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical': return Zap;
      case 'plumbing': return Droplets;
      case 'hvac': return Wrench;
      case 'safety': return Shield;
      default: return Package;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'electrical': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'plumbing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'hvac': return 'text-green-600 bg-green-50 border-green-200';
      case 'safety': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStockStatus = (supply: any) => {
    if (supply.currentStock <= supply.minThreshold) {
      return { status: 'low', color: 'destructive' };
    } else if (supply.currentStock >= supply.maxThreshold * 0.8) {
      return { status: 'high', color: 'success' };
    }
    return { status: 'normal', color: 'secondary' };
  };

  const handleStockAdjustment = async (supplyId: string, operation: 'add' | 'remove') => {
    await updateSupplyStock(supplyId, adjustmentQty, operation);
    setSelectedSupply(null);
    setAdjustmentQty(1);
  };

  const lowStockCount = supplies.filter(s => s.currentStock <= s.minThreshold).length;
  const totalValue = supplies.reduce((sum, s) => sum + (s.currentStock * s.cost), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Supplies & Parts</h1>
          <p className="text-muted-foreground mt-1">
            Track inventory and manage spare parts usage
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{supplies.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {[...new Set(supplies.map(s => s.category))].length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search supplies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSupplies.map(supply => {
          const CategoryIcon = getCategoryIcon(supply.category);
          const stockStatus = getStockStatus(supply);
          
          return (
            <Card key={supply.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(supply.category)}`}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <Badge variant={stockStatus.color as any}>
                    {stockStatus.status === 'low' ? 'Low Stock' : 
                     stockStatus.status === 'high' ? 'Well Stocked' : 'Normal'}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg mb-2">{supply.name}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Stock:</span>
                    <span className="font-medium">
                      {supply.currentStock} {supply.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Threshold:</span>
                    <span>{supply.minThreshold} {supply.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Cost:</span>
                    <span>${supply.cost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-xs">{supply.location}</span>
                  </div>
                </div>

                {/* Stock Level Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Stock Level</span>
                    <span>{((supply.currentStock / supply.maxThreshold) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        supply.currentStock <= supply.minThreshold 
                          ? 'bg-red-500' 
                          : supply.currentStock >= supply.maxThreshold * 0.8
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                      }`}
                      style={{ 
                        width: `${Math.min((supply.currentStock / supply.maxThreshold) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedSupply(supply)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stock
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Stock - {selectedSupply?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Current Stock</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedSupply?.currentStock} {selectedSupply?.unit}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={adjustmentQty}
                            onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            onClick={() => selectedSupply && handleStockAdjustment(selectedSupply.id, 'add')}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Stock
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => selectedSupply && handleStockAdjustment(selectedSupply.id, 'remove')}
                            disabled={isLoading}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Remove Stock
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}