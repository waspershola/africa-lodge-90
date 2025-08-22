import { useState } from 'react';
import { Headphones, MessageSquare, Send, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupportTickets, useUpdateSupportTicket, useBroadcastMessage, useCreateAnnouncement, useAnnouncements, useTenants } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const Support = () => {
  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useSupportTickets();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();
  const { data: tenants } = useTenants();
  const updateTicket = useUpdateSupportTicket();
  const broadcastMessage = useBroadcastMessage();
  const createAnnouncement = useCreateAnnouncement();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'general',
    targetTenants: [],
    isGlobal: true
  });

  if (ticketsLoading) return <LoadingState />;
  if (ticketsError) return <ErrorState />;

  const handleTicketUpdate = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };

  const handleUpdateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      status: formData.get('status'),
      assignedTo: formData.get('assignedTo'),
      priority: formData.get('priority')
    };

    updateTicket.mutate({ id: selectedTicket.id, data });
    setIsTicketDialogOpen(false);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create announcement
    createAnnouncement.mutate({
      title: broadcastForm.title,
      content: broadcastForm.message,
      type: broadcastForm.type,
      targetTenants: broadcastForm.isGlobal ? [] : broadcastForm.targetTenants,
      isGlobal: broadcastForm.isGlobal
    });

    // Send broadcast message
    broadcastMessage.mutate({
      title: broadcastForm.title,
      message: broadcastForm.message,
      targetTenants: broadcastForm.isGlobal ? [] : broadcastForm.targetTenants
    });

    setIsBroadcastDialogOpen(false);
    setBroadcastForm({
      title: '',
      message: '',
      type: 'general',
      targetTenants: [],
      isGlobal: true
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'open': 'bg-red-100 text-red-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'open': AlertCircle,
      'in-progress': Clock,
      'resolved': CheckCircle,
      'closed': CheckCircle
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support Console</h1>
          <p className="text-muted-foreground">Manage support tickets and communicate with tenants</p>
        </div>
        <Button onClick={() => setIsBroadcastDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <MessageSquare className="h-4 w-4 mr-2" />
          Broadcast Message
        </Button>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Headphones className="h-5 w-5" />
                <span>Active Support Tickets</span>
              </CardTitle>
              <CardDescription>
                Manage and respond to tenant support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.data?.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell>{ticket.tenantName}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(ticket.status)}
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{ticket.assignedTo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(ticket.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleTicketUpdate(ticket)}>
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements?.data?.map((announcement: any) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <Badge variant={announcement.isGlobal ? "default" : "secondary"}>
                      {announcement.isGlobal ? "Global" : "Targeted"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {announcement.content}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{announcement.type}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(announcement.status)}>
                        {announcement.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Update Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Support Ticket</DialogTitle>
            <DialogDescription>
              Update ticket status, priority, and assignment
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTicket} className="space-y-4">
            <div>
              <Label>Ticket Details</Label>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="font-medium">{selectedTicket?.subject}</p>
                <p className="text-sm text-muted-foreground">{selectedTicket?.description}</p>
                <p className="text-sm"><strong>Tenant:</strong> {selectedTicket?.tenantName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedTicket?.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue={selectedTicket?.priority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select name="assignedTo" defaultValue={selectedTicket?.assignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support1">Mike Chen</SelectItem>
                  <SelectItem value="support2">Sarah Johnson</SelectItem>
                  <SelectItem value="support3">Lisa Williams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsTicketDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTicket.isPending}>
                Update Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Broadcast Message Dialog */}
      <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Broadcast Message</DialogTitle>
            <DialogDescription>
              Send announcements or notifications to tenants
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                required 
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={broadcastForm.type}
                  onValueChange={(value) => setBroadcastForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="feature">New Feature</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="isGlobal"
                  checked={broadcastForm.isGlobal}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, isGlobal: e.target.checked }))}
                />
                <Label htmlFor="isGlobal">Send to all tenants</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsBroadcastDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={broadcastMessage.isPending || createAnnouncement.isPending}>
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;