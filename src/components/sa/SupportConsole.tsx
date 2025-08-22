import { motion } from 'framer-motion';
import { 
  HeadphonesIcon, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSupportTickets } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

export default function SupportConsole() {
  const { data: ticketsData, isLoading, error, refetch } = useSupportTickets();

  if (isLoading) return <LoadingState message="Loading support tickets..." />;
  if (error) return <ErrorState message="Failed to load support tickets" onRetry={refetch} />;

  const tickets = ticketsData?.data || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger/10 text-danger border-danger/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-danger/10 text-danger border-danger/20';
      case 'in-progress': return 'bg-warning/10 text-warning border-warning/20';
      case 'resolved': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return AlertTriangle;
      case 'in-progress': return Clock;
      case 'resolved': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-accent" />
            Support Console
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HeadphonesIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No active support tickets
            </div>
          ) : (
            tickets.map((ticket: any) => {
              const StatusIcon = getStatusIcon(ticket.status);
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <StatusIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{ticket.subject}</h4>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">{ticket.tenantName}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </motion.div>
              );
            })
          )}
        </div>
        
        {tickets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-danger">
                  {tickets.filter((t: any) => t.status === 'open').length}
                </div>
                <div className="text-xs text-muted-foreground">Open</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning">
                  {tickets.filter((t: any) => t.status === 'in-progress').length}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-lg font-bold text-success">
                  {tickets.filter((t: any) => t.status === 'resolved').length}
                </div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}