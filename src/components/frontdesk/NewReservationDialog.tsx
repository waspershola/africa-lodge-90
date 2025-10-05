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
import { format, addDays } from "date-fns";
import { useCreateReservation, useRoomAvailability } from "@/hooks/data/useReservationsData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewReservationDialog = ({ open, onOpenChange }: NewReservationDialogProps) => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 1));
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");

  const createReservation = useCreateReservation();

  // Fetch room types
  const { data: roomTypes } = useQuery({
    queryKey: ['room-types', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && open,
  });

  // Check availability when dates and room type change
  const availability = useRoomAvailability(checkIn, checkOut, roomTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut || !roomTypeId) {
      return;
    }

    const selectedRoomType = roomTypes?.find(rt => rt.id === roomTypeId);
    if (!selectedRoomType) return;

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = selectedRoomType.base_rate * nights;

    await createReservation.mutateAsync({
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      room_type_id: roomTypeId,
      check_in_date: format(checkIn, 'yyyy-MM-dd'),
      check_out_date: format(checkOut, 'yyyy-MM-dd'),
      adults: parseInt(adults),
      children: parseInt(children),
      status: 'confirmed',
      room_rate: selectedRoomType.base_rate,
      total_amount: totalAmount,
      reservation_number: `RES-${Date.now()}`,
    });

    onOpenChange(false);
    // Reset form
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setRoomTypeId("");
    setAdults("1");
    setChildren("0");
    setCheckIn(new Date());
    setCheckOut(addDays(new Date(), 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Reservation
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="guest@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone *</Label>
              <Input
                id="guestPhone"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+234..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type *</Label>
            <Select value={roomTypeId} onValueChange={setRoomTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes?.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name} - ₦{rt.base_rate.toLocaleString()}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availability.data && availability.data.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {availability.data.length} room(s) available
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adults">Adults *</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
              />
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

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createReservation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createReservation.isPending || !availability.data?.length}>
              {createReservation.isPending ? "Creating..." : "Create Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};