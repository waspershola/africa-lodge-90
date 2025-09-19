import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceCharge } from '@/types/billing';
import { format } from 'date-fns';
import { 
  Bed, 
  UtensilsCrossed, 
  Sparkles, 
  Wrench, 
  PartyPopper,
  User,
  Clock
} from 'lucide-react';

interface ServiceSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceCharge[];
}

const getServiceIcon = (type: ServiceCharge['service_type']) => {
  switch (type) {
    case 'room':
      return <Bed className="h-4 w-4" />;
    case 'restaurant':
      return <UtensilsCrossed className="h-4 w-4" />;
    case 'housekeeping':
      return <Sparkles className="h-4 w-4" />;
    case 'maintenance':
      return <Wrench className="h-4 w-4" />;
    case 'events':
      return <PartyPopper className="h-4 w-4" />;
    default:
      return null;
  }
};

const getStatusColor = (status: ServiceCharge['status']) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'pending':
      return 'destructive';
    case 'cancelled':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const ServiceSummaryModal = ({ open, onOpenChange, services }: ServiceSummaryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Service Summary</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getServiceIcon(service.service_type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{service.description}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(service.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                        {service.staff_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {service.staff_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ₦{service.amount.toLocaleString()}
                    </p>
                    <Badge 
                      variant={getStatusColor(service.status)}
                      className="mt-1"
                    >
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No services found for this guest.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};