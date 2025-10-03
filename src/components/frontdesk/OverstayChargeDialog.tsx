import { useQueryClient } from '@tanstack/react-query';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Clock, CreditCard, MessageSquare, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfiguration } from "@/hooks/useConfiguration";
import { calculateTaxesAndCharges } from "@/lib/tax-calculator";
import type { Room } from "./RoomGrid";

interface OverstayChargeDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'overstay-charge' | 'send-reminder' | 'escalate-manager' | 'force-checkout';
  onComplete: (updatedRoom: Room) => void;
}

const OVERSTAY_PRESETS = [
  { hours: 1, amount: 2000, label: '1 Hour Late' },
  { hours: 2, amount: 4000, label: '2 Hours Late' },
  { hours: 4, amount: 6000, label: '4 Hours Late' },
  { hours: 8, amount: 10000, label: 'Half Day Late' },
  { hours: 24, amount: 15000, label: 'Full Day Late' },
];

export const OverstayChargeDialog = ({
  room,
  open,
  onOpenChange,
  action,
  onComplete,
}: OverstayChargeDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { enabledMethods, getMethodIcon } = usePaymentMethods();
  const { formatPrice } = useCurrency();
  const { configuration } = useConfiguration();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    chargeAmount: '5000',
    paymentMethod: '',
    notes: '',
    reminderMessage: 'Dear guest, your checkout time has passed. Please settle your account and vacate the room. Thank you.',
    escalationReason: '',
    forceReason: '',
  });
  
  // Calculate tax breakdown for preview (after formData is declared)
  const chargeAmount = parseFloat(formData.chargeAmount) || 0;
  const taxCalculation = calculateTaxesAndCharges({
    baseAmount: chargeAmount,
    chargeType: 'room',
    isTaxable: true,
    isServiceChargeable: true,
    guestTaxExempt: false,
    configuration: configuration || {
      tax: {
        vat_rate: 7.5,
        service_charge_rate: 10,
        tax_inclusive: false,
        service_charge_inclusive: false,
        vat_applicable_to: ['room', 'food', 'beverage', 'laundry', 'spa'],
        service_applicable_to: ['room', 'food', 'beverage', 'spa']
      }
    } as any
  });

  if (!room) return null;

  const getDialogTitle = () => {
    switch (action) {
      case 'overstay-charge': return 'Apply Overstay Charge';
      case 'send-reminder': return 'Send Checkout Reminder';
      case 'escalate-manager': return 'Escalate to Manager';
      case 'force-checkout': return 'Force Check-out';
      default: return 'Overstay Management';
    }
  };

  const getDialogDescription = () => {
    switch (action) {
      case 'overstay-charge': return `Apply overstay charge for Room ${room.number}`;
      case 'send-reminder': return `Send reminder to guest in Room ${room.number}`;
      case 'escalate-manager': return `Escalate overstay issue for Room ${room.number}`;
      case 'force-checkout': return `Force check-out for Room ${room.number}`;
      default: return `Handle overstay for Room ${room.number}`;
    }
  };

  // Calculate overstay hours
  const currentTime = new Date();
  const checkOutTime = room.checkOut ? new Date(room.checkOut) : new Date();
  const overstayHours = Math.max(0, Math.ceil((currentTime.getTime() - checkOutTime.getTime()) / (1000 * 60 * 60)));

  const handlePresetSelect = (preset: typeof OVERSTAY_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      chargeAmount: preset.amount.toString()
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on action
    if (action === 'overstay-charge') {
      if (!formData.chargeAmount || parseFloat(formData.chargeAmount) <= 0) {
        toast({
          title: "Validation Error",
          description: "Charge amount is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.paymentMethod) {
        toast({
          title: "Validation Error",
          description: "Payment method is required",
          variant: "destructive",
        });
        return;
      }
    }

    if (action === 'send-reminder' && !formData.reminderMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Reminder message is required",
        variant: "destructive",
      });
      return;
    }

    if (action === 'escalate-manager' && !formData.escalationReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Escalation reason is required",
        variant: "destructive",
      });
      return;
    }

    if (action === 'force-checkout' && !formData.forceReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Force checkout reason is required",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Real backend integration
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      let updatedRoom = { ...room };

      switch (action) {
        case 'overstay-charge':
          // Find the open folio for this room through reservation
          const { data: currentReservation, error: reservationError } = await supabase
            .from('reservations')
            .select('id')
            .eq('room_id', room.id)
            .eq('status', 'checked_in')
            .eq('tenant_id', user.user_metadata?.tenant_id)
            .single();

          if (reservationError) throw new Error('No active reservation found for this room');

          const { data: folios, error: folioError } = await supabase
            .from('folios')
            .select('id')
            .eq('status', 'open')
            .eq('reservation_id', currentReservation.id)
            .limit(1);

          if (folioError) throw folioError;

          if (folios && folios.length > 0) {
            // Calculate taxes for overstay charge
            const taxCalc = calculateTaxesAndCharges({
              baseAmount: parseFloat(formData.chargeAmount),
              chargeType: 'room',
              isTaxable: true,
              isServiceChargeable: true,
              guestTaxExempt: false,
              configuration: configuration || {
                tax: {
                  vat_rate: 7.5,
                  service_charge_rate: 10,
                  tax_inclusive: false,
                  service_charge_inclusive: false,
                  vat_applicable_to: ['room', 'food', 'beverage', 'laundry', 'spa'],
                  service_applicable_to: ['room', 'food', 'beverage', 'spa']
                }
              } as any
            });

            const chargeData = {
              folio_id: folios[0].id,
              charge_type: 'overstay',
              description: `Overstay charge for Room ${room.number} - ${overstayHours} hours late`,
              tenant_id: user.user_metadata?.tenant_id,
              base_amount: taxCalc.baseAmount,
              vat_amount: taxCalc.vatAmount,
              service_charge_amount: taxCalc.serviceChargeAmount,
              amount: taxCalc.totalAmount,
              is_taxable: true,
              is_service_chargeable: true
            };

            // Add overstay charge
            const { error: chargeError } = await supabase
              .from('folio_charges')
              .insert(chargeData);

            if (chargeError) throw chargeError;

            // Process payment if method selected
            if (formData.paymentMethod && formData.paymentMethod !== 'pay_later') {
              const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                  folio_id: folios[0].id,
                  amount: parseFloat(formData.chargeAmount),
                  payment_method: formData.paymentMethod,
                  payment_status: 'completed',
                  tenant_id: user.user_metadata?.tenant_id
                });

              if (paymentError) throw paymentError;
            }

            updatedRoom.folio = {
              balance: (room.folio?.balance || 0) + parseFloat(formData.chargeAmount) - (formData.paymentMethod !== 'pay_later' ? parseFloat(formData.chargeAmount) : 0),
              isPaid: formData.paymentMethod !== 'pay_later'
            };
          }
          break;

        case 'send-reminder':
          // Create a notification event for the reminder
          const { error: notificationError } = await supabase
            .from('notification_events')
            .insert([{
              tenant_id: user.user_metadata?.tenant_id,
              event_type: 'overstay_reminder',
              event_source: 'front_desk',
              channels: ['sms', 'email'],
              recipients: [{
                type: 'guest',
                contact: room.guest,
                phone: (room as any).current_reservation?.guest_phone,
                email: (room as any).current_reservation?.guest_email
              }],
              template_data: {
                guest_name: room.guest,
                room_number: room.number,
                message: formData.reminderMessage,
                overstay_hours: overstayHours
              },
              metadata: { room_id: room.id }
            }]);

          if (notificationError) throw notificationError;
          break;

        case 'force-checkout':
          // Update reservation status
          if ((room as any).current_reservation) {
            const { error: reservationError } = await supabase
              .from('reservations')
              .update({ 
                status: 'checked_out',
                checked_out_at: new Date().toISOString(),
                checked_out_by: user.id
              })
              .eq('id', (room as any).current_reservation.id);

            if (reservationError) throw reservationError;
          }

          // Update room status
          const { error: roomError } = await supabase
            .from('rooms')
            .update({ 
              status: 'available',
              updated_at: new Date().toISOString()
            })
            .eq('id', room.id);

          if (roomError) throw roomError;

          // Create housekeeping task
          const { error: taskError } = await supabase
            .from('housekeeping_tasks')
            .insert({
              room_id: room.id,
              task_type: 'checkout_cleaning',
              title: 'Post-Checkout Cleaning',
              description: `Clean Room ${room.number} after force checkout`,
              priority: 'high',
              status: 'pending',
              tenant_id: user.user_metadata?.tenant_id,
              created_by: user.id
            });

          if (taskError) throw taskError;

          updatedRoom.status = 'available';
          updatedRoom.guest = undefined;
          updatedRoom.checkIn = undefined;
          updatedRoom.checkOut = undefined;
          updatedRoom.alerts = {
            ...room.alerts,
            cleaning: true
          };
          break;
      }

      onComplete(updatedRoom);

      // Invalidate rooms query to trigger refetch  
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      const successMessages = {
        'overstay-charge': `Overstay charge of ${formatPrice(parseFloat(formData.chargeAmount))} applied to Room ${room.number}`,
        'send-reminder': `Checkout reminder sent to guest in Room ${room.number}`,
        'escalate-manager': `Overstay issue for Room ${room.number} escalated to manager`,
        'force-checkout': `Room ${room.number} has been force checked-out`
      };

      toast({
        title: "Action Completed",
        description: successMessages[action],
      });

      // Reset form
      setFormData({
        chargeAmount: '5000',
        paymentMethod: '',
        notes: '',
        reminderMessage: 'Dear guest, your checkout time has passed. Please settle your account and vacate the room. Thank you.',
        escalationReason: '',
        forceReason: '',
      });

      onOpenChange(false);

      // Navigate back to front desk
      setTimeout(() => {
        navigate('/front-desk');
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process overstay action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Overstay Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Overstay Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Guest:</span>
                <span className="font-medium">{room.guest}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Expected Checkout:</span>
                <span className="font-medium text-orange-600">
                  {room.checkOut ? new Date(room.checkOut).toLocaleString() : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overstay Hours:</span>
                <span className="font-semibold text-red-600">{overstayHours} hours</span>
              </div>
            </CardContent>
          </Card>

          {/* Action-specific forms */}
          {action === 'overstay-charge' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Charge Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Preset Charges */}
                <div>
                  <Label>Quick Select (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {OVERSTAY_PRESETS.slice(0, 4).map((preset) => (
                      <Button
                        key={preset.hours}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSelect(preset)}
                        className="text-xs"
                      >
                        {preset.label}<br />₦{preset.amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="chargeAmount">Charge Amount (₦) *</Label>
                  <Input
                    id="chargeAmount"
                    type="number"
                    value={formData.chargeAmount}
                    onChange={(e) => handleInputChange('chargeAmount', e.target.value)}
                    min="0"
                    step="500"
                    className="mt-1"
                  />
                </div>

                {/* Tax Breakdown Preview */}
                {chargeAmount > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base Amount:</span>
                      <span className="font-medium">{formatPrice(taxCalculation.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>VAT (7.5%):</span>
                      <span>{formatPrice(taxCalculation.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Service Charge (10%):</span>
                      <span>{formatPrice(taxCalculation.serviceChargeAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total Charge:</span>
                      <span className="text-primary">{formatPrice(taxCalculation.totalAmount)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Payment Method *</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(method.icon)}
                            <span>{method.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {action === 'send-reminder' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Reminder Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="reminderMessage">Message *</Label>
                  <Textarea
                    id="reminderMessage"
                    value={formData.reminderMessage}
                    onChange={(e) => handleInputChange('reminderMessage', e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {action === 'escalate-manager' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Escalation Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="escalationReason">Reason for Escalation *</Label>
                  <Textarea
                    id="escalationReason"
                    value={formData.escalationReason}
                    onChange={(e) => handleInputChange('escalationReason', e.target.value)}
                    placeholder="Describe why this needs manager attention..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {action === 'force-checkout' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Force Checkout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> This will immediately check out the guest and mark the room as available. 
                      Use only when guest cannot be reached or refuses to cooperate.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="forceReason">Justification Required *</Label>
                    <Textarea
                      id="forceReason"
                      value={formData.forceReason}
                      onChange={(e) => handleInputChange('forceReason', e.target.value)}
                      placeholder="Provide detailed justification for force checkout..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about this action..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              variant={action === 'force-checkout' ? 'destructive' : 'default'}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : getDialogTitle()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};