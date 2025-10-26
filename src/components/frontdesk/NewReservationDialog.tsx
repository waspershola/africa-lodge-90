import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarIcon, Plus, Search, UserCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { useCreateReservation, useRoomAvailability } from "@/hooks/data/useReservationsData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoomTypeAvailability } from "@/hooks/useRoomTypeAvailability";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGuestSearch, useRecentGuests } from "@/hooks/useGuestSearch";

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewReservationDialog = ({ open, onOpenChange }: NewReservationDialogProps) => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  
  const [guestMode, setGuestMode] = useState<'new' | 'existing'>('new');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [guestSearchValue, setGuestSearchValue] = useState("");
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
  const { data: recentGuests } = useRecentGuests();
  const { data: searchResults } = useGuestSearch(guestSearchValue);

  // Combine search results with recent guests
  const filteredGuests = useMemo(() => {
    if (guestSearchValue.length >= 2) {
      return searchResults || [];
    }
    return recentGuests?.slice(0, 10) || [];
  }, [searchResults, recentGuests, guestSearchValue]);

  // Professional room type availability
  const { data: roomTypeAvailability, isLoading: roomTypesLoading, error: roomTypesError } = useRoomTypeAvailability(checkIn, checkOut);

  // Debug logging for room type errors
  useEffect(() => {
    if (roomTypesError) {
      console.error('[Room Types Error]:', {
        error: roomTypesError,
        tenant: tenantId,
        checkIn: checkIn ? format(checkIn, 'yyyy-MM-dd') : null,
        checkOut: checkOut ? format(checkOut, 'yyyy-MM-dd') : null
      });
    }
  }, [roomTypesError, tenantId, checkIn, checkOut]);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Duplicate prevention: Check if already processing
    if (createReservation.isPending) {
      return;
    }
    
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

    try {
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

      resetForm();
      onOpenChange(false);
    } catch (error) {
      // Error already handled by mutation
      console.error('Reservation creation failed:', error);
    }
  };

  const handleGuestSelect = (guest: any) => {
    setSelectedGuest(guest);
    setGuestName(guest.name);
    setGuestEmail(guest.email || "");
    setGuestPhone(guest.phone || "");
    setGuestSearchOpen(false);
  };

  const handleGuestModeChange = (mode: 'new' | 'existing') => {
    setGuestMode(mode);
    if (mode === 'new') {
      setSelectedGuest(null);
      setGuestSearchValue("");
    }
  };

  const resetForm = () => {
    setGuestMode('new');
    setSelectedGuest(null);
    setGuestSearchValue("");
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
          {/* Guest Selection Mode */}
          <div className="space-y-3">
            <Label>Guest Information *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={guestMode === 'existing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGuestModeChange('existing')}
                className="flex-1"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Select Existing
              </Button>
              <Button
                type="button"
                variant={guestMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGuestModeChange('new')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>

            {/* Existing Guest Search */}
            {guestMode === 'existing' && (
              <div>
                <Label>Search & Select Guest *</Label>
                <Popover open={guestSearchOpen} onOpenChange={setGuestSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={guestSearchOpen}
                      className="w-full justify-between mt-1"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        {selectedGuest ? selectedGuest.name : "Search guest by name or phone..."}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-[100]" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search guests..." 
                        value={guestSearchValue}
                        onValueChange={setGuestSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No guest found.</CommandEmpty>
                        <CommandGroup>
                          {filteredGuests.map((guest: any) => (
                            <CommandItem
                              key={guest.id}
                              value={guest.name}
                              onSelect={() => handleGuestSelect(guest)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{guest.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {guest.phone} • {guest.email}
                                </span>
                                {guest.last_stay_date && (
                                  <span className="text-xs text-muted-foreground">
                                    Last stay: {new Date(guest.last_stay_date).toLocaleDateString()} • {guest.total_stays} stays
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Show selected guest info for existing mode */}
            {guestMode === 'existing' && selectedGuest && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedGuest.name}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>📱 {selectedGuest.phone}</div>
                  <div>📧 {selectedGuest.email}</div>
                  {selectedGuest.last_stay_date && (
                    <div>🏨 Last stay: {new Date(selectedGuest.last_stay_date).toLocaleDateString()} • {selectedGuest.total_stays} stays</div>
                  )}
                </div>
              </div>
            )}

            {/* New Guest Fields */}
            {guestMode === 'new' && (
              <>
                <div>
                  <Label htmlFor="guestName">Guest Name *</Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter guest full name"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestPhone">Phone *</Label>
                    <Input
                      id="guestPhone"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+234..."
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type *</Label>
            <Select 
              value={roomTypeId} 
              onValueChange={(value) => {
                setRoomTypeId(value);
                setSelectedRoomId("");
              }} 
              disabled={roomTypesLoading}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  roomTypesLoading ? "Loading room types..." : 
                  roomTypesError ? "Error loading room types" :
                  "Select room type"
                } />
              </SelectTrigger>
              <SelectContent>
                {roomTypeAvailability && roomTypeAvailability.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No available room types for selected dates</div>
                ) : (
                  roomTypeAvailability?.map((rt) => (
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
                )}
              </SelectContent>
            </Select>
            {roomTypesError && (
              <p className="text-sm text-destructive">Failed to load room types. Please try again.</p>
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