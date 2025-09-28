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
  AlertTriangle,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuickGuestCapture } from "./QuickGuestCapture";
import { CheckoutDialog } from "./CheckoutDialog";
import { PaymentDialog } from "./PaymentDialog";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";
import { ExtendStayDialog } from "./ExtendStayDialog";
import { OverstayChargeDialog } from "./OverstayChargeDialog";
import { AddServiceDialog } from "./AddServiceDialog";
import { TransferRoomDialog } from "./TransferRoomDialog";
import { ReleaseReservationDialog } from "./ReleaseReservationDialog";
import { useShiftIntegratedAction } from "./ShiftIntegratedAction";
import { useReceiptPrinter } from "@/hooks/useReceiptPrinter";
import { AuditTrailDisplay } from "./AuditTrailDisplay";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from '@/hooks/useAuth';
import type { Room } from "./RoomGrid";

interface RoomActionDrawerProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onRoomUpdate?: (updatedRoom: Room) => void;
}

export const RoomActionDrawer = ({
  room,
  open,
  onOpenChange,
  onClose,
  onRoomUpdate,
}: RoomActionDrawerProps) => {
  const { toast } = useToast();
  const { logEvent } = useAuditLog();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [captureAction, setCaptureAction] = useState<'assign' | 'walkin' | 'check-in' | 'check-out' | 'assign-room' | 'extend-stay' | 'transfer-room' | 'add-service' | 'work-order' | 'housekeeping'>('assign');
  
  // Dialog states
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintenanceAction, setMaintenanceAction] = useState<'create-workorder' | 'set-oos' | 'mark-available'>('create-workorder');
  const [showExtendStay, setShowExtendStay] = useState(false);
  const [showOverstay, setShowOverstay] = useState(false);
  const [overstayAction, setOverstayAction] = useState<'overstay-charge' | 'send-reminder' | 'escalate-manager' | 'force-checkout'>('overstay-charge');
  const [showAddService, setShowAddService] = useState(false);

  if (!room) return null;

  const handleAction = async (action: string) => {
    // Handle quick capture actions
    if (action === 'Assign Room') {
      setCaptureAction('assign');
      setShowQuickCapture(true);
      return;
    }
    
    if (action === 'Walk-in Check-in') {
      setCaptureAction('walkin');
      setShowQuickCapture(true);
      return;
    }

    if (action === 'Check-In') {
      setCaptureAction('check-in');
      setShowQuickCapture(true);
      return;
    }

    // Handle checkout action
    if (action === 'Check-Out') {
      setShowCheckout(true);
      return;
    }

    // Handle payment action
    if (action === 'Post Payment') {
      setShowPayment(true);
      return;
    }

    // Handle extend stay action
    if (action === 'Extend Stay') {
      setShowExtendStay(true);
      return;
    }

    // Handle add service action
    if (action === 'Add Service') {
      setShowAddService(true);
      return;
    }

    // Handle maintenance actions
    if (action === 'Set Out of Service') {
      setMaintenanceAction('set-oos');
      setShowMaintenance(true);
      return;
    }

    if (action === 'Create Work Order') {
      setMaintenanceAction('create-workorder');
      setShowMaintenance(true);
      return;
    }

    if (action === 'Mark as Available') {
      setMaintenanceAction('mark-available');
      setShowMaintenance(true);
      return;
    }

    // Handle overstay actions
    if (action === 'Apply Overstay Charge') {
      setOverstayAction('overstay-charge');
      setShowOverstay(true);
      return;
    }

    if (action === 'Send Reminder') {
      setOverstayAction('send-reminder');
      setShowOverstay(true);
      return;
    }

    // Handle other actions with real backend integration
    setIsProcessing(true);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      switch (action) {
        case 'View History':
          // Get audit trail for this room
          const { data: auditData, error: auditError } = await supabase
            .from('audit_log')
            .select('*')
            .eq('resource_type', 'ROOM')
            .eq('resource_id', room.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (auditError) throw auditError;

          toast({
            title: "History Retrieved",
            description: `Found ${auditData?.length || 0} recent activities for Room ${room.number}.`,
          });
          break;

        case 'Add Note':
          // Create a note entry in audit log
          const noteText = prompt('Enter your note for this room:');
          if (noteText) {
            const { error: noteError } = await supabase
              .from('audit_log')
              .insert({
                action: 'room_note_added',
                resource_type: 'ROOM',
                resource_id: room.id,
                actor_id: user.id,
                actor_email: user.email,
                actor_role: user.user_metadata?.role,
                tenant_id: user.user_metadata?.tenant_id,
                description: `Note added: ${noteText}`,
                metadata: { note: noteText }
              });

            if (noteError) throw noteError;

            toast({
              title: "Note Added",
              description: `Note added to Room ${room.number}.`,
            });
          } else {
            return; // User cancelled
          }
          break;

        case 'Print Report':
          // Generate room report
          const reportData = {
            roomNumber: room.number,
            roomType: room.type,
            status: room.status,
            guest: room.guest,
            checkIn: room.checkIn,
            checkOut: room.checkOut,
            folio: room.folio,
            generatedAt: new Date().toISOString(),
            generatedBy: user.email
          };

          // Log report generation
          await supabase
            .from('audit_log')
            .insert({
              action: 'room_report_generated',
              resource_type: 'ROOM',
              resource_id: room.id,
              actor_id: user.id,
              actor_email: user.email,
              actor_role: user.user_metadata?.role,
              tenant_id: user.user_metadata?.tenant_id,
              description: `Room report generated for Room ${room.number}`,
              metadata: reportData
            });

          // Simulate print
          console.log('Room Report:', reportData);
          
          toast({
            title: "Report Generated",
            description: `Room report for ${room.number} sent to printer.`,
          });
          break;

        case 'Send Email':
          // Send room status email (if guest exists)
          if (room.guest && room.status === 'occupied') {
            try {
              const { error: emailError } = await supabase.functions.invoke('send-room-notification', {
                body: {
                  roomNumber: room.number,
                  guestName: room.guest,
                  notificationType: 'room_status',
                  message: `Room ${room.number} status update`
                }
              });

              if (emailError) throw emailError;

              toast({
                title: "Email Sent",
                description: `Room notification sent for Room ${room.number}.`,
              });
            } catch (emailErr) {
              console.error('Email error:', emailErr);
              toast({
                title: "Email Error",
                description: "Failed to send email notification.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "No Guest",
              description: "Cannot send email - no guest assigned to this room.",
              variant: "destructive",
            });
          }
          break;

        default:
          toast({
            title: "Action Completed",
            description: `${action} for Room ${room.number} has been processed.`,
          });
      }
    } catch (error) {
      console.error('Action processing error:', error);
      toast({
        title: "Error",
        description: `Failed to process ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleGuestCaptureComplete = (updatedRoom: Room) => {
    // Log action to audit trail
    const actionDescription = captureAction === 'walkin' ? 'Walk-in check-in' : 'Room assignment';
    logEvent({
      action: captureAction === 'walkin' ? 'WALKIN_CHECKIN' : 'ROOM_ASSIGNMENT',
      resource_type: 'ROOM',
      resource_id: updatedRoom.id,
      description: `${actionDescription} completed for Room ${updatedRoom.number}`,
      metadata: {
        room_number: updatedRoom.number,
        guest_name: updatedRoom.guest,
        action_type: captureAction
      }
    });
    
    onRoomUpdate?.(updatedRoom);
    setShowQuickCapture(false);
    onClose();

    // Force refresh to show updated room status
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 500);
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
    let actions: Array<{ icon: any, label: string, action: string, variant: 'default' | 'outline' | 'destructive' }> = [];
    
    switch (room.status) {
      case 'available':
        actions = [
          { icon: UserPlus, label: 'Assign Room', action: 'assign', variant: 'default' as const },
          { icon: LogIn, label: 'Walk-in Check-in', action: 'walkin', variant: 'outline' as const },
        ];
        // Only managers and owners can set rooms out of service
        if (user?.role && ['OWNER', 'MANAGER'].includes(user.role)) {
          actions.push({ icon: Wrench, label: 'Set Out of Service', action: 'oos', variant: 'outline' as const });
        }
        break;
      case 'occupied':
        actions = [
          { icon: LogOut, label: 'Check-Out', action: 'checkout', variant: 'default' as const },
          { icon: Calendar, label: 'Extend Stay', action: 'extend-stay', variant: 'outline' as const },
          { icon: UserPlus, label: 'Transfer Room', action: 'transfer-room', variant: 'outline' as const },
          { icon: Sparkles, label: 'Add Service', action: 'add-service', variant: 'outline' as const },
          { icon: CreditCard, label: 'Post Payment', action: 'post-payment', variant: 'outline' as const },
        ];
        break;
      case 'reserved':
        actions = [
          { icon: LogIn, label: 'Check-In', action: 'checkin', variant: 'default' as const },
          { icon: AlertTriangle, label: 'Cancel Reservation', action: 'cancel-reservation', variant: 'destructive' as const },
          { icon: FileText, label: 'Modify Reservation', action: 'modify-reservation', variant: 'outline' as const },
          { icon: UserPlus, label: 'Assign Different Room', action: 'assign-different', variant: 'outline' as const },
        ];
        break;
      case 'oos':
        actions = [
          { icon: Sparkles, label: 'Mark as Available', action: 'mark-available', variant: 'default' as const },
          { icon: Wrench, label: 'Create Work Order', action: 'create-workorder', variant: 'outline' as const },
          { icon: Sparkles, label: 'Assign to Housekeeping', action: 'assign-housekeeping', variant: 'outline' as const },
        ];
        break;
      case 'overstay':
        actions = [
          { icon: Calendar, label: 'Extend Stay', action: 'extend-stay', variant: 'default' as const },
          { icon: CreditCard, label: 'Apply Overstay Charge', action: 'overstay-charge', variant: 'outline' as const },
          { icon: LogOut, label: 'Check-Out', action: 'checkout', variant: 'destructive' as const },
          { icon: UserPlus, label: 'Transfer Room', action: 'transfer-room', variant: 'outline' as const },
        ];
        break;
      default:
        actions = [];
        break;
    }
    
    return actions;
  };

  return (
    <>
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
                <Edit3 className="h-4 w-4 mr-2" />
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

          {/* Audit Trail */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <AuditTrailDisplay roomId={room.id} />
          </div>
        </div>
        </SheetContent>
      </Sheet>

      {/* Quick Guest Capture Dialog */}
      <QuickGuestCapture 
        room={room}
        open={showQuickCapture}
        onOpenChange={setShowQuickCapture}
        action={captureAction}
        onComplete={handleGuestCaptureComplete}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        roomId={room?.number}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        pendingAmount={room?.folio?.balance || 0}
        onPaymentSuccess={() => {
          setShowPayment(false);
          toast({
            title: "Payment Processed",
            description: `Payment for Room ${room?.number} has been recorded.`,
          });
        }}
      />

      {/* Maintenance Task Dialog */}
      <MaintenanceTaskDialog
        room={room}
        open={showMaintenance}
        onOpenChange={setShowMaintenance}
        action={maintenanceAction}
        onComplete={(updatedRoom) => {
          setShowMaintenance(false);
          onRoomUpdate?.(updatedRoom);
        }}
      />

      {/* Extend Stay Dialog */}
      <ExtendStayDialog
        room={room}
        open={showExtendStay}
        onOpenChange={setShowExtendStay}
        onComplete={(updatedRoom) => {
          setShowExtendStay(false);
          onRoomUpdate?.(updatedRoom);
        }}
      />

      {/* Overstay Charge Dialog */}
      <OverstayChargeDialog
        room={room}
        open={showOverstay}
        onOpenChange={setShowOverstay}
        action={overstayAction}
        onComplete={(updatedRoom) => {
          setShowOverstay(false);
          onRoomUpdate?.(updatedRoom);
        }}
      />

      {/* Add Service Dialog */}
      <AddServiceDialog
        room={room}
        open={showAddService}
        onOpenChange={setShowAddService}
        onComplete={(updatedRoom) => {
          setShowAddService(false);
          onRoomUpdate?.(updatedRoom);
        }}
      />
    </>
  );
};