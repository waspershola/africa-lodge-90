import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  created_at: string;
}

export function AlertHistory() {
  const [alerts] = useState<StaffAlert[]>([]);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<StaffAlert | null>(null);
  const { toast } = useToast();

  const markAsRead = async (alertId: string) => {
    // TODO: Enable after migration is approved
    toast({ title: "Info", description: "Database migration pending approval" });
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
    toast({ title: "Info", description: "Export functionality pending migration approval" });
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
          <CardTitle>Staff Alerts ({alerts.length})</CardTitle>
          <CardDescription>
            Complete history of staff alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                Database migration is pending approval. Alerts will appear here once the system is active.
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
                  {alerts.map((alert) => (
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
                            {alert.alert_type}
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
                            {alert.priority}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-muted-foreground max-w-xs truncate">
                            {alert.message}
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
                            {alert.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {alert.channels?.map((channel, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
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
                                    <p className="text-sm">{selectedAlert.alert_type}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <Badge variant="outline">{selectedAlert.priority}</Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Title</Label>
                                  <p className="text-sm">{selectedAlert.title}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Message</Label>
                                  <p className="text-sm bg-muted p-2 rounded">{selectedAlert.message}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="flex items-center space-x-2">
                                      {getStatusIcon(selectedAlert.status)}
                                      <span className="text-sm">{selectedAlert.status}</span>
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
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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