import { useState, useMemo } from "react";
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
import { RateSelectionComponent } from "./RateSelectionComponent";
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

interface MockGuest {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality?: string;
  sex?: string;
  occupation?: string;
  idType: string;
  idNumber: string;
  lastStay?: string;
  totalStays: number;
}

// Mock guest database - in a real app this would come from backend
const MOCK_GUESTS: MockGuest[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '08012345678',
    email: 'john.doe@email.com',
    idType: 'national-id',
    idNumber: 'NID123456789',
    lastStay: '2024-07-15',
    totalStays: 3
  },
  {
    id: '2', 
    name: 'Jane Smith',
    phone: '08087654321',
    email: 'jane.smith@email.com',
    idType: 'passport',
    idNumber: 'P1234567',
    lastStay: '2024-06-20',
    totalStays: 1
  },
  {
    id: '3',
    name: 'Mike Wilson',
    phone: '08098765432',
    email: 'mike.wilson@email.com',
    idType: 'drivers-license',
    idNumber: 'DL987654321',
    lastStay: '2024-08-01',
    totalStays: 5
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    phone: '08056789012',
    email: 'sarah.j@email.com',
    idType: 'national-id',
    idNumber: 'NID987654321',
    lastStay: '2024-05-10',
    totalStays: 2
  }
];

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

// Payment modes now come from usePaymentMethods hook

