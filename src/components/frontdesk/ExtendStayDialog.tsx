import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar, Clock, CreditCard, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCurrency } from "@/hooks/useCurrency";
import type { Room } from "./RoomGrid";

interface ExtendStayDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (updatedRoom: Room) => void;
}

export const ExtendStayDialog = ({
  room,
  open,
  onOpenChange,
  onComplete,
}: ExtendStayDialogProps) => {
  const { toast } = useToast();
  const { enabledMethods, getMethodIcon } = usePaymentMethods();
  const { formatPrice } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    newCheckOutDate: '',
    paymentMethod: '',
    additionalRate: '15000', // Default room rate per night
    notes: '',
  });

  if (!room) return null;

  // Calculate additional nights and charges
  const currentCheckOut = room.checkOut ? new Date(room.checkOut) : new Date();
  const newCheckOut = formData.newCheckOutDate ? new Date(formData.newCheckOutDate) : null;
  const additionalNights = newCheckOut ? 
    Math.max(0, Math.ceil((newCheckOut.getTime() - currentCheckOut.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const additionalAmount = additionalNights * parseFloat(formData.additionalRate || '0');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newCheckOutDate) {
      toast({
        title: "Validation Error",
        description: "New check-out date is required",
        variant: "destructive",
      });
      return;
    }

    if (newCheckOut && newCheckOut <= currentCheckOut) {
      toast({
        title: "Validation Error",
        description: "New check-out date must be after current check-out date",
        variant: "destructive",
      });
      return;
    }

    if (additionalAmount > 0 && !formData.paymentMethod) {
      toast({
        title: "Validation Error", 
        description: "Payment method is required for additional charges",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedRoom = {
        ...room,
        checkOut: formData.newCheckOutDate,
        folio: {
          balance: (room.folio?.balance || 0) + additionalAmount,
          isPaid: additionalAmount === 0 ? (room.folio?.isPaid ?? false) : (formData.paymentMethod !== 'pay_later')
        }
      };

      onComplete(updatedRoom);

      toast({
        title: "Stay Extended",
        description: `Room ${room.number} checkout extended to ${new Date(formData.newCheckOutDate).toLocaleDateString()}. ${additionalAmount > 0 ? `Additional charge: ${formatPrice(additionalAmount)}` : 'No additional charges.'}`,
      });

      // Reset form
      setFormData({
        newCheckOutDate: '',
        paymentMethod: '',
        additionalRate: '15000',
        notes: '',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend stay. Please try again.",
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
            <Calendar className="h-5 w-5" />
            Extend Stay
          </DialogTitle>
          <DialogDescription>
            Extend checkout date for Room {room.number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Stay Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Current Stay
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Guest:</span>
                <span className="font-medium">{room.guest}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Check-out:</span>
                <span className="font-medium">
                  {room.checkOut ? new Date(room.checkOut).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              {room.folio && (
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <span className="font-medium">{formatPrice(room.folio.balance)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extension Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Extension Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="newCheckOutDate">New Check-out Date *</Label>
                <Input
                  id="newCheckOutDate"
                  type="date"
                  value={formData.newCheckOutDate}
                  onChange={(e) => handleInputChange('newCheckOutDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="additionalRate">Rate per Additional Night (₦)</Label>
                <Input
                  id="additionalRate"
                  type="number"
                  value={formData.additionalRate}
                  onChange={(e) => handleInputChange('additionalRate', e.target.value)}
                  min="0"
                  step="500"
                  className="mt-1"
                />
              </div>

              {/* Extension Summary */}
              {additionalNights > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Additional nights:</span>
                    <span className="font-medium">{additionalNights}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rate per night:</span>
                    <span className="font-medium">{formatPrice(parseFloat(formData.additionalRate || '0'))}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Additional Amount:</span>
                    <span className="text-primary">{formatPrice(additionalAmount)}</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about the extension..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          {additionalAmount > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Extend Stay'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};