// @ts-nocheck
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Printer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReceiptPrinter } from "@/hooks/useReceiptPrinter";
import { supabase } from "@/integrations/supabase/client";
import type { Room } from "./RoomGrid";

interface PrintReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room;
  hotelInfo?: {
    hotel_name: string;
    logo_url?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export const PrintReportDialog = ({
  open,
  onOpenChange,
  room,
  hotelInfo,
}: PrintReportDialogProps) => {
  const { toast } = useToast();
  const { printRoomReport } = useReceiptPrinter();
  const [paperSize, setPaperSize] = useState<'thermal-58' | 'thermal-80' | 'a4'>('thermal-80');
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      await printRoomReport({
        roomNumber: room.number,
        roomType: room.type,
        roomName: room.name,
        status: room.status,
        guestName: room.guest,
        checkInDate: room.checkIn,
        checkOutDate: room.checkOut,
        folioBalance: room.folio?.balance,
        totalCharges: room.folio?.total_charges,
        totalPayments: room.folio?.total_payments,
        notes: 'Room report generated for internal use'
      }, {
        paperSize,
        showPreview: false,
        hotelInfo: hotelInfo ? {
          hotel_name: hotelInfo.hotel_name || 'Hotel',
          logo_url: hotelInfo.logo_url,
          address: hotelInfo.address,
          city: hotelInfo.city,
          country: hotelInfo.country,
          phone: hotelInfo.phone,
          email: hotelInfo.email
        } : undefined
      });

      // Log report generation
      await supabase
        .from('audit_log')
        .insert({
          action: 'room_report_printed',
          resource_type: 'ROOM',
          resource_id: room.id,
          actor_id: user.id,
          actor_email: user.email,
          actor_role: user.user_metadata?.role,
          tenant_id: user.user_metadata?.tenant_id,
          description: `Room report printed for Room ${room.number} (${paperSize})`,
          metadata: { room_number: room.number, paper_size: paperSize }
        });

      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: "Failed to print room report.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Room Report
          </DialogTitle>
          <DialogDescription>
            Select paper size for Room {room.number} report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={paperSize} onValueChange={(value: any) => setPaperSize(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="thermal-58" id="thermal-58" />
              <Label htmlFor="thermal-58" className="flex-1 cursor-pointer">
                <div className="font-medium">58mm Thermal Receipt</div>
                <div className="text-xs text-muted-foreground">Small thermal printer</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="thermal-80" id="thermal-80" />
              <Label htmlFor="thermal-80" className="flex-1 cursor-pointer">
                <div className="font-medium">80mm Thermal Receipt (Recommended)</div>
                <div className="text-xs text-muted-foreground">Standard thermal printer</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="a4" id="a4" />
              <Label htmlFor="a4" className="flex-1 cursor-pointer">
                <div className="font-medium">A4 Full Page Report</div>
                <div className="text-xs text-muted-foreground">Detailed report for laser printers</div>
              </Label>
            </div>
          </RadioGroup>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              This report will include: Room details, guest information, billing summary, and current status
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPrinting}
          >
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
