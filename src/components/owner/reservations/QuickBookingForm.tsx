import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  Plane, 
  CreditCard, 
  Banknote, 
  ArrowRightLeft,
  User,
  Plus,
  Search,
  Star
} from 'lucide-react';
import { 
  useCreateReservation, 
  useGuestProfiles, 
  useCompanies, 
  useImportOTAReservation,
  useAssignRoom as autoAssignRoom,
  useRoomAvailability
} from '@/hooks/useApi';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickBookingFormProps {
  onClose?: () => void;
}

export default function QuickBookingForm({ onClose }: QuickBookingFormProps) {
  const [activeTab, setActiveTab] = useState('walk-in');
  const [formData, setFormData] = useState({
    // Guest details
    guestName: '',
    email: '',
    phone: '',
    
    // Stay details
    checkIn: undefined as Date | undefined,
    checkOut: undefined as Date | undefined,
    roomType: '',
    roomAssignment: 'auto' as 'auto' | 'manual',
    specificRoom: '',
    adults: 1,
    children: 0,
    
    // Booking details
    paymentMode: 'cash' as 'cash' | 'card' | 'transfer' | 'ota',
    source: 'walk-in',
    specialRequests: '',
    
    // Corporate/OTA specific
    companyId: '',
    otaReference: '',
    isOTA: false
  });

  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');

  // API hooks
  const createReservation = useCreateReservation();
  const importOTAReservation = useImportOTAReservation();
  const autoAssignRoom = useAutoAssignRoom();
  const { data: guestProfiles = [] } = useGuestProfiles();
  const { data: companies = [] } = useCompanies();
  const { data: roomAvailability = [] } = useRoomAvailability();

  // Room types
  const roomTypes = [
    { value: 'standard', label: 'Standard Room', price: 85000 },
    { value: 'deluxe', label: 'Deluxe King', price: 125000 },
    { value: 'family', label: 'Family Suite', price: 185000 },
    { value: 'executive', label: 'Executive Suite', price: 225000 },
    { value: 'presidential', label: 'Presidential Suite', price: 350000 }
  ];

  // Available rooms based on selection
  const availableRooms = roomAvailability
    .filter(room => room.status === 'available' && 
      (!formData.roomType || room.roomType.toLowerCase().includes(formData.roomType)))
    .map(room => ({
      number: room.roomNumber,
      type: room.roomType,
      capacity: room.capacity,
      price: room.price
    }));

  // Filtered guest profiles
  const filteredGuests = guestProfiles.filter(guest =>
    guest.name.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
    guest.phone.includes(guestSearchTerm)
  );

  const handleGuestSelect = (guest: any) => {
    setSelectedGuest(guest);
    setFormData({
      ...formData,
      guestName: guest.name,
      email: guest.email,
      phone: guest.phone
    });
    setGuestSearchTerm(guest.name);
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
      return nights * roomType.price;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.checkIn || !formData.checkOut || !formData.guestName || !formData.email) {
      return;
    }

    const nights = calculateNights();
    const roomTypeData = roomTypes.find(r => r.value === formData.roomType);
    const amount = nights * (roomTypeData?.price || 0);

    let roomNumber = formData.specificRoom;
    
    // Auto-assign room if needed
    if (formData.roomAssignment === 'auto' && !roomNumber) {
      try {
        const assignResult = await autoAssignRoom.mutateAsync({
          reservationId: 'temp-id',
          roomId: formData.specificRoom || 'auto'
        });
        roomNumber = 'auto-assigned';
      } catch (error) {
        console.error('Auto-assignment failed:', error);
        // Continue without room assignment
      }
    }

    const reservationData = {
      guestName: formData.guestName,
      email: formData.email,
      phone: formData.phone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      roomType: roomTypeData?.label || formData.roomType,
      room: roomNumber || 'Auto-assign',
      guests: formData.adults + formData.children,
      adults: formData.adults,
      children: formData.children,
      nights,
      amount,
      source: formData.source,
      paymentMode: formData.paymentMode,
      paymentStatus: formData.paymentMode === 'ota' ? 'paid' : 'pending',
      specialRequests: formData.specialRequests,
      companyId: formData.companyId || null,
      companyName: companies.find(c => c.id === formData.companyId)?.name || null,
      isOTA: formData.isOTA,
      otaReference: formData.otaReference || null
    };

    try {
      if (formData.isOTA) {
        await importOTAReservation.mutateAsync({
          guest_name: formData.guestName,
          guest_email: formData.email,
          guest_phone: formData.phone,
          check_in_date: formData.checkIn.toISOString().split('T')[0],
          check_out_date: formData.checkOut.toISOString().split('T')[0],
          room_id: 'default-room-id',
          adults: formData.adults,
          children: formData.children,
          room_rate: nights * (roomTypeData?.price || 0),
          total_amount: nights * (roomTypeData?.price || 0),
          status: 'confirmed',
          reservation_number: `OTA-${Date.now()}`,
          tenant_id: 'current'
        });
      } else {
        await createReservation.mutateAsync({
          guest_name: formData.guestName,
          guest_email: formData.email,
          guest_phone: formData.phone,
          check_in_date: formData.checkIn.toISOString().split('T')[0],
          check_out_date: formData.checkOut.toISOString().split('T')[0],
          room_id: 'default-room-id',
          adults: formData.adults,
          children: formData.children,
          room_rate: nights * (roomTypeData?.price || 0),
          total_amount: nights * (roomTypeData?.price || 0),
          status: 'confirmed',
          reservation_number: `RES-${Date.now()}`,
          tenant_id: 'current',
          checked_in_at: null,
          checked_in_by: null,
          checked_out_at: null,
          checked_out_by: null,
          guest_id_number: null,
          created_by: null
        });
      }
      
      onClose?.();
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const getVIPBadge = (vipStatus: string) => {
    const colors = {
      'Bronze': 'bg-orange-100 text-orange-800',
      'Silver': 'bg-gray-100 text-gray-800', 
      'Gold': 'bg-yellow-100 text-yellow-800',
      'Platinum': 'bg-purple-100 text-purple-800'
    };
    return colors[vipStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Quick Booking
        </CardTitle>
        <CardDescription>
          Create reservations for walk-ins, returning guests, corporate clients, and OTA imports
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="walk-in" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Walk-in
            </TabsTrigger>
            <TabsTrigger value="returning" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Returning Guest
            </TabsTrigger>
            <TabsTrigger value="corporate" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Corporate
            </TabsTrigger>
            <TabsTrigger value="ota" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              OTA Import
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Walk-in Tab */}
            <TabsContent value="walk-in" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Name *</Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value, source: 'walk-in' })}
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
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </TabsContent>

            {/* Returning Guest Tab */}
            <TabsContent value="returning" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Guest Profile</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={guestSearchTerm}
                      onChange={(e) => setGuestSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {guestSearchTerm && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {filteredGuests.map(guest => (
                      <div
                        key={guest.id}
                        className={`p-3 cursor-pointer hover:bg-muted border-b last:border-b-0 ${
                          selectedGuest?.id === guest.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => {
                          handleGuestSelect(guest);
                          setFormData({ ...formData, source: 'returning' });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{guest.name}</div>
                            <div className="text-sm text-muted-foreground">{guest.email}</div>
                            <div className="text-sm text-muted-foreground">{guest.phone}</div>
                          </div>
                          <div className="text-right">
                            <Badge className={getVIPBadge(guest.vipStatus)}>
                              {guest.vipStatus}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {guest.totalStays} stays
                            </div>
                          </div>
                        </div>
                        {guest.preferences && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Preferences: {guest.preferences}
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredGuests.length === 0 && guestSearchTerm && (
                      <div className="p-3 text-center text-muted-foreground">
                        No guests found. <Button variant="link" className="p-0 h-auto">Create new profile</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Corporate Tab */}
            <TabsContent value="corporate" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select 
                    value={formData.companyId} 
                    onValueChange={(value) => setFormData({ ...formData, companyId: value, source: 'corporate' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex justify-between w-full">
                            <span>{company.name}</span>
                            <span className="text-muted-foreground ml-4">
                              {company.discountRate}% discount
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="corpGuestName">Guest Name *</Label>
                    <Input
                      id="corpGuestName"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="corpEmail">Email Address *</Label>
                    <Input
                      id="corpEmail"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* OTA Tab */}
            <TabsContent value="ota" className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="otaReference">OTA Reference *</Label>
                    <Input
                      id="otaReference"
                      value={formData.otaReference}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        otaReference: e.target.value, 
                        source: 'OTA',
                        isOTA: true,
                        paymentMode: 'ota'
                      })}
                      placeholder="e.g., BK123456789"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>OTA Source</Label>
                    <Select 
                      value={formData.source} 
                      onValueChange={(value) => setFormData({ ...formData, source: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select OTA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking.com">Booking.com</SelectItem>
                        <SelectItem value="expedia">Expedia</SelectItem>
                        <SelectItem value="hotels.com">Hotels.com</SelectItem>
                        <SelectItem value="agoda">Agoda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="otaGuestName">Guest Name *</Label>
                    <Input
                      id="otaGuestName"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otaEmail">Email Address *</Label>
                    <Input
                      id="otaEmail"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Common Stay Details */}
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
                        {formData.checkIn ? format(formData.checkIn, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.checkIn}
                        onSelect={(date) => setFormData({ ...formData, checkIn: date })}
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
                          !formData.checkOut && "text-muted-foreground"
                        )}
                      >
                        {formData.checkOut ? format(formData.checkOut, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.checkOut}
                        onSelect={(date) => setFormData({ ...formData, checkOut: date })}
                        initialFocus
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
                            <span className="text-muted-foreground ml-4">₦{room.price.toLocaleString()}/night</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Room Assignment</Label>
                  <Select 
                    value={formData.roomAssignment} 
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      roomAssignment: value as 'auto' | 'manual',
                      specificRoom: value === 'auto' ? '' : formData.specificRoom
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-assign</SelectItem>
                      <SelectItem value="manual">Manual selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.roomAssignment === 'manual' && (
                <div className="space-y-2">
                  <Label>Specific Room</Label>
                  <Select value={formData.specificRoom} onValueChange={(value) => setFormData({ ...formData, specificRoom: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specific room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map(room => (
                        <SelectItem key={room.number} value={room.number}>
                          <div className="flex justify-between w-full">
                            <span>Room {room.number} - {room.type}</span>
                            <span className="text-muted-foreground ml-4">
                              Capacity: {room.capacity}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Adults</Label>
                  <Select 
                    value={formData.adults.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, adults: parseInt(value) })}
                  >
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
                  <Label>Children</Label>
                  <Select 
                    value={formData.children.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, children: parseInt(value) })}
                  >
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

                {activeTab !== 'ota' && (
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select 
                      value={formData.paymentMode} 
                      onValueChange={(value) => setFormData({ ...formData, paymentMode: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Card
                          </div>
                        </SelectItem>
                        <SelectItem value="transfer">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4" />
                            Bank Transfer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

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

            {/* Summary */}
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
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₦{calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Mode:</span>
                    <span className="capitalize">{formData.paymentMode}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Booking
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}