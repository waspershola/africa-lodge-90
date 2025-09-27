import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, Filter, Eye, Clock, CheckCircle, AlertTriangle } from "lucide-react";

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
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7');
  const [selectedAlert, setSelectedAlert] = useState<StaffAlert | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, [dateFilter]);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, statusFilter, priorityFilter]);

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

      // Calculate date range
      const daysAgo = parseInt(dateFilter);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('staff_alerts')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
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

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.alert_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.priority === priorityFilter);
    }

    setFilteredAlerts(filtered);
  };

  const updateAlertStatus = async (alertId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = { status: newStatus };

      if (newStatus === 'acknowledged') {
        updateData.acknowledged_by = user.id;
        updateData.acknowledged_at = new Date().toISOString();
      } else if (newStatus === 'resolved') {
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('staff_alerts')
        .update(updateData)
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Alert marked as ${newStatus}`,
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive",
      });
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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last Day</SelectItem>
                  <SelectItem value="7">Last Week</SelectItem>
                  <SelectItem value="30">Last Month</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
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
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'No staff alerts have been generated yet'
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
                                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div>
                                      <strong>Created:</strong> {new Date(selectedAlert.created_at).toLocaleString()}
                                    </div>
                                    {selectedAlert.acknowledged_at && (
                                      <div>
                                        <strong>Acknowledged:</strong> {new Date(selectedAlert.acknowledged_at).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {alert.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {alert.status === 'acknowledged' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAlertStatus(alert.id, 'resolved')}
                            >
                              Resolve
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