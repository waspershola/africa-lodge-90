import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogIn,
  LogOut,
  UserPlus,
  CreditCard,
  FileText,
  Wrench,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  IdCard,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "./RoomGrid";

interface RoomActionDrawerProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RoomActionDrawer = ({
  room,
  open,
  onOpenChange,
  onClose,
}: RoomActionDrawerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!room) return null;

  const handleAction = async (action: string) => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Action Completed",
      description: `${action} for Room ${room.number} has been processed.`,
    });
    
    setIsProcessing(false);
    onClose();
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'text-success';
      case 'occupied': return 'text-destructive';
      case 'reserved': return 'text-blue-600';
      case 'oos': return 'text-orange-600';
      case 'overstay': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  const getAvailableActions = () => {
    switch (room.status) {
      case 'available':
        return [
          { icon: UserPlus, label: 'Assign Room', action: 'assign', variant: 'default' as const },
          { icon: LogIn, label: 'Walk-in Check-in', action: 'walkin', variant: 'outline' as const },
          { icon: Wrench, label: 'Set Out of Service', action: 'oos', variant: 'outline' as const },
        ];
      case 'occupied':
        return [
          { icon: LogOut, label: 'Check-out', action: 'checkout', variant: 'default' as const },
          { icon: FileText, label: 'Open Folio', action: 'folio', variant: 'outline' as const },
          { icon: CreditCard, label: 'Collect Payment', action: 'payment', variant: 'outline' as const },
        ];
      case 'reserved':
        return [
          { icon: LogIn, label: 'Check-in Guest', action: 'checkin', variant: 'default' as const },
          { icon: FileText, label: 'View Reservation', action: 'reservation', variant: 'outline' as const },
          { icon: Phone, label: 'Contact Guest', action: 'contact', variant: 'outline' as const },
        ];
      case 'oos':
        return [
          { icon: Wrench, label: 'Update Work Order', action: 'workorder', variant: 'default' as const },
          { icon: UserPlus, label: 'Mark Available', action: 'available', variant: 'outline' as const },
        ];
      case 'overstay':
        return [
          { icon: LogOut, label: 'Force Check-out', action: 'force-checkout', variant: 'destructive' as const },
          { icon: CreditCard, label: 'Collect Payment', action: 'payment', variant: 'default' as const },
          { icon: Phone, label: 'Contact Guest', action: 'contact', variant: 'outline' as const },
        ];
      default:
        return [];
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span>Room {room.number}</span>
            <Badge className={getStatusColor(room.status)}>
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {room.name} • {room.type}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Guest Information */}
          {room.guest && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  Current Guest
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{room.guest}</p>
                  {room.checkIn && (
                    <p className="text-sm text-muted-foreground">
                      Checked in: {new Date(room.checkIn).toLocaleDateString()}
                    </p>
                  )}
                  {room.checkOut && (
                    <p className="text-sm text-muted-foreground">
                      Expected checkout: {new Date(room.checkOut).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Folio Information */}
          {room.folio && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Folio Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    ₦{room.folio.balance.toLocaleString()}
                  </span>
                  <Badge 
                    variant={room.folio.isPaid ? 'default' : 'destructive'}
                    className={room.folio.isPaid ? 'bg-success text-success-foreground' : ''}
                  >
                    {room.folio.isPaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts & Issues */}
          {Object.values(room.alerts).some(Boolean) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Alerts & Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {room.alerts.cleaning && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Cleaning required</span>
                  </div>
                )}
                {room.alerts.depositPending && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-yellow-500" />
                    <span>Deposit payment pending</span>
                  </div>
                )}
                {room.alerts.idMissing && (
                  <div className="flex items-center gap-2 text-sm">
                    <IdCard className="h-4 w-4 text-red-500" />
                    <span>Guest ID documentation missing</span>
                  </div>
                )}
                {room.alerts.maintenance && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-orange-500" />
                    <span>Maintenance work required</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Available Actions */}
          <div className="space-y-3">
            <h3 className="font-medium">Available Actions</h3>
            <div className="space-y-2">
              {getAvailableActions().map((actionItem, index) => (
                <Button
                  key={index}
                  variant={actionItem.variant}
                  className="w-full justify-start gap-3 h-auto py-3"
                  disabled={isProcessing}
                  onClick={() => handleAction(actionItem.label)}
                >
                  <actionItem.icon className="h-4 w-4" />
                  <span>{actionItem.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('View History')}
                disabled={isProcessing}
              >
                <FileText className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('Add Note')}
                disabled={isProcessing}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('Print Report')}
                disabled={isProcessing}
              >
                <FileText className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction('Send Email')}
                disabled={isProcessing}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};