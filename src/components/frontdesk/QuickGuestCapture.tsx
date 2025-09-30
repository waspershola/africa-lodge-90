import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard, 
  User, 
  Phone, 
  IdCard,
  Printer,
  Clock,
  CheckCircle,
  Search,
  Plus,
  UserCheck,
  Calendar,
  DollarSign,
  Globe,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useGuestSearch, useRecentGuests } from "@/hooks/useGuestSearch";
import { useGuestContactManager } from "@/hooks/useGuestContactManager";
import { useRoomStatusManager } from "@/hooks/useRoomStatusManager";
import { useAtomicCheckIn } from "@/hooks/useAtomicCheckIn";
import { RateSelectionComponent } from "./RateSelectionComponent";
import { ProcessingStateManager } from "./ProcessingStateManager";
import type { Room } from "./RoomGrid";

interface QuickGuestCaptureProps {
  room?: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'assign' | 'walkin' | 'check-in' | 'check-out' | 'assign-room' | 'extend-stay' | 'transfer-room' | 'add-service' | 'work-order' | 'housekeeping';
  onComplete: (guestData: any) => void;
}

interface GuestFormData {
  guestName: string;
  phone: string;
  email: string;
  nationality: string;
  sex: string;
  occupation: string;
  idType: string;
  idNumber: string;
  paymentMode: string;
  depositAmount: string;
  printNow: boolean;
  notes: string;
  checkInDate: string;
  checkOutDate: string;
  roomRate: number;
  totalAmount: number;
  numberOfNights: number;
}

interface RecentGuest {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality?: string;
  sex?: string;
  occupation?: string;
  id_type?: string;
  id_number?: string;
  last_stay_date?: string;
  total_stays: number;
  vip_status?: string;
}

