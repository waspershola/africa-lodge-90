// @ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, AlertTriangle, Search, Filter, Download, Eye } from "lucide-react";

interface StaffAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  priority: string;
  channels: string[];
  status: string;
  triggered_by?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  metadata?: any;
}

export function AlertHistory() {
  const [alerts, setAlerts] = useState<StaffAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<StaffAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<StaffAlert | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, statusFilter, typeFilter]);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      let query = supabase
        .from('staff_alerts')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('alert_type', typeFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alert history:', error);
      toast({
        title: "Error",
        description: "Failed to load alert history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.alert_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.alert_type === typeFilter);
    }

    setFilteredAlerts(filtered);
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('staff_alerts')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      toast({ title: "Success", description: "Alert marked as read" });
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'acknowledged':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportAlerts = () => {
    const csvContent = [
      ['Date', 'Type', 'Title', 'Priority', 'Status', 'Channels', 'Message'].join(','),
      ...filteredAlerts.map(alert => [
        new Date(alert.created_at).toLocaleString(),
        alert.alert_type || 'N/A',
        alert.title || 'N/A',
        alert.priority || 'N/A',
        alert.status || 'N/A',
        alert.channels?.join(';') || 'N/A',
        alert.message?.substring(0, 100).replace(/,/g, ';') || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center">Loading alert history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alert History</h2>
          <p className="text-muted-foreground">View and manage all staff alerts and notifications</p>
        </div>
        <Button onClick={exportAlerts} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Alert Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="guest_issue">Guest Issue</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Alerts ({filteredAlerts.length})</CardTitle>
          <CardDescription>
            Complete history of staff alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'No staff alerts have been generated yet. Configure alert rules to start receiving notifications.'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type & Priority</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(alert.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(alert.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {alert.alert_type || 'system'}
                          </Badge>
                          <Badge 
                            variant={
                              alert.priority === 'critical' || alert.priority === 'high' 
                                ? 'destructive' : 
                              alert.priority === 'medium' 
                                ? 'default' : 
                                'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.priority || 'medium'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{alert.title || 'Staff Alert'}</div>
                          <div className="text-muted-foreground max-w-xs truncate">
                            {alert.message || 'No message'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(alert.status)}
                          <Badge 
                            variant={
                              alert.status === 'resolved' ? 'default' : 
                              alert.status === 'acknowledged' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {alert.status || 'pending'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {alert.channels?.map((channel, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          )) || <span className="text-xs text-muted-foreground">No channels</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAlert(alert)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Alert Details</DialogTitle>
                                <DialogDescription>
                                  Complete information about this staff alert
                                </DialogDescription>
                              </DialogHeader>
                              {selectedAlert && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Alert Type</Label>
                                      <p className="text-sm">{selectedAlert.alert_type || 'System'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Priority</Label>
                                      <Badge 
                                        variant={
                                          selectedAlert.priority === 'critical' || selectedAlert.priority === 'high' 
                                            ? 'destructive' : 
                                          selectedAlert.priority === 'medium' 
                                            ? 'default' : 
                                            'secondary'
                                        }
                                      >
                                        {selectedAlert.priority || 'medium'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Title</Label>
                                    <p className="text-sm">{selectedAlert.title || 'Staff Alert'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Message</Label>
                                    <p className="text-sm bg-muted p-2 rounded">
                                      {selectedAlert.message || 'No message provided'}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Status</Label>
                                      <div className="flex items-center space-x-2">
                                        {getStatusIcon(selectedAlert.status)}
                                        <span className="text-sm">{selectedAlert.status || 'pending'}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Channels</Label>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedAlert.channels?.map((channel, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {channel}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Created</Label>
                                      <p className="text-sm">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Acknowledged</Label>
                                      <p className="text-sm">
                                        {selectedAlert.acknowledged_at 
                                          ? new Date(selectedAlert.acknowledged_at).toLocaleString()
                                          : 'Not acknowledged'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {alert.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}