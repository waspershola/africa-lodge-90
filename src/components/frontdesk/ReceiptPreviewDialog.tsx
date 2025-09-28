import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Printer, Eye, Download, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReceiptPrinter } from "@/hooks/useReceiptPrinter";
import { ReceiptTemplate } from "./ReceiptTemplate";

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: any; // ReceiptData type from useReceiptPrinter
  autoShow?: boolean;
}

export const ReceiptPreviewDialog = ({
  open,
  onOpenChange,
  receiptData,
  autoShow = true
}: ReceiptPreviewDialogProps) => {
  const { toast } = useToast();
  const { printReceipt, isPrinting } = useReceiptPrinter();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [printSettings, setPrintSettings] = useState({
    copies: 1,
    paperSize: 'thermal-80' as 'thermal-58' | 'thermal-80' | 'a4',
    showPreview: false,
    sendEmail: false,
    sendSMS: false,
  });

  if (!receiptData) return null;

  const handlePrint = async () => {
    const success = await printReceipt(receiptData, {
      copies: printSettings.copies,
      paperSize: printSettings.paperSize,
      showPreview: printSettings.showPreview,
    });

    if (success && !printSettings.showPreview) {
      onOpenChange(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Import html2canvas and jsPDF dynamically
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      if (receiptRef.current) {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
        });

        const imgWidth = 80; // mm for thermal receipt width
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [imgWidth, imgHeight],
        });

        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          imgWidth,
          imgHeight
        );

        pdf.save(`receipt-${receiptData.receiptNumber}.pdf`);

        toast({
          title: "Download Complete",
          description: "Receipt PDF has been downloaded.",
        });
      }
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    // Simulate email sending
    toast({
      title: "Email Sent",
      description: "Receipt has been sent to guest's email address.",
    });
  };

  const handleSendSMS = async () => {
    // Simulate SMS sending
    toast({
      title: "SMS Sent", 
      description: "Receipt link has been sent to guest's phone number.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Receipt Preview
          </DialogTitle>
          <DialogDescription>
            Review and print receipt {receiptData.receiptNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Receipt Preview */}
          <div className="overflow-y-auto max-h-[70vh]">
            <div className="bg-gray-50 p-4 rounded-lg">
              <ReceiptTemplate
                ref={receiptRef}
                receiptData={receiptData}
                showQR={true}
              />
            </div>
          </div>

          {/* Print Options */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="copies">Copies</Label>
                    <Select
                      value={printSettings.copies.toString()}
                      onValueChange={(value) =>
                        setPrintSettings(prev => ({
                          ...prev,
                          copies: parseInt(value)
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Copy</SelectItem>
                        <SelectItem value="2">2 Copies</SelectItem>
                        <SelectItem value="3">3 Copies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="paperSize">Paper Size</Label>
                    <Select
                      value={printSettings.paperSize}
                      onValueChange={(value: any) =>
                        setPrintSettings(prev => ({
                          ...prev,
                          paperSize: value
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thermal-58">58mm Thermal</SelectItem>
                        <SelectItem value="thermal-80">80mm Thermal</SelectItem>
                        <SelectItem value="a4">A4 Paper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showPreview"
                    checked={printSettings.showPreview}
                    onCheckedChange={(checked) =>
                      setPrintSettings(prev => ({
                        ...prev,
                        showPreview: checked
                      }))
                    }
                  />
                  <Label htmlFor="showPreview">Show print preview</Label>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendEmail"
                      checked={printSettings.sendEmail}
                      onCheckedChange={(checked) =>
                        setPrintSettings(prev => ({
                          ...prev,
                          sendEmail: checked
                        }))
                      }
                    />
                    <Label htmlFor="sendEmail">Send via Email</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendSMS"
                      checked={printSettings.sendSMS}
                      onCheckedChange={(checked) =>
                        setPrintSettings(prev => ({
                          ...prev,
                          sendSMS: checked
                        }))
                      }
                    />
                    <Label htmlFor="sendSMS">Send via SMS</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handlePrint}
                disabled={isPrinting}
                className="w-full"
                size="lg"
              >
                <Printer className="h-4 w-4 mr-2" />
                {isPrinting ? 'Printing...' : 'Print Receipt'}
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  disabled={!printSettings.sendEmail}
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendSMS}
                  disabled={!printSettings.sendSMS}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
              </div>
            </div>

            {/* Receipt Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Receipt Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Receipt Number:</span>
                  <span className="font-medium">{receiptData.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{receiptData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span className="font-medium">{receiptData.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room:</span>
                  <span className="font-medium">{receiptData.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">₦{receiptData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">{receiptData.paymentMethod}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};