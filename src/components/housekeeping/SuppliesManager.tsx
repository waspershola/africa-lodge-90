import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface Supply {
  id: string;
  name: string;
  category: 'bedding' | 'bathroom' | 'cleaning' | 'amenities' | 'maintenance' | 'food';
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  cost: number;
  supplier: string;
  lastRestocked: Date;
  location: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'ordered';
}

interface UsageLog {
  id: string;
  supplyId: string;
  supplyName: string;
  roomNumber: string;
  staffMember: string;
  quantityUsed: number;
  usedAt: Date;
  taskId?: string;
  taskType?: string;
  notes?: string;
}

interface StockAlert {
  id: string;
  supplyId: string;
  supplyName: string;
  alertType: 'low-stock' | 'out-of-stock' | 'expired';
  message: string;
  createdAt: Date;
  acknowledged: boolean;
}

export default function SuppliesManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [showSupplyDetails, setShowSupplyDetails] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [usageQuantity, setUsageQuantity] = useState(1);
  const [usageRoomNumber, setUsageRoomNumber] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');

  // Mock supplies data
  const supplies: Supply[] = [
    {
      id: 'sup-1',
      name: 'Bath Towels',
      category: 'bathroom',
      currentStock: 45,
      minimumStock: 20,
      maximumStock: 100,
      unit: 'pieces',
      cost: 25.00,
      supplier: 'Hotel Linens Co.',
      lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      location: 'Linen Room A',
      status: 'in-stock'
    },
    {
      id: 'sup-2',
      name: 'Toilet Paper',
      category: 'bathroom',
      currentStock: 8,
      minimumStock: 15,
      maximumStock: 50,
      unit: 'rolls',
      cost: 12.50,
      supplier: 'CleanSupply Ltd.',
      lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      location: 'Storage Room B',
      status: 'low-stock'
    },
    {
      id: 'sup-3',
      name: 'Bed Sheets (Queen)',
      category: 'bedding',
      currentStock: 0,
      minimumStock: 10,
      maximumStock: 40,
      unit: 'sets',
      cost: 45.00,
      supplier: 'Premium Textiles',
      lastRestocked: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      location: 'Linen Room A',
      status: 'out-of-stock'
    },
    {
      id: 'sup-4',
      name: 'All-Purpose Cleaner',
      category: 'cleaning',
      currentStock: 12,
      minimumStock: 8,
      maximumStock: 25,
      unit: 'bottles',
      cost: 8.75,
      supplier: 'CleanSupply Ltd.',
      lastRestocked: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      location: 'Cleaning Supplies',
      status: 'in-stock'
    },
    {
      id: 'sup-5',
      name: 'Shampoo Bottles',
      category: 'amenities',
      currentStock: 18,
      minimumStock: 20,
      maximumStock: 60,
      unit: 'bottles',
      cost: 6.25,
      supplier: 'Luxury Amenities Inc.',
      lastRestocked: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      location: 'Amenities Storage',
      status: 'low-stock'
    }
  ];

  // Mock usage logs
  const usageLogs: UsageLog[] = [
    {
      id: 'usage-1',
      supplyId: 'sup-1',
      supplyName: 'Bath Towels',
      roomNumber: '301',
      staffMember: 'Maria Santos',
      quantityUsed: 4,
      usedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      taskId: 'task-1',
      taskType: 'cleaning',
      notes: 'Post-checkout cleaning'
    },
    {
      id: 'usage-2',
      supplyId: 'sup-4',
      supplyName: 'All-Purpose Cleaner',
      roomNumber: '205',
      staffMember: 'John Martinez',
      quantityUsed: 1,
      usedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      taskId: 'task-2',
      taskType: 'cleaning'
    },
    {
      id: 'usage-3',
      supplyId: 'sup-5',
      supplyName: 'Shampoo Bottles',
      roomNumber: '410',
      staffMember: 'Sarah Johnson',
      quantityUsed: 2,
      usedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      taskId: 'task-3',
      taskType: 'amenity'
    }
  ];

  // Mock stock alerts
  const stockAlerts: StockAlert[] = [
    {
      id: 'alert-1',
      supplyId: 'sup-3',
      supplyName: 'Bed Sheets (Queen)',
      alertType: 'out-of-stock',
      message: 'Bed Sheets (Queen) is out of stock. Immediate restocking required.',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      acknowledged: false
    },
    {
      id: 'alert-2',
      supplyId: 'sup-2',
      supplyName: 'Toilet Paper',
      alertType: 'low-stock',
      message: 'Toilet Paper is running low (8 rolls remaining, minimum 15).',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      acknowledged: false
    }
  ];

  // Filter supplies
  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = 
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || supply.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || supply.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-success/10 text-success border-success/20';
      case 'low-stock': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'out-of-stock': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'ordered': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStockPercentage = (supply: Supply) => {
    return Math.round((supply.currentStock / supply.maximumStock) * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bedding': return '🛏️';
      case 'bathroom': return '🚿';
      case 'cleaning': return '🧽';
      case 'amenities': return '🧴';
      case 'maintenance': return '🔧';
      case 'food': return '🍽️';
      default: return '📦';
    }
  };

  const handleViewSupply = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowSupplyDetails(true);
  };

  const handleRecordUsage = (supply: Supply) => {
    setSelectedSupply(supply);
    setShowUsageForm(true);
    setUsageQuantity(1);
    setUsageRoomNumber('');
    setUsageNotes('');
  };

  const handleSubmitUsage = () => {
    if (!selectedSupply || !usageRoomNumber) return;

    console.log('Recording usage:', {
      supplyId: selectedSupply.id,
      roomNumber: usageRoomNumber,
      quantity: usageQuantity,
      notes: usageNotes
    });

    // API call to record usage
    setShowUsageForm(false);
  };

  const handleRestockSupply = (supplyId: string, quantity: number) => {
    console.log('Restocking supply:', supplyId, 'quantity:', quantity);
    // API call to restock supply
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    console.log('Acknowledging alert:', alertId);
    // API call to acknowledge alert
  };

  const unacknowledgedAlerts = stockAlerts.filter(alert => !alert.acknowledged);
  const lowStockItems = supplies.filter(supply => supply.status === 'low-stock' || supply.status === 'out-of-stock');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplies Management</h1>
          <p className="text-muted-foreground">Track inventory and manage supply usage</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Generate Report
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Supply
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-foreground mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-warning-foreground">Supply Alerts</div>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  {unacknowledgedAlerts.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{supplies.filter(s => s.status === 'in-stock').length}</div>
                <div className="text-sm text-muted-foreground">In Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-warning-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{supplies.filter(s => s.status === 'low-stock').length}</div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{supplies.filter(s => s.status === 'out-of-stock').length}</div>
                <div className="text-sm text-muted-foreground">Out of Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">₦{supplies.reduce((total, s) => total + (s.currentStock * s.cost), 0).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search supplies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="bedding">Bedding</SelectItem>
                <SelectItem value="bathroom">Bathroom</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="amenities">Amenities</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Supplies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSupplies.map((supply) => (
          <Card key={supply.id} className="luxury-card">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getCategoryIcon(supply.category)}</div>
                    <div>
                      <div className="font-medium">{supply.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{supply.category}</div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(supply.status)} variant="outline">
                    {supply.status.replace('-', ' ')}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Stock Level</span>
                    <span>{supply.currentStock} / {supply.maximumStock} {supply.unit}</span>
                  </div>
                  <Progress value={getStockPercentage(supply)} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Min: {supply.minimumStock}</span>
                    <span>{getStockPercentage(supply)}% capacity</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cost per unit:</span>
                    <div className="font-medium">₦{supply.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <div className="font-medium">{supply.location}</div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Last restocked: {format(supply.lastRestocked, 'MMM dd, yyyy')}
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleViewSupply(supply)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleRecordUsage(supply)}
                    disabled={supply.currentStock === 0}
                  >
                    Record Usage
                  </Button>
                </div>

                {(supply.status === 'low-stock' || supply.status === 'out-of-stock') && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleRestockSupply(supply.id, supply.minimumStock)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Order Restock
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Form Dialog */}
      <Dialog open={showUsageForm} onOpenChange={setShowUsageForm}>
        <DialogContent>
          {selectedSupply && (
            <>
              <DialogHeader>
                <DialogTitle>Record Supply Usage</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <div className="font-medium">{selectedSupply.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Current stock: {selectedSupply.currentStock} {selectedSupply.unit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Room Number</label>
                    <Input
                      value={usageRoomNumber}
                      onChange={(e) => setUsageRoomNumber(e.target.value)}
                      placeholder="e.g. 301"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity Used</label>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setUsageQuantity(Math.max(1, usageQuantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={usageQuantity}
                        onChange={(e) => setUsageQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="text-center"
                        min="1"
                        max={selectedSupply.currentStock}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setUsageQuantity(Math.min(selectedSupply.currentStock, usageQuantity + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    value={usageNotes}
                    onChange={(e) => setUsageNotes(e.target.value)}
                    placeholder="Add any notes about this usage..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSubmitUsage} className="flex-1">
                    Record Usage
                  </Button>
                  <Button variant="outline" onClick={() => setShowUsageForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Supply Details Dialog */}
      <Dialog open={showSupplyDetails} onOpenChange={setShowSupplyDetails}>
        <DialogContent className="max-w-2xl">
          {selectedSupply && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(selectedSupply.category)}</span>
                  {selectedSupply.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <div className="font-medium capitalize">{selectedSupply.category}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedSupply.status)} variant="outline">
                      {selectedSupply.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Stock:</span>
                    <div className="font-medium">{selectedSupply.currentStock} {selectedSupply.unit}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit Cost:</span>
                    <div className="font-medium">₦{selectedSupply.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Supplier:</span>
                    <div className="font-medium">{selectedSupply.supplier}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <div className="font-medium">{selectedSupply.location}</div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Stock Levels:</span>
                  <div className="mt-2">
                    <Progress value={getStockPercentage(selectedSupply)} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Min: {selectedSupply.minimumStock}</span>
                      <span>Current: {selectedSupply.currentStock}</span>
                      <span>Max: {selectedSupply.maximumStock}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Recent Usage:</span>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {usageLogs
                      .filter(log => log.supplyId === selectedSupply.id)
                      .slice(0, 5)
                      .map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-sm border rounded p-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>Room {log.roomNumber}</span>
                            <span>•</span>
                            <span>{log.quantityUsed} {selectedSupply.unit}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{log.staffMember}</span>
                            <span>•</span>
                            <span>{format(log.usedAt, 'MMM dd, HH:mm')}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleRecordUsage(selectedSupply)} 
                    className="flex items-center gap-2"
                    disabled={selectedSupply.currentStock === 0}
                  >
                    <Minus className="h-4 w-4" />
                    Record Usage
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleRestockSupply(selectedSupply.id, selectedSupply.minimumStock)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Restock
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}