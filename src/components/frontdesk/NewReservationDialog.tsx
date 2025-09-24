import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRoomTypes, useCreateReservation } from "@/hooks/useApi";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { useToast } from "@/hooks/use-toast";

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewReservationDialog = ({ open, onOpenChange }: NewReservationDialogProps) => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: roomTypes, isLoading: roomTypesLoading } = useRoomTypes();
  const createReservationMutation = useCreateReservation();

  const selectedRoomType = roomTypes?.find(rt => rt.id === roomTypeId);
  const nights = checkIn && checkOut ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalAmount = selectedRoomType && nights > 0 ? selectedRoomType.base_rate * nights : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.tenant_id || !selectedRoomType || !checkIn || !checkOut) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Split guest name into first and last name
    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      await createReservationMutation.mutateAsync({
        tenant_id: user.tenant_id,
        guest_first_name: firstName,
        guest_last_name: lastName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        room_id: selectedRoomType.id, // We'll use room type ID for now, should be actual room ID
        check_in_date: checkIn.toISOString().split('T')[0],
        check_out_date: checkOut.toISOString().split('T')[0],
        adults: parseInt(adults),
        children: parseInt(children),
        room_rate: selectedRoomType.base_rate,
        total_amount: totalAmount
      });

      toast({
        title: "Success",
        description: "Reservation created successfully"
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to create reservation",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setRoomTypeId("");
    setAdults("1");
    setChildren("0");
    setCheckIn(undefined);
    setCheckOut(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Reservation
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name *</Label>
              <Input
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="guest@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone</Label>
              <Input
                id="guestPhone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type *</Label>
              <Select value={roomTypeId} onValueChange={setRoomTypeId} required disabled={roomTypesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={roomTypesLoading ? "Loading..." : "Select room type"} />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes?.map((roomType) => (
                    <SelectItem key={roomType.id} value={roomType.id}>
                      {roomType.name} - ${roomType.base_rate}/night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adults *</Label>
              <Select value={adults} onValueChange={setAdults}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Children</Label>
              <Select value={children} onValueChange={setChildren}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {totalAmount > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rate: ${selectedRoomType?.base_rate}/night</span>
                <span>Nights: {nights}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createReservationMutation.isPending || !guestName || !roomTypeId || !checkIn || !checkOut}
            >
              {createReservationMutation.isPending ? "Creating..." : "Create Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};