import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  User, 
  FileText,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

export interface AuditEntry {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  entity_type: 'order' | 'menu_item' | 'payment' | 'inventory' | 'user' | 'system';
  entity_id: string;
  entity_name?: string;
  action: string;
  old_value?: any;
  new_value?: any;
  metadata?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
}

interface AuditLogProps {
  entries?: AuditEntry[];
  isLoading?: boolean;
  showFilters?: boolean;
  entityId?: string; // To show logs for specific entity
}

export default function AuditLog({ 
  entries = [], 
  isLoading = false, 
  showFilters = true,
  entityId 
}: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Mock data for development
  const mockEntries: AuditEntry[] = [
    {
      id: 'audit-1',
      tenant_id: 'hotel-1',
      actor_id: 'user-123',
      actor_name: 'John Doe',
      actor_role: 'staff',
      entity_type: 'order',
      entity_id: 'ord-123',
      entity_name: 'Order #ORD-001',
      action: 'status_changed',
      old_value: 'pending',
      new_value: 'accepted',
      timestamp: new Date().toISOString(),
      success: true
    },
    {
      id: 'audit-2',
      tenant_id: 'hotel-1',
      actor_id: 'user-456',
      actor_name: 'Jane Smith',
      actor_role: 'manager',
      entity_type: 'menu_item',
      entity_id: 'item-789',
      entity_name: 'Grilled Chicken',
      action: 'price_changed',
      old_value: 2500,
      new_value: 2750,
      metadata: { reason: 'Ingredient cost increase' },
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      success: true
    },
    {
      id: 'audit-3',
      tenant_id: 'hotel-1',
      actor_id: 'user-789',
      actor_name: 'Mike Chef',
      actor_role: 'chef',
      entity_type: 'order',
      entity_id: 'ord-124',
      entity_name: 'Order #ORD-002',
      action: 'item_completed',
      old_value: 'preparing',
      new_value: 'ready',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      success: true
    }
  ];

  const auditEntries = entries.length > 0 ? entries : mockEntries;

  // Filter entries
  const filteredEntries = auditEntries.filter(entry => {
    if (entityId && entry.entity_id !== entityId) return false;
    
    const matchesSearch = searchTerm === '' || 
      entry.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntityType = entityTypeFilter === 'all' || entry.entity_type === entityTypeFilter;
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    
    return matchesSearch && matchesEntityType && matchesAction;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('created')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes('deleted') || action.includes('cancelled')) return <X className="h-4 w-4 text-red-500" />;
    if (action.includes('changed') || action.includes('updated')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (action.includes('payment')) return <DollarSign className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'order': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'menu_item': return <Package className="h-4 w-4 text-green-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'user': return <User className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatValue = (value: any, action: string) => {
    if (action.includes('price') && typeof value === 'number') {
      return `₦${(value / 100).toFixed(2)}`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, entity, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="menu_item">Menu Items</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="status_changed">Status Changed</SelectItem>
                  <SelectItem value="price_changed">Price Changed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit Entries ({filteredEntries.length})</span>
            <Badge variant="outline">
              {entityId ? 'Entity Specific' : 'All Activities'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredEntries.map(entry => (
                <Card key={entry.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getActionIcon(entry.action)}
                          {getEntityIcon(entry.entity_type)}
                          <span className="font-medium">{entry.action.replace('_', ' ')}</span>
                          <Badge variant="outline" className="text-xs">
                            {entry.entity_type}
                          </Badge>
                          {!entry.success && (
                            <Badge variant="destructive" className="text-xs">
                              Failed
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Actor</p>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{entry.actor_name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {entry.actor_role}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground">Entity</p>
                            <p className="font-medium">{entry.entity_name || entry.entity_id}</p>
                          </div>
                        </div>

                        {(entry.old_value !== undefined || entry.new_value !== undefined) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            {entry.old_value !== undefined && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs font-medium text-red-700">Before</p>
                                <p className="text-sm font-mono text-red-900">
                                  {formatValue(entry.old_value, entry.action)}
                                </p>
                              </div>
                            )}
                            
                            {entry.new_value !== undefined && (
                              <div className="p-2 bg-green-50 border border-green-200 rounded">
                                <p className="text-xs font-medium text-green-700">After</p>
                                <p className="text-sm font-mono text-green-900">
                                  {formatValue(entry.new_value, entry.action)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                          {entry.ip_address && (
                            <span>IP: {entry.ip_address}</span>
                          )}
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Entry Details</DialogTitle>
                          </DialogHeader>
                          
                          {selectedEntry && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Entry ID:</strong> {selectedEntry.id}
                                </div>
                                <div>
                                  <strong>Timestamp:</strong> {new Date(selectedEntry.timestamp).toLocaleString()}
                                </div>
                                <div>
                                  <strong>Actor:</strong> {selectedEntry.actor_name} ({selectedEntry.actor_role})
                                </div>
                                <div>
                                  <strong>Entity:</strong> {selectedEntry.entity_name || selectedEntry.entity_id}
                                </div>
                              </div>
                              
                              {selectedEntry.metadata && (
                                <div>
                                  <strong>Metadata:</strong>
                                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {selectedEntry.error_message && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded">
                                  <strong className="text-red-700">Error:</strong>
                                  <p className="text-red-600 text-sm mt-1">{selectedEntry.error_message}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit entries found matching your criteria.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}