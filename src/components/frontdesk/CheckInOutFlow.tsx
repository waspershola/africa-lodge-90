import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  LogIn, 
  LogOut, 
  QrCode, 
  User, 
  Phone, 
  CreditCard, 
  IdCard,
  CheckCircle,
  AlertTriangle,
  Printer,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "./RoomGrid";

interface CheckInOutFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  type: 'check-in' | 'check-out';
  onComplete: (room: Room, auditLog: AuditLogEntry) => void;
}

interface AuditLogEntry {
  id: string;
  roomNumber: string;
  action: 'check-in' | 'check-out' | 'qr-assigned' | 'qr-disabled' | 'payment-collected';
  staff: string;
  timestamp: Date;
  guestName?: string;
  details?: string;
  qrCodeId?: string;
}

const defaultQRServices = ['Wi-Fi', 'Room Service', 'Housekeeping', 'Digital Menu'];

export const CheckInOutFlow = ({ open, onOpenChange, room, type, onComplete }: CheckInOutFlowProps) => {
  const [step, setStep] = useState(1);
  const [guestDetails, setGuestDetails] = useState({
    name: room?.guest?.name || '',
    phone: room?.guest?.phone || '',
    idNumber: room?.guest?.idNumber || '',
    email: '',
    nationality: ''
  });
  const [qrServices, setQRServices] = useState<string[]>(defaultQRServices);
  const [billingNotes, setBillingNotes] = useState('');
  const [printQR, setPrintQR] = useState(true);
  const { toast } = useToast();

  const handleServiceToggle = (service: string) => {
    setQRServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleCheckIn = () => {
    if (!room) return;

    const auditLog: AuditLogEntry = {
      id: Date.now().toString(),
      roomNumber: room.number,
      action: 'check-in',
      staff: 'Current User',
      timestamp: new Date(),
      guestName: guestDetails.name,
      details: `Guest checked in with QR services: ${qrServices.join(', ')}`,
      qrCodeId: room.qrCode?.id
    };

    const updatedRoom: Room = {
      ...room,
      status: 'occupied',
      guest: {
        name: guestDetails.name,
        phone: guestDetails.phone,
        idNumber: guestDetails.idNumber,
        bookingSource: 'Walk-in',
        checkIn: new Date().toISOString().split('T')[0],
        stayDuration: 1
      },
      qrCode: {
        ...room.qrCode!,
        status: 'active',
        servicesEnabled: qrServices,
        pendingRequests: 0
      }
    };

    onComplete(updatedRoom, auditLog);
    
    toast({
      title: "Check-in Complete",
      description: `${guestDetails.name} checked into Room ${room.number}. QR code activated.`
    });

    onOpenChange(false);
    resetForm();
  };

  const handleCheckOut = () => {
    if (!room || !room.guest) return;

    const auditLog: AuditLogEntry = {
      id: Date.now().toString(),
      roomNumber: room.number,
      action: 'check-out',
      staff: 'Current User',
      timestamp: new Date(),
      guestName: room.guest.name,
      details: `Guest checked out. QR code disabled. Final bill: ₦${room.folio?.balance || 0}`,
      qrCodeId: room.qrCode?.id
    };

    const updatedRoom: Room = {
      ...room,
      status: 'available',
      guest: undefined,
      qrCode: {
        ...room.qrCode!,
        status: 'inactive',
        servicesEnabled: [],
        pendingRequests: 0
      },
      folio: room.folio ? {
        ...room.folio,
        status: 'up-to-date'
      } : undefined
    };

    onComplete(updatedRoom, auditLog);
    
    toast({
      title: "Check-out Complete",
      description: `${room.guest.name} checked out of Room ${room.number}. QR code disabled.`
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setGuestDetails({
      name: '',
      phone: '',
      idNumber: '',
      email: '',
      nationality: ''
    });
    setQRServices(defaultQRServices);
    setBillingNotes('');
    setPrintQR(true);
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'check-in' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
            {type === 'check-in' ? 'Guest Check-In' : 'Guest Check-Out'} - Room {room.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {type === 'check-in' && (
            <>
              {/* Guest Details */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Guest Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={guestDetails.name}
                          onChange={(e) => setGuestDetails(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={guestDetails.phone}
                          onChange={(e) => setGuestDetails(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+234 xxx xxx xxxx"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="idNumber">ID Number *</Label>
                        <Input
                          id="idNumber"
                          value={guestDetails.idNumber}
                          onChange={(e) => setGuestDetails(prev => ({ ...prev, idNumber: e.target.value }))}
                          placeholder="Passport/National ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={guestDetails.email}
                          onChange={(e) => setGuestDetails(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="guest@email.com"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(2)}
                        disabled={!guestDetails.name || !guestDetails.phone || !guestDetails.idNumber}
                      >
                        Next: QR Services
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QR Services Setup */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      QR Code Services Setup
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select services available via room QR code
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {['Wi-Fi', 'Room Service', 'Housekeeping', 'Maintenance', 'Digital Menu', 'Events & Packages', 'Feedback'].map((service) => (
                        <div key={service} className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">{service}</span>
                          <Switch
                            checked={qrServices.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Print QR Code</Label>
                        <p className="text-sm text-muted-foreground">Physical QR code for guest</p>
                      </div>
                      <Switch
                        checked={printQR}
                        onCheckedChange={setPrintQR}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button onClick={handleCheckIn}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Check-In
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {type === 'check-out' && (
            <div className="space-y-4">
              {/* Guest Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Check-Out Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Guest Name</Label>
                      <p className="font-medium">{room.guest?.name}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="font-medium">{room.guest?.phone}</p>
                    </div>
                    <div>
                      <Label>Check-In Date</Label>
                      <p className="font-medium">{room.guest?.checkIn}</p>
                    </div>
                    <div>
                      <Label>Stay Duration</Label>
                      <p className="font-medium">{room.guest?.stayDuration} nights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Summary */}
              {room.folio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Final Bill
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Room Charges</span>
                        <span>₦{(room.folio.balance - (room.folio.qrCharges || 0)).toLocaleString()}</span>
                      </div>
                      {room.folio.qrCharges && room.folio.qrCharges > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>QR Service Charges</span>
                          <span>₦{room.folio.qrCharges.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>₦{room.folio.balance.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billingNotes">Billing Notes</Label>
                      <Textarea
                        id="billingNotes"
                        value={billingNotes}
                        onChange={(e) => setBillingNotes(e.target.value)}
                        placeholder="Optional billing notes or adjustments..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QR Activity Summary */}
              {room.qrCode && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      QR Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Services Used</span>
                        <span>{room.qrCode.servicesEnabled.length} services</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Requests</span>
                        <span>
                          {room.qrCode.pendingRequests > 0 ? (
                            <Badge variant="destructive">{room.qrCode.pendingRequests}</Badge>
                          ) : (
                            <Badge variant="secondary">None</Badge>
                          )}
                        </span>
                      </div>
                      {room.qrCode.lastScanned && (
                        <div className="flex justify-between">
                          <span>Last QR Scan</span>
                          <span>{new Date(room.qrCode.lastScanned).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Check-out Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {room.qrCode && room.qrCode.pendingRequests > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Resolve {room.qrCode.pendingRequests} pending request{room.qrCode.pendingRequests > 1 ? 's' : ''} first
                  </Badge>
                )}
                <Button 
                  onClick={handleCheckOut}
                  disabled={room.qrCode && room.qrCode.pendingRequests > 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Check-Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};