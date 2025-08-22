import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  ExternalLink,
  Eye,
  MessageCircle,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useSupportTickets, useCreateSupportTicket, useUpdateSupportTicket, useImpersonateTenant } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

const ticketPriorities = [
  { id: 'low', name: 'Low', color: 'bg-success/10 text-success border-success/20' },
  { id: 'medium', name: 'Medium', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'high', name: 'High', color: 'bg-danger/10 text-danger border-danger/20' },
  { id: 'urgent', name: 'Urgent', color: 'bg-primary/10 text-primary border-primary/20' }
];

const ticketStatuses = [
  { id: 'open', name: 'Open', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'in_progress', name: 'In Progress', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'resolved', name: 'Resolved', color: 'bg-success/10 text-success border-success/20' },
  { id: 'closed', name: 'Closed', color: 'bg-muted/10 text-muted-foreground border-muted/20' }
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Support() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const { toast } = useToast();

  const { data: ticketsData, isLoading, error, refetch } = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const updateTicket = useUpdateSupportTicket();
  const impersonateTenant = useImpersonateTenant();

  if (isLoading) return <LoadingState message="Loading support tickets..." />;
  if (error) return <ErrorState message="Failed to load support tickets" onRetry={refetch} />;

  const tickets = ticketsData?.data || [];
  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateTicket = async (data: any) => {
    try {
      await createTicket.mutateAsync(data);
      toast({ title: "Support ticket created successfully" });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to create support ticket", variant: "destructive" });
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await updateTicket.mutateAsync({ id: ticketId, status });
      toast({ title: "Ticket status updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update ticket status", variant: "destructive" });
    }
  };

  const handleImpersonateTenant = async (tenantId: string) => {
    try {
      await impersonateTenant.mutateAsync(tenantId);
      toast({ title: "Impersonation mode activated" });
      // In a real app, this would redirect to the tenant's dashboard
      window.open(`/hotel/dashboard?impersonate=${tenantId}`, '_blank');
    } catch (error) {
      toast({ title: "Failed to impersonate tenant", variant: "destructive" });
    }
  };

  const getPriorityStyle = (priority: string) => {
    return ticketPriorities.find(p => p.id === priority)?.color || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  const getStatusStyle = (status: string) => {
    return ticketStatuses.find(s => s.id === status)?.color || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold display-heading text-gradient">Support Console</h1>
          <p className="text-muted-foreground mt-2">Manage support tickets and tenant assistance</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm onSubmit={handleCreateTicket} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {ticketStatuses.map((status) => {
          const count = tickets.filter((t: any) => t.status === status.id).length;
          return (
            <Card key={status.id} className="modern-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {status.id === 'open' && <Clock className="h-4 w-4" />}
                  {status.id === 'in_progress' && <AlertCircle className="h-4 w-4" />}
                  {status.id === 'resolved' && <CheckCircle className="h-4 w-4" />}
                  {status.id === 'closed' && <CheckCircle className="h-4 w-4" />}
                  {status.name} Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{count}</div>
                <Badge className={status.color + " mt-2"}>
                  {count > 0 ? 'Active' : 'None'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={fadeIn} className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ticketStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {ticketPriorities.map((priority) => (
              <SelectItem key={priority.id} value={priority.id}>
                {priority.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Support Tickets Table */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{ticket.tenantName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityStyle(ticket.priority)}>
                        {ticketPriorities.find(p => p.id === ticket.priority)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={ticket.status} 
                        onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImpersonateTenant(ticket.tenantId)}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Impersonate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <div className="font-medium">{selectedTicket.subject}</div>
                </div>
                <div>
                  <Label>Hotel</Label>
                  <div className="font-medium">{selectedTicket.tenantName}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={getPriorityStyle(selectedTicket.priority)}>
                    {ticketPriorities.find(p => p.id === selectedTicket.priority)?.name}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusStyle(selectedTicket.status)}>
                    {ticketStatuses.find(s => s.id === selectedTicket.status)?.name}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  {selectedTicket.description}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleImpersonateTenant(selectedTicket.tenantId)}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Hotel Dashboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function TicketForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    tenantId: '',
    priority: 'medium',
    status: 'open'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            placeholder="Brief description of the issue"
          />
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData({...formData, priority: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ticketPriorities.map((priority) => (
                <SelectItem key={priority.id} value={priority.id}>
                  {priority.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Detailed description of the issue or request..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit">Create Ticket</Button>
      </div>
    </form>
  );
}