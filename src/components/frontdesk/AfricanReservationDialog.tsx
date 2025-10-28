import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Users, CreditCard, AlertCircle, Clock, Shield, Phone, Mail } from "lucide-react";
import { SoftHoldReservationData, useCreateSoftHoldReservation, useRoomTypeInventory } from "@/hooks/useAfricanReservationSystem";
import { useCurrency } from "@/hooks/useCurrency";
import { useVisibilityRehydrate } from "@/hooks/useVisibilityRehydrate";

const formSchema = z.object({
  guest_name: z.string().min(1, "Guest name is required"),
  guest_email: z.string().email("Valid email required").optional().or(z.literal("")),
  guest_phone: z.string().min(10, "Valid phone number required"),
  guest_id_number: z.string().optional(),
  room_type_id: z.string().min(1, "Room type is required"),
  check_in_date: z.string().min(1, "Check-in date is required"),
  check_out_date: z.string().min(1, "Check-out date is required"),
  adults: z.number().min(1, "At least 1 adult required"),
  children: z.number().min(0),
  room_rate: z.number().min(0),
  booking_source: z.enum(["online", "walk_in", "phone", "email"]),
  payment_method: z.enum(["prepaid", "pay_on_arrival", "pay_later"]),
  requires_verification: z.boolean().default(false),
  special_requests: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AfricanReservationDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AfricanReservationDialog({ 
  trigger, 
  open, 
  onOpenChange 
}: AfricanReservationDialogProps) {
  // Phase 2: Listen to parent rehydration events (FrontDeskDashboard handles mount rehydration)
  useVisibilityRehydrate({ 
    onMount: false, 
    queryKeys: ['room-type-inventory', 'reservations'] 
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { formatPrice } = useCurrency();
  
  const { data: roomTypes = [] } = useRoomTypeInventory();
  const createReservation = useCreateSoftHoldReservation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      guest_id_number: "",
      room_type_id: "",
      check_in_date: new Date().toISOString().split('T')[0],
      check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      adults: 1,
      children: 0,
      room_rate: 0,
      booking_source: "walk_in",
      payment_method: "pay_on_arrival",
      requires_verification: false,
      special_requests: "",
    },
  });

  const watchedValues = form.watch();
  const selectedRoomType = roomTypes.find(rt => rt.id === watchedValues.room_type_id);
  
  // Calculate booking details
  const checkInDate = new Date(watchedValues.check_in_date);
  const checkOutDate = new Date(watchedValues.check_out_date);
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalAmount = nights * watchedValues.room_rate;

  // Determine booking risk level
  const getRiskLevel = () => {
    if (watchedValues.payment_method === 'prepaid') return 'low';
    if (watchedValues.booking_source === 'walk_in') return 'low';
    if (watchedValues.payment_method === 'pay_later') return 'medium';
    if (!watchedValues.guest_email) return 'high';
    return 'medium';
  };

  const riskLevel = getRiskLevel();
  const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  const handleRoomTypeChange = (roomTypeId: string) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (roomType) {
      form.setValue('room_rate', roomType.base_rate);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Ensure all required fields are present
      const reservationData: SoftHoldReservationData = {
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        guest_id_number: data.guest_id_number,
        room_type_id: data.room_type_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        adults: data.adults,
        children: data.children,
        room_rate: data.room_rate,
        booking_source: data.booking_source,
        requires_verification: data.requires_verification,
        payment_method: data.payment_method,
        special_requests: data.special_requests,
      };
      
      await createReservation.mutateAsync(reservationData);
      setIsOpen(false);
      onOpenChange?.(false);
      form.reset();
      setCurrentStep(1);
    } catch (error) {
      console.error('Reservation creation failed:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
    if (!open) {
      form.reset();
      setCurrentStep(1);
    }
  };

  return (
    <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            New Reservation - African PMS
          </DialogTitle>
          <DialogDescription>
            Smart soft-hold reservation system with anti-overbooking protection
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          
          <Badge className={`${riskColors[riskLevel]} border`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Guest Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Guest Information
                  </CardTitle>
                  <CardDescription>
                    Enter guest details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guest_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter guest name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guest_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+234 xxx xxx xxxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guest_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="guest@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guest_id_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="National ID, Passport, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="booking_source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Source</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="walk_in">Walk-in</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requires_verification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Requires Verification
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              SMS verification for new guests
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Room & Dates */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Room Selection & Dates
                  </CardTitle>
                  <CardDescription>
                    Choose room type and stay duration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="room_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleRoomTypeChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roomTypes.map((roomType) => (
                              <SelectItem key={roomType.id} value={roomType.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{roomType.name}</span>
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className="text-sm text-muted-foreground">
                                      {formatPrice(roomType.base_rate)}/night
                                    </span>
                                    <Badge variant={roomType.available_count > 0 ? "secondary" : "destructive"}>
                                      {roomType.available_count} available
                                    </Badge>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedRoomType && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Max Occupancy:</span>
                          <div className="font-medium">{selectedRoomType.max_occupancy} guests</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Available:</span>
                          <div className="font-medium">{selectedRoomType.available_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reserved:</span>
                          <div className="font-medium">{selectedRoomType.reserved_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <div className="font-medium">{selectedRoomType.total_count}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="check_in_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-in Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="check_out_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-out Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="adults"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adults</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="children"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Children</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="room_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Rate (per night)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {nights} night(s) × {formatPrice(watchedValues.room_rate)}
                      </span>
                      <span className="font-bold text-lg">
                        Total: {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment & Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prepaid">Prepaid (Immediate payment)</SelectItem>
                              <SelectItem value="pay_on_arrival">Pay on Arrival</SelectItem>
                              <SelectItem value="pay_later">Pay Later (Corporate/Credit)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedValues.payment_method !== 'prepaid' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Auto-Expiry Warning</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          {watchedValues.payment_method === 'pay_on_arrival' 
                            ? 'This reservation will auto-expire in 6 hours if payment is not received.'
                            : 'This reservation is for corporate/credit guests and requires manual approval.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reservation Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Guest:</span>
                        <span className="font-medium">{watchedValues.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Room Type:</span>
                        <span className="font-medium">{selectedRoomType?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span className="font-medium">{new Date(watchedValues.check_in_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span className="font-medium">{new Date(watchedValues.check_out_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span className="font-medium">{watchedValues.adults + watchedValues.children} ({watchedValues.adults}A, {watchedValues.children}C)</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Booking Type:</span>
                        <span>{watchedValues.payment_method === 'prepaid' ? 'Hard Assignment' : 'Soft Hold'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="special_requests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special requests or notes..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between pt-6 border-t">
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
              
              <div className="ml-auto flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                
                {currentStep < 3 ? (
                  <Button 
                    type="button" 
                    onClick={() => setCurrentStep(currentStep + 1)}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={createReservation.isPending}
                  >
                    {createReservation.isPending ? "Creating..." : "Create Reservation"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}