export const QuickGuestCapture = ({
  room,
  open,
  onOpenChange,
  action,
  onComplete,
}: QuickGuestCaptureProps) => {
  const { toast } = useToast();
  const { enabledMethods } = usePaymentMethods();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>('existing');
  const [selectedGuest, setSelectedGuest] = useState<MockGuest | null>(null);
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [guestSearchValue, setGuestSearchValue] = useState("");
  const [guestList, setGuestList] = useState<MockGuest[]>(MOCK_GUESTS);
  
  const [formData, setFormData] = useState<GuestFormData>({
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
    checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    roomRate: 0,
    totalAmount: 0,
    numberOfNights: 1,
  });

  // Filter guests based on search
  const filteredGuests = useMemo(() => {
    return guestList.filter(guest =>
      guest.name.toLowerCase().includes(guestSearchValue.toLowerCase()) ||
      guest.phone.includes(guestSearchValue) ||
      guest.email.toLowerCase().includes(guestSearchValue.toLowerCase())
    );
  }, [guestList, guestSearchValue]);

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

  const handleGuestSelect = (guest: MockGuest) => {
    setSelectedGuest(guest);
    setFormData(prev => ({
      ...prev,
      guestName: guest.name,
      phone: guest.phone,
      email: guest.email,
      idType: guest.idType,
      idNumber: guest.idNumber,
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

    if (!formData.nationality.trim()) {
      toast({
        title: "Validation Error", 
        description: "Nationality is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sex.trim()) {
      toast({
        title: "Validation Error",
        description: "Sex is required", 
        variant: "destructive",
      });
      return;
    }

    if (!formData.occupation.trim()) {
      toast({
        title: "Validation Error",
        description: "Occupation is required",
        variant: "destructive",
      });
      return;
    }

    // Date validation for walk-in actions
    if ((action === 'walkin' || action === 'assign') && formData.checkOutDate <= formData.checkInDate) {
      toast({
        title: "Validation Error",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If creating a new guest, add them to the guest list for future use
      if (guestMode === 'new') {
        const newGuest: MockGuest = {
          id: `guest_${Date.now()}`, // Simple ID generation
          name: formData.guestName,
          phone: formData.phone,
          email: formData.email,
          idType: formData.idType,
          idNumber: formData.idNumber,
          lastStay: new Date().toISOString().split('T')[0], // Today's date
          totalStays: 1
        };
        setGuestList(prev => [...prev, newGuest]);
      } else if (selectedGuest) {
        // Update existing guest's last stay info
        setGuestList(prev => prev.map(guest => 
          guest.id === selectedGuest.id 
            ? { 
                ...guest, 
                lastStay: new Date().toISOString().split('T')[0],
                totalStays: guest.totalStays + 1
              }
            : guest
        ));
      }
      
      // Update room status based on action and payment
      const updatedRoom = {
        ...room,
        status: (action === 'walkin' || action === 'check-in') ? 'occupied' as const : room?.status || 'available' as const,
        guest: formData.guestName,
        checkIn: (action === 'walkin' || action === 'check-in') ? formData.checkInDate : room?.checkIn,
        checkOut: (action === 'walkin' || action === 'check-in') ? formData.checkOutDate : room?.checkOut,
        folio: {
          balance: parseInt(formData.depositAmount) || formData.totalAmount || 0,
          isPaid: formData.paymentMode !== 'pay_later'
        }
      };

      onComplete(updatedRoom);

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

      // Reset form and states
      setFormData({
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
      });
      setGuestMode('existing');
      setSelectedGuest(null);
      setGuestSearchValue("");
      setShowOptionalFields(false);

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process guest information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
                                  {guest.lastStay && (
                                    <span className="text-xs text-muted-foreground">
                                      Last stay: {guest.lastStay} • {guest.totalStays} stays
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
                       required
                     />
                   </div>

                   <div>
                     <Label htmlFor="phone">Phone Number *</Label>
                     <Input
                       id="phone"
                       value={formData.phone}
                       onChange={(e) => handleInputChange('phone', e.target.value)}
                       placeholder="080XXXXXXXX"
                       className="mt-1"
                       required
                     />
                   </div>

                   {/* Blueprint Required Fields - Nationality, Sex, Occupation */}
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <Label htmlFor="nationality">Nationality *</Label>
                       <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Select nationality" />
                         </SelectTrigger>
                         <SelectContent>
                           {NATIONALITIES.map((nationality) => (
                             <SelectItem key={nationality} value={nationality.toLowerCase()}>
                               <div className="flex items-center gap-2">
                                 <Globe className="h-3 w-3" />
                                 {nationality}
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div>
                       <Label htmlFor="sex">Sex *</Label>
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
                     <Label htmlFor="occupation">Occupation *</Label>
                     <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                       <SelectTrigger className="mt-1">
                         <SelectValue placeholder="Select occupation" />
                       </SelectTrigger>
                       <SelectContent>
                         {OCCUPATIONS.map((occupation) => (
                           <SelectItem key={occupation} value={occupation.toLowerCase()}>
                             <div className="flex items-center gap-2">
                               <Briefcase className="h-3 w-3" />
                               {occupation}
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Optional Contact Fields */}
                   <div className="space-y-2">
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       onClick={() => setShowOptionalFields(!showOptionalFields)}
                       className="text-xs"
                     >
                       {showOptionalFields ? 'Hide' : 'Add'} ID & Email (Optional)
                     </Button>
                     
                     {showOptionalFields && (
                       <div className="space-y-3 pt-2 border-t">
                         <div>
                           <Label htmlFor="email">Email Address</Label>
                           <Input
                             id="email"
                             type="email"
                             value={formData.email}
                             onChange={(e) => handleInputChange('email', e.target.value)}
                             placeholder="guest@email.com"
                             className="mt-1"
                           />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>
                             <Label htmlFor="idType">ID Type</Label>
                             <Select value={formData.idType} onValueChange={(value) => handleInputChange('idType', value)}>
                               <SelectTrigger className="mt-1">
                                 <SelectValue placeholder="Select ID" />
                               </SelectTrigger>
                               <SelectContent>
                                 {ID_TYPES.map((type) => (
                                   <SelectItem key={type.value} value={type.value}>
                                     {type.label}
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
                    {selectedGuest.idType && selectedGuest.idNumber && (
                      <div>🆔 {ID_TYPES.find(t => t.value === selectedGuest.idType)?.label}: {selectedGuest.idNumber}</div>
                    )}
                    {selectedGuest.lastStay && (
                      <div>🏨 Last stay: {selectedGuest.lastStay} • {selectedGuest.totalStays} stays</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rate Selection - Only for walk-in and assign actions */}
          {(action === 'walkin' || action === 'assign') && (
            <>
              {/* Check-in/Check-out Date Selection */}
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
                        min={new Date().toISOString().split('T')[0]}
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
                        min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <RateSelectionComponent
                checkInDate={formData.checkInDate}
                checkOutDate={formData.checkOutDate}
                onRateChange={(rate, nights, total, roomTypeId) => {
                  setFormData(prev => ({
                    ...prev,
                    roomRate: rate,
                    numberOfNights: nights,
                    totalAmount: total,
                    depositAmount: total.toString()
                  }));
                }}
                defaultRate={formData.roomRate}
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
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gap-2"
              disabled={isProcessing}
            >
              {isProcessing ? (
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