import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { useCreateReservation, useRoomAvailability } from "@/hooks/data/useReservationsData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoomTypeAvailability } from "@/hooks/useRoomTypeAvailability";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewReservationDialog = ({ open, onOpenChange }: NewReservationDialogProps) => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  
  const [guestMode, setGuestMode] = useState<'new' | 'existing'>('new');
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 1));
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  
  const { toast } = useToast();
  const createReservation = useCreateReservation();

  // Fetch existing guests
  const { data: existingGuests, isLoading: guestsLoading } = useQuery({
    queryKey: ['guests', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('guests')
        .select('id, first_name, last_name, email, phone')
        .eq('tenant_id', tenantId)
        .order('last_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && open && guestMode === 'existing',
  });

  // Professional room type availability
  const { data: roomTypeAvailability, isLoading: roomTypesLoading, error: roomTypesError } = useRoomTypeAvailability(checkIn, checkOut);
  
  // Fetch specific available rooms for selected room type
  const { data: availableRooms, isLoading: availabilityLoading } = useQuery({
    queryKey: ['available-rooms', tenantId, checkIn ? format(checkIn, 'yyyy-MM-dd') : null, checkOut ? format(checkOut, 'yyyy-MM-dd') : null, roomTypeId],
    queryFn: async () => {
      if (!tenantId || !checkIn || !checkOut || !roomTypeId) return [];
      
      const { data, error } = await supabase.rpc('get_available_rooms', {
        p_tenant_id: tenantId,
        p_check_in_date: format(checkIn, 'yyyy-MM-dd'),
        p_check_out_date: format(checkOut, 'yyyy-MM-dd'),
        p_room_type_id: roomTypeId
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!roomTypeId && !!checkIn && !!checkOut && open,
  });

  const handleGuestSelect = (guestId: string) => {
    setSelectedGuestId(guestId);
    const guest = existingGuests?.find(g => g.id === guestId);
    if (guest) {
      setGuestName(`${guest.first_name} ${guest.last_name}`);
      setGuestEmail(guest.email || "");
      setGuestPhone(guest.phone || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut || !selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a specific room",
        variant: "destructive"
      });
      return;
    }

    const selectedRoom = availableRooms?.find((r: any) => r.room_id === selectedRoomId);
    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "Selected room is no longer available",
        variant: "destructive"
      });
      return;
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = selectedRoom.base_rate * nights;

    await createReservation.mutateAsync({
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      room_id: selectedRoomId,
      check_in_date: format(checkIn, 'yyyy-MM-dd'),
      check_out_date: format(checkOut, 'yyyy-MM-dd'),
      adults: parseInt(adults),
      children: parseInt(children),
      status: 'confirmed',
      room_rate: selectedRoom.base_rate,
      total_amount: totalAmount,
      reservation_number: `RES-${Date.now()}`,
    });

    onOpenChange(false);
    setGuestMode('new');
    setSelectedGuestId("");
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setRoomTypeId("");
    setSelectedRoomId("");
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
          <div className="space-y-4">
            <Label>Guest Information *</Label>
            <RadioGroup value={guestMode} onValueChange={(value: 'new' | 'existing') => {
              setGuestMode(value);
              if (value === 'new') {
                setSelectedGuestId("");
                setGuestName("");
                setGuestEmail("");
                setGuestPhone("");
              }
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="font-normal cursor-pointer">Create New Guest</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="font-normal cursor-pointer">Select Existing Guest</Label>
              </div>
            </RadioGroup>
          </div>

          {guestMode === 'existing' && (
            <div className="space-y-2">
              <Label htmlFor="existingGuest">Select Guest *</Label>
              <Select value={selectedGuestId} onValueChange={handleGuestSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={guestsLoading ? "Loading guests..." : "Select a guest"} />
                </SelectTrigger>
                <SelectContent>
                  {existingGuests?.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.first_name} {guest.last_name} - {guest.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name *</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
              required
              readOnly={guestMode === 'existing'}
              className={guestMode === 'existing' ? 'bg-muted' : ''}
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
                readOnly={guestMode === 'existing'}
                className={guestMode === 'existing' ? 'bg-muted' : ''}
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
                readOnly={guestMode === 'existing'}
                className={guestMode === 'existing' ? 'bg-muted' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type *</Label>
            <Select 
              value={roomTypeId} 
              onValueChange={(value) => {
                setRoomTypeId(value);
                setSelectedRoomId("");
              }} 
              required
              disabled={roomTypesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  roomTypesLoading 
                    ? "Loading room types..." 
                    : roomTypesError 
                      ? "Error loading room types" 
                      : "Select room type"
                } />
              </SelectTrigger>
              <SelectContent>
                {roomTypesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : roomTypeAvailability && roomTypeAvailability.length > 0 ? (
                  roomTypeAvailability.map((rt) => (
                    <SelectItem 
                      key={rt.room_type_id} 
                      value={rt.room_type_id}
                      disabled={!rt.can_book}
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{rt.room_type_name} - ₦{rt.base_rate.toLocaleString()}/night</span>
                        <Badge 
                          variant={
                            rt.availability_status === 'available' ? 'default' :
                            rt.availability_status === 'limited' ? 'secondary' :
                            'destructive'
                          }
                          className="ml-2"
                        >
                          {rt.available_count}/{rt.total_inventory} available
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No room types available
                  </div>
                )}
              </SelectContent>
            </Select>
            {roomTypesError && (
              <p className="text-sm text-destructive">
                Failed to load room types. Please try again.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specificRoom">Select Room *</Label>
            <Select 
              value={selectedRoomId} 
              onValueChange={setSelectedRoomId}
              disabled={!roomTypeId || availabilityLoading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  availabilityLoading 
                    ? "Loading available rooms..." 
                    : availableRooms && availableRooms.length > 0
                      ? "Select specific room" 
                      : roomTypeId 
                        ? "No rooms available"
                        : "Select room type first"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableRooms?.map((room: any) => (
                  <SelectItem key={room.room_id} value={room.room_id}>
                    Room {room.room_number} - {room.room_type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableRooms && availableRooms.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {availableRooms.length} room(s) available for selected dates
              </p>
            )}
            {availableRooms && availableRooms.length === 0 && roomTypeId && (
              <p className="text-sm text-destructive">
                No rooms available for this room type and date range
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
            <Button type="submit" disabled={createReservation.isPending || !selectedRoomId}>
              {createReservation.isPending ? "Creating..." : "Create Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};