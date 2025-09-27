import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Download, 
  Printer, 
  Mail, 
  MessageSquare, 
  QrCode,
  Calendar,
  User,
  Phone,
  CreditCard,
  MapPin
} from "lucide-react";

interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  nationality: string;
}

interface Room {
  number: string;
  type: string;
  rate: number;
}

interface CheckInData {
  guest: Guest;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  duration: number;
  deposit: number;
  balance: number;
  bookingSource: string;
  specialRequests?: string;
}

interface CheckInSlipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkInData: CheckInData | null;
}

export function CheckInSlipDialog({ open, onOpenChange, checkInData }: CheckInSlipDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!checkInData) return null;

  const generateSlip = async (action: 'print' | 'pdf' | 'email' | 'sms') => {
    setIsGenerating(true);
    
    // Simulate slip generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const slipId = `CHK-${checkInData.room.number}-${Date.now()}`;
    
    switch (action) {
      case 'print':
        toast({
          title: "Check-in slip printed",
          description: `Slip ID: ${slipId} sent to default printer`,
        });
        break;
      case 'pdf':
        toast({
          title: "PDF generated",
          description: `Check-in slip saved as ${slipId}.pdf`,
        });
        break;
      case 'email':
        toast({
          title: "Email sent",
          description: `Check-in slip emailed to ${checkInData.guest.email}`,
        });
        break;
      case 'sms':
        toast({
          title: "SMS sent",
          description: `Digital slip link sent to ${checkInData.guest.phone}`,
        });
        break;
    }
    
    setIsGenerating(false);
    onOpenChange(false);
  };

  const totalAmount = (checkInData.room.rate * checkInData.duration) + checkInData.deposit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate Check-In Slip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Slip Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Lagos Grand Hotel</h2>
                  <p className="text-sm text-muted-foreground">123 Victoria Island, Lagos, Nigeria</p>
                  <p className="text-sm text-muted-foreground">Tel: +234 123 456 7890</p>
                  <div className="mt-3">
                    <Badge variant="default" className="bg-success">
                      CHECK-IN CONFIRMATION
                    </Badge>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Guest Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Name:</strong> {checkInData.guest.name}
                    </div>
                    <div>
                      <strong>Phone:</strong> {checkInData.guest.phone}
                    </div>
                    <div>
                      <strong>Email:</strong> {checkInData.guest.email}
                    </div>
                    <div>
                      <strong>ID:</strong> {checkInData.guest.idType} - {checkInData.guest.idNumber}
                    </div>
                    <div>
                      <strong>Nationality:</strong> {checkInData.guest.nationality}
                    </div>
                    <div>
                      <strong>Booking Source:</strong> {checkInData.bookingSource}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Room & Stay Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Room Assignment</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Room Number:</strong> {checkInData.room.number}
                    </div>
                    <div>
                      <strong>Room Type:</strong> {checkInData.room.type}
                    </div>
                    <div>
                      <strong>Check-In:</strong> {new Date(checkInData.checkInDate).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Check-Out:</strong> {new Date(checkInData.checkOutDate).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Duration:</strong> {checkInData.duration} night{checkInData.duration > 1 ? 's' : ''}
                    </div>
                    <div>
                      <strong>Room Rate:</strong> ₦{checkInData.room.rate.toLocaleString()}/night
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Billing Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Billing Summary</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Room Charges ({checkInData.duration} nights):</span>
                      <span>₦{(checkInData.room.rate * checkInData.duration).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit Paid:</span>
                      <span>₦{checkInData.deposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding Balance:</span>
                      <span>₦{checkInData.balance.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {checkInData.specialRequests && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Special Requests</h3>
                      <p className="text-sm text-muted-foreground">
                        {checkInData.specialRequests}
                      </p>
                    </div>
                  </>
                )}

                {/* QR Code Section */}
                <div className="text-center border-t pt-4">
                  <div className="w-24 h-24 bg-gray-200 rounded mx-auto mb-3 flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">Scan for Digital Services</p>
                  <p className="text-xs text-muted-foreground">
                    Access restaurant menu, housekeeping, room service & more
                  </p>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                  <p>Thank you for choosing Lagos Grand Hotel</p>
                  <p>We wish you a comfortable stay</p>
                  <div className="mt-2">
                    <p>Slip ID: CHK-{checkInData.room.number}-{Date.now()}</p>
                    <p>Generated: {new Date().toLocaleString()}</p>
                    <p>Staff: Front Desk Agent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={() => generateSlip('print')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Now
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => generateSlip('pdf')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Save PDF
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => generateSlip('email')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email Guest
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => generateSlip('sms')}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Send SMS
            </Button>
          </div>

          {isGenerating && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Generating check-in slip...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}