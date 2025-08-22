import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  User, 
  Phone, 
  IdCard,
  Printer,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "./RoomGrid";

interface QuickGuestCaptureProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'assign' | 'walkin';
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

const ID_TYPES = [
  { value: 'national-id', label: 'National ID' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers-license', label: "Driver's License" },
  { value: 'voters-card', label: "Voter's Card" },
];

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'pos', label: 'POS/Card' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit Account' },
];

export const QuickGuestCapture = ({
  room,
  open,
  onOpenChange,
  action,
  onComplete,
}: QuickGuestCaptureProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
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

  if (!room) return null;

  const handleInputChange = (field: keyof GuestFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName.trim()) {
      toast({
        title: "Validation Error",
        description: "Guest name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.idType || !formData.idNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "ID Type and Number are required",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
          description: `${action === 'assign' ? 'Room assigned' : 'Check-in completed'} for ${formData.guestName}. Check-in slip sent to printer.`,
        });
      } else {
        toast({
          title: "Processing Complete",
          description: `${action === 'assign' ? 'Room assigned' : 'Check-in completed'} for ${formData.guestName}.`,
        });
      }

      // Reset form
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

  const actionTitle = action === 'assign' ? 'Assign Room' : 'Walk-in Check-in';
  const actionDescription = action === 'assign' 
    ? `Assign Room ${room.number} to a guest`
    : `Complete walk-in check-in for Room ${room.number}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {actionTitle}
          </DialogTitle>
          <DialogDescription>
            {actionDescription} • {room.type}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="idType">ID Type *</Label>
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
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    placeholder="Enter ID number"
                    className="mt-1"
                    required
                  />
                </div>
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
                  {showOptionalFields ? 'Hide' : 'Add'} Contact Info (Optional)
                </Button>
                
                {showOptionalFields && (
                  <div className="space-y-2 pt-2 border-t">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="080XXXXXXXX"
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
                        placeholder="guest@email.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
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
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
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
                  {actionTitle}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};