const ID_TYPES = [
  { value: 'national-id', label: 'National ID' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers-license', label: "Driver's License" },
  { value: 'voters-card', label: "Voter's Card" },
];

const NATIONALITIES = [
  'Nigerian', 'American', 'British', 'Canadian', 'German', 'French', 
  'South African', 'Ghanaian', 'Kenyan', 'Egyptian', 'Other'
];

const OCCUPATIONS = [
  'Business Executive', 'Government Official', 'Doctor', 'Lawyer', 'Engineer',
  'Teacher/Professor', 'Consultant', 'Entrepreneur', 'Student', 'Retired', 'Other'
];

export const QuickGuestCapture = ({
  room,
  open,
  onOpenChange,
  action,
  onComplete,
}: QuickGuestCaptureProps) => {
  const { toast } = useToast();
  const { enabledMethods } = usePaymentMethods();
  const { data: recentGuests } = useRecentGuests();
  const { saveGuestContactAsync, searchGuestContacts, quickContactLookup } = useGuestContactManager();
  const { checkIn: atomicCheckIn, isLoading: isAtomicCheckInLoading } = useAtomicCheckIn();
  const { quickCheckIn, isLoading: isStatusLoading } = useRoomStatusManager();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | undefined>();
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [selectedGuest, setSelectedGuest] = useState<RecentGuest | null>(null);
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [guestSearchValue, setGuestSearchValue] = useState("");
  const { data: searchResults } = useGuestSearch(guestSearchValue);
  
  const [formData, setFormData] = useState<GuestFormData>(() => {
    const currentDate = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    const checkoutDate = nextDate.toISOString().split('T')[0];
    
    return {
      guestName: '',  // Always start with clean form
      phone: '',
      email: '',
      nationality: '',
      sex: '',
      occupation: '',
      idType: 'national-id',
      idNumber: '',
      paymentMode: 'cash',
      depositAmount: '0',
      printNow: false,
      notes: '',
      checkInDate: currentDate,
      checkOutDate: checkoutDate,
      roomRate: 0,
      totalAmount: 0,
      numberOfNights: 1,
    };
  });

  // Detect reserved room and auto-set to existing guest mode ONLY for reserved rooms during check-in
  useEffect(() => {
    if (room?.status === 'reserved' && (room as any).current_reservation && action === 'check-in') {
      setGuestMode('existing');
      const reservation = (room as any).current_reservation;
      const guestData = {
        id: reservation.id,
        name: reservation.guest_name,
        phone: reservation.guest_phone || '',
        email: reservation.guest_email || '',
        nationality: '',
        sex: '',
        occupation: '',
        id_type: '',
        id_number: '',
        last_stay_date: '',
        total_stays: 0,
        vip_status: ''
      };
      setSelectedGuest(guestData);
      setGuestSearchValue(reservation.guest_name);
      
      // Update form data with reservation info
      setFormData(prev => ({
        ...prev,
        guestName: reservation.guest_name || '',
        phone: reservation.guest_phone || '',
        email: reservation.guest_email || '',
        checkInDate: reservation.check_in_date || prev.checkInDate,
        checkOutDate: reservation.check_out_date || prev.checkOutDate,
        roomRate: room.room_type?.base_rate || 0,
        totalAmount: reservation.total_amount || 0,
        numberOfNights: Math.ceil((new Date(reservation.check_out_date || '').getTime() - new Date(reservation.check_in_date || '').getTime()) / (1000 * 60 * 60 * 24)) || 1,
        depositAmount: reservation.total_amount?.toString() || '0'
      }));
    } else {
      // For non-reserved rooms or other actions, ensure form is clean
      setGuestMode('new');
      setSelectedGuest(null);
      setGuestSearchValue('');
    }
  }, [room, action]);

  // Combine search results with recent guests
  const filteredGuests = useMemo(() => {
    if (guestSearchValue.length >= 2) {
      return searchResults || [];
    }
    return recentGuests?.slice(0, 10) || [];
  }, [searchResults, recentGuests, guestSearchValue]);

  const getActionTitle = () => {
    switch (action) {
      case 'assign': 
      case 'assign-room': 
        return 'Assign Room';
      case 'walkin': 
      case 'check-in': 
        return 'Check-in Guest';
      case 'check-out': 
        return 'Check-out Guest';
      case 'extend-stay': 
        return 'Extend Stay';
      case 'transfer-room': 
        return 'Transfer Room';
      case 'add-service': 
        return 'Add Service';
      case 'work-order': 
        return 'Create Work Order';
      case 'housekeeping': 
        return 'Housekeeping Request';
      default: 
        return 'Guest Registration';
    }
  };

  // Skip room requirement for certain actions
  if (!room && !['check-in', 'check-out', 'extend-stay', 'transfer-room', 'add-service', 'work-order', 'housekeeping'].includes(action)) {
    return null;
  }

  const handleGuestSelect = (guest: RecentGuest) => {
    setSelectedGuest(guest);
    setFormData(prev => ({
      ...prev,
      guestName: guest.name,
      phone: guest.phone,
      email: guest.email,
      nationality: guest.nationality || '',
      sex: guest.sex || '',
      occupation: guest.occupation || '',
      idType: guest.id_type || '',
      idNumber: guest.id_number || '',
    }));
    setGuestSearchOpen(false);
    setGuestSearchValue(guest.name);
  };

  const handleGuestModeChange = (mode: 'existing' | 'new') => {
    setGuestMode(mode);
    if (mode === 'new') {
      setSelectedGuest(null);
      setGuestSearchValue("");
        setFormData(prev => ({
          ...prev,
          guestName: '',
          phone: '',
          email: '',
          nationality: '',
          sex: '',
          occupation: '',
          idType: '',
          idNumber: '',
        }));
    }
  };

  const handleInputChange = (field: keyof GuestFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for existing guest mode
    if (guestMode === 'existing' && !selectedGuest) {
      toast({
        title: "Validation Error",
        description: "Please select an existing guest or create a new one",
        variant: "destructive",
      });
      return;
    }

    if (!formData.guestName.trim()) {
      toast({
        title: "Validation Error",
        description: "Guest name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    // Nationality, sex, and occupation are now optional fields

    // Date validation for walk-in actions
    if ((action === 'walkin' || action === 'assign') && formData.checkOutDate <= formData.checkInDate) {
      toast({
        title: "Validation Error",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    if (isProcessing || isStatusLoading || isAtomicCheckInLoading) {
      return;
    }
    
    setIsProcessing(true);
    setProcessingStartTime(Date.now());
    
    // Set timeout to prevent infinite processing
    const processingTimeout = setTimeout(() => {
      if (isProcessing) {
        setIsProcessing(false);
        setProcessingStartTime(undefined);
        toast({
          title: "Processing Timeout",
          description: "The operation took too long. Please try again.",
          variant: "destructive",
        });
      }
    }, 30000); // 30 seconds timeout

    try {
      // Real backend integration
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      let guestId = selectedGuest?.id;
      
      // ATOMIC TRANSACTION FIX: Enhanced guest contact management with rollback
      if (guestMode === 'new' || !guestId) {
        try {
          // Determine the correct source type
          let sourceType: 'create_user' | 'check_in' | 'assign_room' | 'walk_in' | 'transfer' | 'reservation' | 'manual';
          if (action === 'walkin') {
            sourceType = 'walk_in';
          } else if (action === 'assign') {
            sourceType = 'assign_room';
          } else if (action === 'check-in') {
            sourceType = 'check_in';
          } else {
            sourceType = 'manual';
          }

          const guestContactData = {
            firstName: formData.guestName.split(' ')[0],
            lastName: formData.guestName.split(' ').slice(1).join(' ') || '',
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            nationality: formData.nationality || undefined,
            idType: formData.idType || undefined,
            idNumber: formData.idNumber || undefined,
            vipStatus: 'regular' as const,
            source: sourceType
          };

          const result = await saveGuestContactAsync(guestContactData);
          guestId = result.guest.id;
          
          // Update form with saved guest data for consistency
          if (result.isNew) {
            console.log(`New guest contact created: ${result.guest.first_name} ${result.guest.last_name}`);
          } else {
            console.log(`Existing guest contact updated: ${result.guest.first_name} ${result.guest.last_name}`);
          }
        } catch (error) {
          console.error('ERROR: Guest contact save failed:', error);
          // ROLLBACK FIX: Don't proceed with room operations if guest save fails
          throw new Error(`Guest contact save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      let updatedRoom = { ...room };

      // Handle different actions
      if (action === 'assign') {
        // Create reservation for room assignment
        const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const reservationData = {
          guest_id: guestId,
          guest_name: formData.guestName,
          guest_email: formData.email,
          guest_phone: formData.phone,
          room_id: room?.id,
          check_in_date: formData.checkInDate,
          check_out_date: formData.checkOutDate,
          adults: 1,
          children: 0,
          room_rate: formData.roomRate,
          total_amount: formData.totalAmount,
          status: 'confirmed',
          reservation_number: reservationNumber,
          tenant_id: user.user_metadata?.tenant_id
        };

        const { data: reservation, error: reservationError } = await supabase
          .from('reservations')
          .insert([reservationData])
          .select()
          .single();

        if (reservationError) throw reservationError;

        // Update room status to reserved with validation
        const validStatuses = ['available', 'occupied', 'reserved', 'out_of_service', 'oos', 'overstay', 'dirty', 'clean', 'maintenance', 'checkout'];
        const newStatus = 'reserved';
        
        if (!validStatuses.includes(newStatus)) {
          throw new Error(`Invalid room status: ${newStatus}`);
        }
        
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', room?.id);

        if (roomError) {
          console.error('Room status update error:', roomError);
          throw new Error(`Failed to update room status: ${roomError.message}`);
        }

        updatedRoom.status = 'reserved';
        updatedRoom.guest = formData.guestName;
        updatedRoom.checkIn = formData.checkInDate;
        updatedRoom.checkOut = formData.checkOutDate;
        
        } else if (action === 'walkin' || action === 'check-in') {
        // PHASE 1 FIX: Use atomic check-in for reliable, single-transaction check-in
        let reservationId: string;
        
        console.log(`[Atomic Check-in] Processing ${action} for room ${room?.number}`, { 
          roomId: room?.id, 
          guestName: formData.guestName 
        });

        try {
          if (action === 'check-in' && (room as any).current_reservation) {
            // Use existing reservation for check-in
            reservationId = (room as any).current_reservation.id;
            console.log('[Atomic Check-in] Using existing reservation:', reservationId);
            
            // Prepare guest data for atomic function
            const guestData = guestMode === 'new' || !selectedGuest ? {
              first_name: formData.guestName.split(' ')[0],
              last_name: formData.guestName.split(' ').slice(1).join(' ') || '',
              email: formData.email || undefined,
              phone: formData.phone || undefined,
              guest_id_number: formData.idNumber || undefined,
              nationality: formData.nationality || undefined,
            } : undefined;

            // Call atomic check-in function
            const result = await atomicCheckIn({
              reservationId,
              roomId: room?.id!,
              guestData,
              initialCharges: []  // Charges already exist from reservation
            });

            if (!result.success) {
              throw new Error(result.message || 'Check-in failed');
            }

            console.log('[Atomic Check-in] Success:', result);
            
          } else {
            // Walk-in: Create reservation and check-in atomically
            console.log('[Atomic Check-in] Creating walk-in reservation');
            
            // First create the reservation
            const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            const reservationData = {
              guest_id: guestId,
              guest_name: formData.guestName,
              guest_email: formData.email,
              guest_phone: formData.phone,
              room_id: room?.id,
              check_in_date: formData.checkInDate,
              check_out_date: formData.checkOutDate,
              adults: 1,
              children: 0,
              room_rate: formData.roomRate,
              total_amount: formData.totalAmount,
              status: 'confirmed',  // Will be updated to checked_in by atomic function
              reservation_number: reservationNumber,
              tenant_id: user.user_metadata?.tenant_id
            };

            const { data: reservation, error: reservationError } = await supabase
              .from('reservations')
              .insert([reservationData])
              .select()
              .single();

            if (reservationError) throw reservationError;
            reservationId = reservation.id;
            console.log('[Atomic Check-in] Reservation created:', reservationId);
            
            // Prepare guest data and initial charges
            const guestData = {
              first_name: formData.guestName.split(' ')[0],
              last_name: formData.guestName.split(' ').slice(1).join(' ') || '',
              email: formData.email || undefined,
              phone: formData.phone || undefined,
              guest_id_number: formData.idNumber || undefined,
              nationality: formData.nationality || undefined,
            };

            const initialCharges = [{
              charge_type: 'room',
              description: `Room ${room?.number} - ${formData.numberOfNights} night(s)`,
              amount: formData.totalAmount
            }];

            // Call atomic check-in function
            const result = await atomicCheckIn({
              reservationId,
              roomId: room?.id!,
              guestData,
              initialCharges
            });

            if (!result.success) {
              // Cleanup reservation if atomic check-in failed
              await supabase
                .from('reservations')
                .delete()
                .eq('id', reservationId);
              
              throw new Error(result.message || 'Walk-in check-in failed');
            }

            console.log('[Atomic Check-in] Walk-in success:', result);

            // Process payment if not pay later
            if (formData.paymentMode !== 'pay_later' && parseFloat(formData.depositAmount) > 0 && result.folio_id) {
              const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                  folio_id: result.folio_id,
                  amount: parseFloat(formData.depositAmount),
                  payment_method: formData.paymentMode,
                  status: 'completed',
                  tenant_id: user.user_metadata?.tenant_id
                });

              if (paymentError) {
                console.error('[Payment] Failed to record payment:', paymentError);
                toast({
                  title: "Payment Recording Failed",
                  description: "Check-in completed but payment was not recorded. Please add payment manually.",
                  variant: "destructive",
                });
              }
            }
          }

          // Update UI state - queries will be auto-invalidated by atomic check-in hook
          updatedRoom.status = 'occupied';
          updatedRoom.guest = formData.guestName;
          updatedRoom.checkIn = formData.checkInDate;
          updatedRoom.checkOut = formData.checkOutDate;
          updatedRoom.folio = {
            balance: formData.totalAmount - parseFloat(formData.depositAmount),
            isPaid: formData.paymentMode !== 'pay_later' && parseFloat(formData.depositAmount) >= formData.totalAmount
          };
          
        } catch (checkInError) {
          console.error('[Atomic Check-in] Failed:', checkInError);
          throw checkInError;
        }
      }

      onComplete(updatedRoom);

      // Invalidate rooms query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      if (formData.printNow) {
        toast({
          title: "Processing Complete",
          description: `${getActionTitle()} completed for ${formData.guestName}. Receipt sent to printer.`,
        });
      } else {
        toast({
          title: "Processing Complete", 
          description: `${getActionTitle()} completed for ${formData.guestName}. Room ${room?.number} status updated.`,
        });
      }

      // Success - clear timeout and reset processing state
      clearTimeout(processingTimeout);
      setIsProcessing(false);
      setProcessingStartTime(undefined);
      
      const updatedFormData = {
          guestName: '',
          phone: '',
          email: '',
          nationality: '',
          sex: '',
          occupation: '',
          idType: '',
          idNumber: '',
          paymentMode: 'cash',
          depositAmount: '10000',
          printNow: true,
          notes: '',
          checkInDate: new Date().toISOString().split('T')[0],
          checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          roomRate: 0,
          totalAmount: 0,
          numberOfNights: 1,
        };
        
        setFormData(updatedFormData);
        setGuestMode('existing');
        setSelectedGuest(null);
        setGuestSearchValue("");
        setShowOptionalFields(false);

        onOpenChange(false);
    } catch (error) {
      console.error('Error processing guest capture:', error);
      let errorMessage = "Failed to process guest information. Please try again.";
      
      if (error instanceof Error) {
        // Check for specific error types with better categorization
        if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
          errorMessage = "A guest with this information already exists. Please check existing reservations.";
        } else if (error.message.includes('not authenticated') || error.message.includes('permission')) {
          errorMessage = "Authentication expired or insufficient permissions. Please refresh and try again.";
        } else if (error.message.includes('room not available') || error.message.includes('room status')) {
          errorMessage = "The selected room is no longer available. Please refresh and select another room.";
        } else if (error.message.includes('constraint') || error.message.includes('violates')) {
          errorMessage = "Invalid data provided. Please check all required fields and try again.";
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = "Connection error. Please check your internet connection and try again.";
        } else if (error.message.includes('status')) {
          errorMessage = "Invalid room status. Please refresh the page and try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      clearTimeout(processingTimeout);
      setIsProcessing(false);
      setProcessingStartTime(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {getActionTitle()}
          </DialogTitle>
          <DialogDescription>
            {room ? `${getActionTitle()} for Room ${room.number} • ${room.type}` : getActionTitle()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Processing State Monitor */}
          {isProcessing && (
            <ProcessingStateManager
              isProcessing={isProcessing}
              operation={getActionTitle()}
              startTime={processingStartTime}
              onTimeout={() => {
                setIsProcessing(false);
                setProcessingStartTime(undefined);
                toast({
                  title: "Operation Timeout",
                  description: "The operation timed out. Please try again.",
                  variant: "destructive",
                });
              }}
              onCancel={() => {
                setIsProcessing(false);
                setProcessingStartTime(undefined);
                toast({
                  title: "Operation Cancelled",
                  description: "The operation was cancelled by user.",
                });
              }}
            />
          )}

          {/* Guest Selection Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={guestMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleGuestModeChange('existing')}
                  className="flex-1 text-xs"
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  Select Existing
                </Button>
                <Button
                  type="button"
                  variant={guestMode === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleGuestModeChange('new')}
                  className="flex-1 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
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
                        variant="outline"
                        role="combobox"
                        aria-expanded={guestSearchOpen}
                        className="w-full justify-between mt-1"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          {selectedGuest ? selectedGuest.name : "Search guest by name, phone or email..."}
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search guests..." 
                          value={guestSearchValue}
                          onValueChange={setGuestSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>No guest found.</CommandEmpty>
                          <CommandGroup>
                            {filteredGuests.map((guest) => (
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

              {/* New Guest Fields */}
              {guestMode === 'new' && (
                <>
                   {/* Required Guest Information */}
                   <div>
                     <Label htmlFor="guestName">Guest Name *</Label>
                     <Input
                       id="guestName"
                       value={formData.guestName}
                       onChange={(e) => handleInputChange('guestName', e.target.value)}
                       placeholder="Enter guest full name"
                       className="mt-1"
                     />
                   </div>

                   <div>
                     <Label htmlFor="phone">Phone Number *</Label>
                     <Input
                       id="phone"
                       type="tel"
                       value={formData.phone}
                       onChange={(e) => handleInputChange('phone', e.target.value)}
                       placeholder="+234 xxx xxx xxxx"
                       className="mt-1"
                     />
                   </div>

                   <div>
                     <Label htmlFor="email">Email Address</Label>
                     <Input
                       id="email"
                       type="email"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       placeholder="guest@example.com"
                       className="mt-1"
                     />
                   </div>

                   {/* Optional Guest Details */}
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <Label htmlFor="nationality">Nationality</Label>
                       <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Select nationality" />
                         </SelectTrigger>
                         <SelectContent>
                           {NATIONALITIES.map((nationality) => (
                             <SelectItem key={nationality} value={nationality}>
                               {nationality}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <Label htmlFor="sex">Sex</Label>
                       <Select value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Select sex" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="male">Male</SelectItem>
                           <SelectItem value="female">Female</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>

                   <div>
                     <Label htmlFor="occupation">Occupation</Label>
                     <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                       <SelectTrigger className="mt-1">
                         <SelectValue placeholder="Select occupation" />
                       </SelectTrigger>
                       <SelectContent>
                         {OCCUPATIONS.map((occupation) => (
                           <SelectItem key={occupation} value={occupation}>
                             {occupation}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Optional ID Fields */}
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <Label className="text-sm text-muted-foreground">ID Information (Optional)</Label>
                       <Button
                         type="button"
                         variant="ghost"
                         size="sm"
                         onClick={() => setShowOptionalFields(!showOptionalFields)}
                         className="text-xs"
                       >
                         {showOptionalFields ? 'Hide' : 'Show'} ID Fields
                       </Button>
                     </div>

                     {showOptionalFields && (
                       <div className="space-y-3">
                         <div>
                           <Label htmlFor="idType">ID Type</Label>
                           <Select value={formData.idType} onValueChange={(value) => handleInputChange('idType', value)}>
                             <SelectTrigger className="mt-1">
                               <SelectValue placeholder="Select ID type" />
                             </SelectTrigger>
                             <SelectContent>
                               {ID_TYPES.map((idType) => (
                                 <SelectItem key={idType.value} value={idType.value}>
                                   {idType.label}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>

                         <div>
                           <Label htmlFor="idNumber">ID Number</Label>
                           <Input
                             id="idNumber"
                             value={formData.idNumber}
                             onChange={(e) => handleInputChange('idNumber', e.target.value)}
                             placeholder="Enter ID number"
                             className="mt-1"
                           />
                         </div>
                       </div>
                     )}
                   </div>
                </>
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
                    {selectedGuest.id_type && selectedGuest.id_number && (
                      <div>🆔 {ID_TYPES.find(t => t.value === selectedGuest.id_type)?.label}: {selectedGuest.id_number}</div>
                    )}
                    {selectedGuest.last_stay_date && (
                      <div>🏨 Last stay: {new Date(selectedGuest.last_stay_date).toLocaleDateString()} • {selectedGuest.total_stays} stays</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stay Dates - Only for assign and walk-in */}
          {(action === 'assign' || action === 'walkin') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Stay Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="checkInDate">Check-in Date *</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOutDate">Check-out Date *</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rate Selection - Only for assign and walk-in */}
          {(action === 'assign' || action === 'walkin') && (
            <>
              <RateSelectionComponent
                checkInDate={formData.checkInDate}
                checkOutDate={formData.checkOutDate}
                onRateChange={(rate, nights, total, roomTypeId) => {
                  setFormData(prev => ({
                    ...prev,
                    roomRate: rate,
                    numberOfNights: nights,
                    totalAmount: total,
                    depositAmount: total.toString(),
                    ...(roomTypeId && { roomTypeId })
                  }));
                }}
                defaultRate={room?.room_type?.base_rate || formData.roomRate}
              />
            </>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment & Deposit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="paymentMode">Payment Mode</Label>
                <Select value={formData.paymentMode} onValueChange={(value) => handleInputChange('paymentMode', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="depositAmount">
                  {action === 'walkin' ? 'Total Amount' : 'Deposit Amount'} (₦)
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="depositAmount"
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                    placeholder={formData.totalAmount > 0 ? formData.totalAmount.toString() : "10000"}
                    className="pr-20"
                  />
                  {formData.totalAmount > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      / ₦{formData.totalAmount.toLocaleString()}
                    </div>
                  )}
                </div>
                {action === 'walkin' && formData.numberOfNights > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ₦{formData.roomRate.toLocaleString()}/night × {formData.numberOfNights} nights
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Print Options */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  <Label htmlFor="printNow" className="text-sm">Print check-in slip now</Label>
                </div>
                <Switch
                  id="printNow"
                  checked={formData.printNow}
                  onCheckedChange={(checked) => handleInputChange('printNow', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing || isStatusLoading}
            >
              Cancel
            </Button>
             <Button 
               type="submit" 
               className="flex-1 gap-2"
               disabled={isProcessing || isStatusLoading || (guestMode === 'existing' && !selectedGuest)}
             >
               {(isProcessing || isStatusLoading) ? (
                 <>
                   <Clock className="h-4 w-4 animate-spin" />
                   Processing...
                 </>
               ) : (
                 <>
                   <CheckCircle className="h-4 w-4" />
                   {getActionTitle()}
                 </>
               )}
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
