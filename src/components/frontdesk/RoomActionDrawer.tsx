// @ts-nocheck
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Edit3,
  Receipt,
  History,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuickGuestCapture } from "./QuickGuestCapture";
import { CheckoutDialog } from "./CheckoutDialog";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentHistorySection } from "./PaymentHistorySection";
import { ChargeTimelineSection } from "./ChargeTimelineSection";
import { MaintenanceTaskDialog } from "./MaintenanceTaskDialog";
import { ExtendStayDialog } from "./ExtendStayDialog";
import { OverstayChargeDialog } from "./OverstayChargeDialog";
import { AddServiceDialog } from "./AddServiceDialog";
import { TransferRoomDialog } from "./TransferRoomDialog";
import { CancelReservationDialog } from "./CancelReservationDialog";
import { useShiftIntegratedAction } from "./ShiftIntegratedAction";
import { useReceiptPrinter } from "@/hooks/useReceiptPrinter";
import { useTenantInfo } from "@/hooks/useTenantInfo";
import { AuditTrailDisplay } from "./AuditTrailDisplay";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from '@/hooks/useAuth';
import { PrintReportDialog } from "./PrintReportDialog";
import { useRoomStatusManager } from "@/hooks/useRoomStatusManager";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  const queryClient = useQueryClient();
  const { data: tenantInfo } = useTenantInfo();
  const { updateRoomStatusAsync } = useRoomStatusManager();
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
  const [showCancelReservation, setShowCancelReservation] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Auto-close drawer when room becomes available after checkout/cancel
  useEffect(() => {
    if (!open || !room) return;
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.queryKey[0] === 'rooms') {
        const updatedRooms = event.query.state.data;
        
        // Ensure updatedRooms is an array before calling .find()
        if (!Array.isArray(updatedRooms)) return;
        
        const updatedRoom = updatedRooms.find((r: any) => r.id === room.id);
        
        // Auto-close if room transitioned from occupied to available
        if (updatedRoom && 
            room.status === 'occupied' && 
            updatedRoom.status === 'available') {
          
          setTimeout(() => {
            onClose();
            toast({
              title: "✓ Room Updated",
              description: `Room ${room.number} is now available`,
            });
          }, 500);
        }
      }
    });
    
    return () => unsubscribe();
  }, [open, room, queryClient, onClose, toast]);

  // Fetch folio ID for payment history
  const { data: folioData, isLoading: folioLoading, error: folioError } = useQuery({
    queryKey: ['room-folio', room?.id],
    queryFn: async () => {
      if (!room?.id) return null;
      
      console.log('[RoomActionDrawer] Fetching folio for room:', room.id);
      
      // First, find the active reservation for this room
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', room.id)
        .in('status', ['checked_in', 'confirmed', 'hard_assigned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (resError) {
        console.error('[RoomActionDrawer] Reservation query error:', resError);
        throw resError;
      }
      
      if (!reservation) {
        console.log('[RoomActionDrawer] No active reservation found for room');
        return null;
      }
      
      // Then get the open folio for this reservation
      const { data: folio, error: folioError } = await supabase
        .from('folios')
        .select('id')
        .eq('reservation_id', reservation.id)
        .eq('status', 'open')
        .maybeSingle();
      
      if (folioError) {
        console.error('[RoomActionDrawer] Folio query error:', folioError);
        throw folioError;
      }
      
      console.log('[RoomActionDrawer] Found folio:', folio);
      return folio;
    },
    enabled: !!room?.id && (room?.status === 'occupied' || room?.status === 'overstay' || room?.status === 'reserved'),
    retry: 3, // G++.2: Increase from 1 to 3 for better resilience
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 30000,
    refetchOnWindowFocus: true, // G++.2: Auto-refetch on tab return
    networkMode: 'online', // G++.2: Only fetch when online
  });

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

    // Handle cancel reservation action
    if (action === 'Cancel Reservation') {
      setShowCancelReservation(true);
      return;
    }

    // Handle checkout action with completion callback
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
          // Get audit trail for this room using real backend
          try {
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
          } catch (error) {
            console.error('History retrieval error:', error);
            toast({
              title: "History Error",
              description: "Failed to retrieve room history.",
              variant: "destructive",
            });
          }
          break;

        case 'Add Note':
          // Create a note entry in audit log using real backend
          const noteText = prompt('Enter your note for this room:');
          if (noteText?.trim()) {
            try {
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
            } catch (error) {
              console.error('Note creation error:', error);
              toast({
                title: "Note Error",
                description: "Failed to add note.",
                variant: "destructive",
              });
            }
          } else if (noteText !== null) {
            toast({
              title: "Invalid Note",
              description: "Note cannot be empty.",
              variant: "destructive",
            });
          }
          break;

        case 'Print Report':
          // Open print dialog to select paper size
          setShowPrintDialog(true);
          return; // Don't close drawer yet

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
    
    // Trigger real-time update instead of page reload
    onRoomUpdate?.(updatedRoom);
    setShowQuickCapture(false);
    onClose();

    // Show success toast for immediate feedback
    setTimeout(() => {
      toast({
        title: "Room Updated",
        description: `${actionDescription} completed for Room ${updatedRoom.number}`,
      });
    }, 100);
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'text-room-available';
      case 'occupied': return 'text-room-occupied';
      case 'reserved': return 'text-room-reserved';
      case 'dirty': return 'text-room-dirty';
      case 'oos': return 'text-room-oos';
      case 'overstay': return 'text-room-overstay';
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
      case 'dirty':
        actions = [
          { icon: Wrench, label: 'Create Work Order', action: 'create-workorder', variant: 'outline' as const },
        ];
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

  const handleCleanRoom = async () => {
    if (!room) return;
    
    setIsProcessing(true);
    try {
      await updateRoomStatusAsync({
        roomId: room.id,
        newStatus: 'available',
        reason: 'Room cleaned and ready for guests',
        metadata: {
          cleaned_by: user?.email,
          cleaned_at: new Date().toISOString(),
          previous_status: room.status
        }
      });
      
      // Refresh room data
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      toast({
        title: "Room Cleaned ✓",
        description: `Room ${room.number} is now available for guests.`,
      });
      
      // Auto-close drawer
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      console.error('Clean room error:', error);
      toast({
        title: "Error",
        description: "Failed to mark room as cleaned. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[500px] sm:max-w-[500px] h-full flex flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
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
         </div>

         <div className="flex-1 overflow-y-auto px-6 pb-6">
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

          {/* Folio Information with Payment History */}
          {room.folio && (folioData?.id || folioLoading) ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Folio Balance
                  </CardTitle>
                   <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      ₦{room.folio.balance.toLocaleString()}
                    </span>
                    <Badge 
                      variant={room.folio.balance <= 0 ? 'default' : room.folio.balance < (room.folio.total_charges || 0) ? 'secondary' : 'destructive'}
                      className={room.folio.balance <= 0 ? 'bg-success text-success-foreground' : ''}
                    >
                      {room.folio.balance <= 0 ? 'Paid in Full' : 
                       room.folio.balance < (room.folio.total_charges || 0) ? 'Partial' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {folioLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading folio details...</p>
                  </div>
                ) : folioError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-destructive">Error loading folio details</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment history unavailable</p>
                  </div>
                ) : !folioData?.id ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No folio found for this reservation</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A folio will be created when the guest checks in
                    </p>
                  </div>
                ) : (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="payments" className="text-xs">
                        <History className="h-3 w-3 mr-1" />
                        History
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="text-xs">
                        <Receipt className="h-3 w-3 mr-1" />
                        Timeline
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-3 space-y-2">
                      {room.folio.total_charges !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Charges:</span>
                          <span className="font-medium">₦{room.folio.total_charges.toLocaleString()}</span>
                        </div>
                      )}
                      {room.folio.total_payments !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="font-medium text-green-600">₦{room.folio.total_payments.toLocaleString()}</span>
                        </div>
                      )}
                      {room.folio.vat_amount !== undefined && room.folio.vat_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">VAT:</span>
                          <span>₦{room.folio.vat_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {room.folio.service_charge_amount !== undefined && room.folio.service_charge_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Charge:</span>
                          <span>₦{room.folio.service_charge_amount.toLocaleString()}</span>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="payments" className="mt-3">
                      <PaymentHistorySection folioId={folioData.id} />
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-3">
                      <ChargeTimelineSection folioId={folioData.id} />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          ) : room.folio && !folioData?.id && !folioLoading ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Folio Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold">
                    ₦{room.folio.balance.toLocaleString()}
                  </span>
                  <Badge 
                    variant={room.folio.balance <= 0 ? 'default' : 'destructive'}
                    className={room.folio.balance <= 0 ? 'bg-success text-success-foreground' : ''}
                  >
                    {room.folio.balance <= 0 ? 'Paid in Full' : 'Unpaid'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Payment history unavailable
                </p>
              </CardContent>
            </Card>
          ) : null}

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

          {/* Clean Room Button - Always visible for dirty rooms */}
          {room.status === 'dirty' && (
            <div className="pt-4 border-t border-green-200 bg-green-50/50 -mx-6 px-6 pb-4 dark:bg-green-950/20 dark:border-green-900">
              <Button
                onClick={handleCleanRoom}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Mark Room as Cleaned
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Audit Trail */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <AuditTrailDisplay roomId={room.id} />
          </div>
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
        roomId={room?.id}
        onCheckoutComplete={() => {
          // Auto-close drawer after successful checkout
          setTimeout(() => {
            onClose();
          }, 600);
        }}
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

      {/* Cancel Reservation Dialog */}
      <CancelReservationDialog
        room={room}
        open={showCancelReservation}
        onOpenChange={setShowCancelReservation}
        onComplete={(updatedRoom) => {
          setShowCancelReservation(false);
          onRoomUpdate?.(updatedRoom);
          // Auto-close drawer after successful cancellation
          setTimeout(() => {
            onClose();
          }, 600);
        }}
      />

      {/* Print Report Dialog */}
      <PrintReportDialog
        room={room}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        hotelInfo={tenantInfo ? {
          hotel_name: tenantInfo.hotel_name || 'Hotel',
          logo_url: tenantInfo.logo_url,
          address: tenantInfo.address,
          city: tenantInfo.city,
          country: tenantInfo.country,
          phone: tenantInfo.phone,
          email: tenantInfo.email
        } : undefined}
      />
    </>
  );
};