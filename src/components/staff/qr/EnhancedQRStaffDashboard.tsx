import React, { useState } from 'react';
import { useQRStaffManagement } from '@/hooks/useQRStaffManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { BulkActionsBar } from './BulkActionsBar';
import { 
  Clock, 
  CheckCircle, 
  MapPin, 
  AlertTriangle,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';

export function EnhancedQRStaffDashboard() {
  const {
    requests,
    staffMembers,
    selectedRequests,
    isLoading,
    stats,
    assignRequest,
    bulkAction,
    updateStatus,
    toggleRequestSelection,
    selectAll,
    clearSelection,
  } = useQRStaffManagement();

  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    const searchMatch = 
      searchQuery === '' ||
      request.request_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.rooms?.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      assigned: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      accepted: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      preparing: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      on_route: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
      completed: 'bg-green-500/10 text-green-700 border-green-500/20',
      cancelled: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    };
    return colors[status] || colors.cancelled;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') 
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (priority === 'normal') 
      return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-green-500" />;
  };

  const handleBulkAssign = (staffId: string, notes?: string) => {
    bulkAction.mutate({
      requestIds: Array.from(selectedRequests),
      action: 'assign',
      assigneeId: staffId,
      notes,
    });
  };

  const handleBulkComplete = (notes?: string) => {
    bulkAction.mutate({
      requestIds: Array.from(selectedRequests),
      action: 'complete',
      notes,
    });
  };

  const handleBulkCancel = (notes?: string) => {
    bulkAction.mutate({
      requestIds: Array.from(selectedRequests),
      action: 'cancel',
      notes,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR Service Requests</h1>
          <p className="text-muted-foreground">
            Manage and assign guest requests efficiently
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.completed}
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room number or request type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs with Requests */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Assigned ({stats.assigned})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            In Progress ({stats.inProgress})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              {filteredRequests.length > 0 && (
                <div className="flex items-center gap-2 px-2">
                  <Checkbox
                    checked={selectedRequests.size === filteredRequests.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll(filteredRequests.map((r) => r.id));
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({filteredRequests.length})
                  </span>
                </div>
              )}

              {/* Request Cards */}
              {filteredRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={() => toggleRequestSelection(request.id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(request.priority)}
                          <h3 className="font-semibold capitalize">
                            {request.request_type.replace('_', ' ')}
                          </h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {request.rooms?.room_number || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {request.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                            {request.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              assignRequest.mutate({
                                requestId: request.id,
                                staffId: staffMembers[0]?.id || '',
                              });
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {['assigned', 'accepted', 'preparing'].includes(request.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus.mutate({
                                requestId: request.id,
                                status: 'completed',
                              });
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedRequests.size}
        staffMembers={staffMembers}
        onAssign={handleBulkAssign}
        onComplete={handleBulkComplete}
        onCancel={handleBulkCancel}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
