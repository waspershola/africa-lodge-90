import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRooms } from '@/hooks/useRooms';
import { useCreateReservation } from '@/hooks/useCreateReservation';
import { useRoomTypes } from '@/hooks/useRoomTypes';

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

  const { data: rooms = [] } = useRooms();
  const { mutate: createReservation } = useCreateReservation();
  const { toast } = useToast();

  // Use live room types from API
  const { data: liveRoomTypes = [] } = useRoomTypes();
  const roomTypes = liveRoomTypes.map(type => ({
    value: type.id,
    label: type.name,
    price: type.base_rate
  }));

  const calculateNights = () => {
    const diffTime = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.checkIn || !formData.checkOut) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const nights = calculateNights();
      const roomTypeData = roomTypes.find(r => r.value === formData.roomType);
      
  // Find an available room of the selected type or use first available room
  const availableRoom = rooms?.find(room => 
    room.status === 'available' && 
    room.room_type_id === formData.roomType
  ) || rooms?.find(room => room.status === 'available');

      if (!availableRoom) {
        toast({
          title: "No Rooms Available",
          description: "No rooms are available for the selected dates",
          variant: "destructive",
        });
        return;
      }

      await createReservation({
        guest_name: formData.guestName,
        guest_email: formData.email,
        guest_phone: formData.phone,
        check_in_date: formData.checkIn.toISOString().split('T')[0],
        check_out_date: formData.checkOut.toISOString().split('T')[0],
        room_id: availableRoom.id,
        adults: formData.adults,
        children: formData.children,
        room_rate: roomTypeData?.price || 85000,
        status: 'confirmed' as const
      });
      
      toast({
        title: "Success",
        description: "Reservation created successfully",
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
                <Input
                  id="guestName"
                  className="pl-10"
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  required
                />
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
                {roomTypes.map(room => (
                  <SelectItem key={room.value} value={room.value}>
                    {room.label} - ₦{room.price.toLocaleString()}/night
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
                  Total: ₦{(calculateNights() * (roomTypes.find(r => r.value === formData.roomType)?.price || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}