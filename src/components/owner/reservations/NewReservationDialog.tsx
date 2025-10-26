import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, Phone, Mail, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCreateEnhancedReservation } from '@/hooks/useEnhancedReservations';
import { useRooms } from '@/hooks/useRooms';
import { useCurrency } from '@/hooks/useCurrency';
import { useSearchGuests } from '@/hooks/useGuests';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import PaymentOptionsDialog from './PaymentOptionsDialog';

interface NewReservationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedRoom?: string;
}

export default function NewReservationDialog({
  open,
  onClose,
  selectedDate,
  selectedRoom
}: NewReservationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    idNumber: '',
    checkIn: selectedDate || new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    adults: 1,
    children: 0,
    roomType: '',
    specialRequests: '',
    source: 'direct'
  });

  const { data: roomsData } = useRooms();
  const rooms = roomsData?.rooms || [];
  const roomTypes = roomsData?.roomTypes || [];
  const { data: searchResults = [] } = useSearchGuests(guestSearchTerm);
  
  const createReservation = useCreateEnhancedReservation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const selectGuest = (guest: any) => {
    setFormData({
      ...formData,
      guestName: `${guest.first_name} ${guest.last_name}`,
      email: guest.email || '',
      phone: guest.phone || '',
      idNumber: guest.guest_id_number || ''
    });
    setGuestSearchOpen(false);
    setGuestSearchTerm('');
  };

  const calculateNights = () => {
    const diffTime = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const roomTypeData = roomTypes.find(rt => rt.id === formData.roomType);
    return nights * (roomTypeData?.base_rate || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.checkIn || !formData.checkOut || !formData.roomType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including room type",
        variant: "destructive",
      });
      return;
    }

    // Find an available room of the selected type
    const availableRoom = rooms?.find(room => 
      room.status === 'available' && 
      room.room_type_id === formData.roomType
    );

    if (!availableRoom) {
      toast({
        title: "No Rooms Available",
        description: "No rooms are available for the selected room type and dates",
        variant: "destructive",
      });
      return;
    }

    // Prepare reservation data and show payment options
    const roomTypeData = roomTypes.find(rt => rt.id === formData.roomType);
    setPendingReservation({
      ...formData,
      room_id: availableRoom.id,
      room_rate: roomTypeData?.base_rate || 0
    });
    setShowPaymentDialog(true);
  };

  const handlePaymentConfirm = async (
    paymentOption: 'full' | 'deposit' | 'none',
    policyId: string,
    methods: string[]
  ) => {
    if (!pendingReservation) return;

    setIsLoading(true);
    try {
      await createReservation.mutateAsync({
        guest_name: pendingReservation.guestName,
        guest_email: pendingReservation.email,
        guest_phone: pendingReservation.phone,
        guest_id_number: pendingReservation.idNumber,
        check_in_date: pendingReservation.checkIn.toISOString().split('T')[0],
        check_out_date: pendingReservation.checkOut.toISOString().split('T')[0],
        room_id: pendingReservation.room_id,
        adults: pendingReservation.adults,
        children: pendingReservation.children,
        room_rate: pendingReservation.room_rate,
        status: 'confirmed' as const,
        special_requests: pendingReservation.specialRequests,
        payment_policy_id: policyId,
        payment_option: paymentOption
      });
      
      // Reset form
      setFormData({
        guestName: '',
        email: '',
        phone: '',
        idNumber: '',
        checkIn: selectedDate || new Date(),
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
        adults: 1,
        children: 0,
        roomType: '',
        specialRequests: '',
        source: 'direct'
      });
      setPendingReservation(null);
      onClose();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to create reservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Reservation</DialogTitle>
          <DialogDescription>
            Create a new reservation for your hotel
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Popover open={guestSearchOpen} onOpenChange={setGuestSearchOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      id="guestName"
                      className="pl-10"
                      value={formData.guestName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, guestName: value });
                        setGuestSearchTerm(value);
                        setIsTyping(true);
                        
                        // Open search dropdown when typing
                        if (value.length > 1 && !guestSearchOpen) {
                          setGuestSearchOpen(true);
                        } else if (value.length <= 1 && guestSearchOpen) {
                          setGuestSearchOpen(false);
                        }
                      }}
                      onFocus={() => {
                        if (formData.guestName.length > 1) {
                          setGuestSearchTerm(formData.guestName);
                          setGuestSearchOpen(true);
                        }
                      }}
                      placeholder="Type guest name or search existing..."
                      required
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                      <CommandList>
                        {searchResults.length === 0 && guestSearchTerm.length > 1 ? (
                          <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 p-4">
                              <span>No existing guests found.</span>
                              <CommandItem
                                onSelect={() => {
                                  setGuestSearchOpen(false);
                                  setIsTyping(false);
                                }}
                                className="cursor-pointer w-full justify-center"
                              >
                                Continue with "{guestSearchTerm}" as new guest
                              </CommandItem>
                            </div>
                          </CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {searchResults.map((guest) => (
                              <CommandItem
                                key={guest.id}
                                onSelect={() => selectGuest(guest)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {guest.first_name} {guest.last_name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {guest.email} • {guest.phone} • {guest.total_stays || 0} stays
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                            {searchResults.length > 0 && guestSearchTerm.length > 0 && (
                              <CommandItem
                                onSelect={() => {
                                  setGuestSearchOpen(false);
                                  setIsTyping(false);
                                }}
                                className="cursor-pointer border-t"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>Create new guest "{guestSearchTerm}"</span>
                                </div>
                              </CommandItem>
                            )}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              />
            </div>
          </div>

          {/* Reservation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.checkIn ? format(formData.checkIn, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.checkIn}
                    onSelect={(date) => date && setFormData({ ...formData, checkIn: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.checkOut ? format(formData.checkOut, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.checkOut}
                    onSelect={(date) => date && setFormData({ ...formData, checkOut: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adults">Adults</Label>
              <Select value={formData.adults.toString()} onValueChange={(value) => setFormData({ ...formData, adults: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Select value={formData.children.toString()} onValueChange={(value) => setFormData({ ...formData, children: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={formData.roomType} onValueChange={(value) => setFormData({ ...formData, roomType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map(roomType => (
                  <SelectItem key={roomType.id} value={roomType.id}>
                    {roomType.name} - {formatPrice(roomType.base_rate)}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              rows={3}
            />
          </div>

          {/* Booking Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Booking Source</Label>
            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct Booking</SelectItem>
                <SelectItem value="phone">Phone Booking</SelectItem>
                <SelectItem value="booking.com">Booking.com</SelectItem>
                <SelectItem value="expedia">Expedia</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {formData.checkIn && formData.checkOut && formData.roomType && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Reservation Summary</h4>
              <div className="space-y-1 text-sm">
                <div>Guest: {formData.guestName}</div>
                <div>Dates: {format(formData.checkIn, "PPP")} - {format(formData.checkOut, "PPP")}</div>
                <div>Duration: {calculateNights()} nights</div>
                <div>Guests: {formData.adults} adults{formData.children > 0 && `, ${formData.children} children`}</div>
                <div className="font-semibold">
                  Total: {formatPrice(calculateTotal())}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.roomType}>
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "Continue to Payment"}
            </Button>
          </div>
        </form>

        {/* Payment Options Dialog */}
        <PaymentOptionsDialog
          open={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setPendingReservation(null);
          }}
          onConfirm={handlePaymentConfirm}
          totalAmount={calculateTotal()}
          guestName={formData.guestName}
          nights={calculateNights()}
        />
      </DialogContent>
    </Dialog>
  );
}