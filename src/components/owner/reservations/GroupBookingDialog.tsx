// @ts-nocheck
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useCreateGroupReservation } from '@/hooks/useEnhancedReservations';
import { useRooms } from '@/hooks/useRooms';
import { useCurrency } from '@/hooks/useCurrency';

interface GroupBookingDialogProps {
  open: boolean;
  onClose: () => void;
}

interface GroupGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomType: string;
  adults: number;
  children: number;
  individualPayment?: boolean;
}

export default function GroupBookingDialog({ open, onClose }: GroupBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    groupName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
    specialRequests: '',
    paymentMode: 'organizer_pays' as 'organizer_pays' | 'split_individual' | 'hybrid'
  });
  
  const [guests, setGuests] = useState<GroupGuest[]>([
    {
      id: '1',
      name: '',
      email: '',
      phone: '',
      roomType: '',
      adults: 1,
      children: 0,
      individualPayment: false
    }
  ]);

  const { data: roomsData } = useRooms();
  const roomTypes = roomsData?.roomTypes || [];
  const createGroupReservation = useCreateGroupReservation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const addGuest = () => {
    setGuests([...guests, {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      roomType: '',
      adults: 1,
      children: 0,
      individualPayment: false
    }]);
  };

  const removeGuest = (id: string) => {
    if (guests.length > 1) {
      setGuests(guests.filter(g => g.id !== id));
    }
  };

  const updateGuest = (id: string, field: keyof GroupGuest, value: any) => {
    setGuests(guests.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const calculateNights = () => {
    const diffTime = Math.abs(formData.checkOut.getTime() - formData.checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return guests.reduce((total, guest) => {
      const roomType = roomTypes.find(rt => rt.id === guest.roomType);
      return total + (roomType?.base_rate || 0) * nights;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.groupName || !formData.contactPerson || guests.some(g => !g.name || !g.roomType)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for group and guests",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await createGroupReservation.mutateAsync({
        group_name: formData.groupName,
        organizer_name: formData.contactPerson,
        organizer_email: formData.contactEmail,
        organizer_phone: formData.contactPhone,
        check_in_date: formData.checkIn.toISOString().split('T')[0],
        check_out_date: formData.checkOut.toISOString().split('T')[0],
        payment_mode: formData.paymentMode,
        special_requests: formData.specialRequests,
        guests: guests.map(guest => ({
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          room_type_id: guest.roomType,
          adults: guest.adults,
          children: guest.children,
          individual_payment: guest.individualPayment
        }))
      });
      
      toast({
        title: "Success",
        description: `Group booking created for ${guests.length} guests`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to create group booking",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Booking
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Information */}
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Group Name *</Label>
                  <Input
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder="Conference attendees, Wedding party, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.checkIn, "PPP")}
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
                        {format(formData.checkOut, "PPP")}
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
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select 
                  value={formData.paymentMode} 
                  onValueChange={(value: 'organizer_pays' | 'split_individual' | 'hybrid') => 
                    setFormData({ ...formData, paymentMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer_pays">Organizer Pays All</SelectItem>
                    <SelectItem value="split_individual">Individual Payments</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Organizer deposit + Individual balance)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how payment will be handled for this group booking
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Guests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Guests ({guests.length})</CardTitle>
                <Button type="button" onClick={addGuest} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guest
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {guests.map((guest, index) => (
                <Card key={guest.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Guest {index + 1}</h4>
                      {guests.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeGuest(guest.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Name *</Label>
                        <Input
                          value={guest.name}
                          onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={guest.email}
                          onChange={(e) => updateGuest(guest.id, 'email', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input
                          value={guest.phone}
                          onChange={(e) => updateGuest(guest.id, 'phone', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Room Type *</Label>
                        <Select 
                          value={guest.roomType} 
                          onValueChange={(value) => updateGuest(guest.id, 'roomType', value)}
                        >
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
                      <div className="space-y-1">
                        <Label>Adults</Label>
                        <Select 
                          value={guest.adults.toString()} 
                          onValueChange={(value) => updateGuest(guest.id, 'adults', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Children</Label>
                        <Select 
                          value={guest.children.toString()} 
                          onValueChange={(value) => updateGuest(guest.id, 'children', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label>Special Requests</Label>
            <Textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              rows={3}
              placeholder="Group dining arrangements, meeting room requirements, etc."
            />
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Group:</span>
                  <span>{formData.groupName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests:</span>
                  <span>{guests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{calculateNights()} nights</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Group Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}