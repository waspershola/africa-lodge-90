import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Plus, Minus, Users, Building, Search } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateReservation, useRoomAvailability } from '@/hooks/useApi';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalStays?: number;
}

interface CorporateAccount {
  id: string;
  name: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  contactPerson: string;
}

interface QuickBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledRoom?: string;
  prefilledDate?: Date;
}

export default function QuickBookingForm({ 
  open, 
  onOpenChange, 
  prefilledRoom, 
  prefilledDate 
}: QuickBookingFormProps) {
  const [bookingType, setBookingType] = useState<'walk-in' | 'returning' | 'corporate' | 'ota'>('walk-in');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedCorporate, setSelectedCorporate] = useState<CorporateAccount | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  
  const [formData, setFormData] = useState({
    guestName: '',
    email: '',
    phone: '',
    company: '',
    checkIn: prefilledDate || new Date(),
    checkOut: undefined as Date | undefined,
    roomType: '',
    room: prefilledRoom || '',
    adults: 1,
    children: 0,
    specialRequests: '',
    paymentMode: 'cash',
    source: 'walk-in',
    corporateRate: false,
    depositAmount: 0
  });

  const createReservation = useCreateReservation();
  const { data: roomAvailability = [] } = useRoomAvailability(formData.checkIn, formData.checkOut);

  // Mock guest data
  const mockGuests: Guest[] = [
    {
      id: 'G001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+234 801 234 5678',
      totalStays: 5
    },
    {
      id: 'G002',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+234 802 345 6789',
      company: 'Tech Corp Ltd',
      totalStays: 3
    },
    {
      id: 'G003',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+234 803 456 7890',
      totalStays: 8
    }
  ];

  // Mock corporate accounts
  const mockCorporateAccounts: CorporateAccount[] = [
    {
      id: 'CORP001',
      name: 'Tech Corp Ltd',
      email: 'bookings@techcorp.com',
      creditLimit: 2000000,
      currentBalance: 450000,
      contactPerson: 'Sarah Wilson'
    },
    {
      id: 'CORP002', 
      name: 'Global Industries',
      email: 'travel@global.com',
      creditLimit: 5000000,
      currentBalance: 1200000,
      contactPerson: 'David Brown'
    }
  ];

  const roomTypes = [
    { value: 'standard', label: 'Standard Room', price: 85000 },
    { value: 'deluxe', label: 'Deluxe King', price: 125000 },
    { value: 'suite', label: 'Family Suite', price: 185000 },
    { value: 'presidential', label: 'Presidential Suite', price: 350000 }
  ];

  const paymentModes = [
    { value: 'cash', label: 'Cash Payment' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'corporate', label: 'Corporate Account' },
    { value: 'cheque', label: 'Cheque' }
  ];

  // Filter guests based on search
  const filteredGuests = mockGuests.filter(guest =>
    guest.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
    guest.email.toLowerCase().includes(guestSearch.toLowerCase()) ||
    guest.phone.includes(guestSearch)
  );

  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormData({
      ...formData,
      guestName: guest.name,
      email: guest.email,
      phone: guest.phone,
      company: guest.company || '',
      source: 'returning'
    });
  };

  const handleCorporateSelect = (corporate: CorporateAccount) => {
    setSelectedCorporate(corporate);
    setFormData({
      ...formData,
      company: corporate.name,
      paymentMode: 'corporate',
      corporateRate: true,
      source: 'corporate'
    });
  };

  const calculateNights = () => {
    if (formData.checkIn && formData.checkOut) {
      return differenceInDays(formData.checkOut, formData.checkIn);
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const roomType = roomTypes.find(r => r.value === formData.roomType);
    if (nights && roomType) {
      const basePrice = roomType.price * nights;
      // Corporate rate discount
      return formData.corporateRate ? basePrice * 0.9 : basePrice;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.checkIn || !formData.checkOut || !formData.guestName || !formData.email || !formData.roomType) {
      return;
    }

    const nights = calculateNights();
    const amount = calculateTotal();

    createReservation.mutate({
      guestName: formData.guestName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      roomType: roomTypes.find(r => r.value === formData.roomType)?.label || formData.roomType,
      room: formData.room || 'Auto-assign',
      guests: formData.adults + formData.children,
      nights,
      amount,
      source: formData.source,
      specialRequests: formData.specialRequests,
      paymentMode: formData.paymentMode,
      corporateAccount: selectedCorporate?.id,
      depositAmount: formData.depositAmount
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setFormData({
          guestName: '',
          email: '',
          phone: '',
          company: '',
          checkIn: new Date(),
          checkOut: undefined,
          roomType: '',
          room: '',
          adults: 1,
          children: 0,
          specialRequests: '',
          paymentMode: 'cash',
          source: 'walk-in',
          corporateRate: false,
          depositAmount: 0
        });
        setSelectedGuest(null);
        setSelectedCorporate(null);
        setGuestSearch('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Booking</DialogTitle>
          <DialogDescription>
            Create a new reservation with enhanced booking options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={bookingType} onValueChange={(value) => setBookingType(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="walk-in">Walk-in</TabsTrigger>
            <TabsTrigger value="returning">Returning Guest</TabsTrigger>
            <TabsTrigger value="corporate">Corporate</TabsTrigger>
            <TabsTrigger value="ota">OTA Import</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Walk-in Guest */}
            <TabsContent value="walk-in" className="space-y-4">
              <h3 className="text-lg font-semibold">New Guest Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Name *</Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Returning Guest */}
            <TabsContent value="returning" className="space-y-4">
              <h3 className="text-lg font-semibold">Select Existing Guest</h3>
              
              <div className="space-y-2">
                <Label htmlFor="guestSearch">Search Guest</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="guestSearch"
                    placeholder="Search by name, email, or phone..."
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredGuests.map(guest => (
                  <Card 
                    key={guest.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedGuest?.id === guest.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleGuestSelect(guest)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{guest.name}</div>
                          <div className="text-sm text-muted-foreground">{guest.email}</div>
                          <div className="text-sm text-muted-foreground">{guest.phone}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {guest.totalStays} stays
                          </Badge>
                          {guest.company && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {guest.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Corporate Booking */}
            <TabsContent value="corporate" className="space-y-4">
              <h3 className="text-lg font-semibold">Corporate Account</h3>
              
              <div className="grid gap-4">
                {mockCorporateAccounts.map(corporate => (
                  <Card 
                    key={corporate.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedCorporate?.id === corporate.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleCorporateSelect(corporate)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{corporate.name}</div>
                            <div className="text-sm text-muted-foreground">{corporate.email}</div>
                            <div className="text-sm text-muted-foreground">Contact: {corporate.contactPerson}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            Credit Limit: ₦{corporate.creditLimit.toLocaleString()}
                          </div>
                          <div className="text-sm">
                            Current Balance: ₦{corporate.currentBalance.toLocaleString()}
                          </div>
                          <Badge 
                            variant={corporate.currentBalance < corporate.creditLimit * 0.8 ? 'default' : 'destructive'}
                          >
                            {((corporate.creditLimit - corporate.currentBalance) / corporate.creditLimit * 100).toFixed(0)}% Available
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedCorporate && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guestName">Guest Name *</Label>
                      <Input
                        id="guestName"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* OTA Import */}
            <TabsContent value="ota" className="space-y-4">
              <h3 className="text-lg font-semibold">OTA Import (Coming Soon)</h3>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      Connect with leading OTA platforms to import bookings automatically
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Badge variant="outline">Booking.com</Badge>
                      <Badge variant="outline">Expedia</Badge>
                      <Badge variant="outline">Airbnb</Badge>
                      <Badge variant="outline">Hotels.com</Badge>
                    </div>
                    <Button variant="outline" disabled>
                      Configure OTA Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stay Details - Common for all booking types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Stay Details</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Check-in Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.checkIn && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.checkIn ? format(formData.checkIn, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.checkIn}
                        onSelect={(date) => setFormData({ ...formData, checkIn: date || new Date() })}
                        initialFocus
                        className="pointer-events-auto"
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
                          !formData.checkOut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.checkOut ? format(formData.checkOut, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.checkOut}
                        onSelect={(date) => setFormData({ ...formData, checkOut: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Room Type *</Label>
                  <Select value={formData.roomType} onValueChange={(value) => setFormData({ ...formData, roomType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(room => (
                        <SelectItem key={room.value} value={room.value}>
                          <div className="flex justify-between w-full">
                            <span>{room.label}</span>
                            <span className="text-muted-foreground ml-4">
                              ₦{formData.corporateRate ? (room.price * 0.9).toLocaleString() : room.price.toLocaleString()}/night
                              {formData.corporateRate && <Badge variant="outline" className="ml-1">10% off</Badge>}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={formData.paymentMode} onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map(payment => (
                        <SelectItem key={payment.value} value={payment.value}>
                          {payment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Guest Count */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{formData.adults}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, adults: formData.adults + 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Children</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center">{formData.children}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, children: formData.children + 1 })}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Deposit Amount */}
              {formData.paymentMode !== 'corporate' && (
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (₦)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: Number(e.target.value) })}
                    placeholder="Enter deposit amount"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {formData.checkIn && formData.checkOut && formData.roomType && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Nights:</span>
                    <span>{calculateNights()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room Rate:</span>
                    <span>₦{roomTypes.find(r => r.value === formData.roomType)?.price.toLocaleString()}/night</span>
                  </div>
                  {formData.corporateRate && (
                    <div className="flex justify-between text-green-600">
                      <span>Corporate Discount (10%):</span>
                      <span>-₦{((roomTypes.find(r => r.value === formData.roomType)?.price || 0) * calculateNights() * 0.1).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₦{calculateTotal().toLocaleString()}</span>
                  </div>
                  {formData.depositAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Deposit Paid:</span>
                      <span>₦{formData.depositAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.depositAmount > 0 && (
                    <div className="flex justify-between font-semibold text-orange-600">
                      <span>Balance Due:</span>
                      <span>₦{(calculateTotal() - formData.depositAmount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createReservation.isPending}
              >
                {createReservation.isPending ? 'Creating...' : 'Create Booking'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}