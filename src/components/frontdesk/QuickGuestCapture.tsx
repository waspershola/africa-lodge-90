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
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
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
  idType: string;
  idNumber: string;
  paymentMode: string;
  depositAmount: string;
  printNow: boolean;
  notes: string;
}

interface MockGuest {
  id: string;
  name: string;
  phone: string;
  email: string;
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
    idType: '',
    idNumber: '',
    paymentMode: 'cash',
    depositAmount: '10000',
    printNow: true,
    notes: '',
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
      
      // Update room status
      const updatedRoom = {
        ...room,
        status: 'occupied' as const,
        guest: formData.guestName,
        checkIn: new Date().toISOString(),
        folio: {
          balance: parseInt(formData.depositAmount) || 0,
          isPaid: formData.paymentMode !== 'credit'
        }
      };

      onComplete(updatedRoom);

      if (formData.printNow) {
        toast({
          title: "Processing Complete",
          description: `${getActionTitle()} completed for ${formData.guestName}. Check-in slip sent to printer.`,
        });
      } else {
        toast({
          title: "Processing Complete", 
          description: `${getActionTitle()} completed for ${formData.guestName}.`,
        });
      }

      // Reset form and states
      setFormData({
        guestName: '',
        phone: '',
        email: '',
        idType: '',
        idNumber: '',
        paymentMode: 'cash',
        depositAmount: '10000',
        printNow: true,
        notes: '',
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

                  {/* Optional Contact Fields */}
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOptionalFields(!showOptionalFields)}
                      className="text-xs"
                    >
                      {showOptionalFields ? 'Hide' : 'Add'} ID & Contact Info (Optional)
                    </Button>
                    
                    {showOptionalFields && (
                      <div className="space-y-3 pt-2 border-t">
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
                <Label htmlFor="depositAmount">Deposit Amount (₦)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={formData.depositAmount}
                  onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                  placeholder="10000"
                  className="mt-1"
                />
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