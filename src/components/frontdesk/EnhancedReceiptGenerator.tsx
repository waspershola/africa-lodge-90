import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GuestBill } from '@/types/billing';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Printer, 
  Download, 
  Mail, 
  FileText 
} from 'lucide-react';

interface EnhancedReceiptGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestBill: GuestBill;
}

export const EnhancedReceiptGenerator = ({ open, onOpenChange, guestBill }: EnhancedReceiptGeneratorProps) => {
  const { toast } = useToast();
  const [template, setTemplate] = useState('A4');
  const [isGenerating, setIsGenerating] = useState(false);

  const templates = [
    { value: 'A4', label: 'A4 Standard' },
    { value: 'A5', label: 'A5 Compact' },
    { value: '80mm', label: '80mm Thermal' },
    { value: '58mm', label: '58mm Thermal' },
  ];

  const handleGenerateReceipt = async (action: 'print' | 'pdf' | 'email') => {
    setIsGenerating(true);
    
    // Simulate receipt generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const receiptId = `RCP-${Date.now()}`;
    
    switch (action) {
      case 'print':
        toast({
          title: "Receipt Printed",
          description: `Receipt ${receiptId} sent to printer`,
        });
        break;
      case 'pdf':
        toast({
          title: "PDF Generated",
          description: `Receipt saved as ${receiptId}.pdf`,
        });
        break;
      case 'email':
        toast({
          title: "Email Sent",
          description: `Receipt emailed to ${guestBill.guest_name}`,
        });
        break;
    }
    
    setIsGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Receipt - Room {guestBill.room_number}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template</label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((tmpl) => (
                        <SelectItem key={tmpl.value} value={tmpl.value}>
                          {tmpl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={() => handleGenerateReceipt('print')}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleGenerateReceipt('pdf')}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleGenerateReceipt('email')}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white text-black space-y-4">
                  {/* Hotel Header */}
                  <div className="text-center border-b pb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2" />
                    <h2 className="text-xl font-bold">Lagos Grand Hotel</h2>
                    <p className="text-sm text-gray-600">123 Victoria Island, Lagos</p>
                    <p className="text-sm text-gray-600">Tel: +234 123 456 7890</p>
                  </div>

                  {/* Guest Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Receipt #:</span>
                      <span>RCP-{Date.now()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{format(new Date(), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guest:</span>
                      <span>{guestBill.guest_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Room:</span>
                      <span>{guestBill.room_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stay:</span>
                      <span>{guestBill.check_in_date} - {guestBill.check_out_date}</span>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Services</h4>
                    <div className="space-y-1 text-sm">
                      {guestBill.service_charges.map((charge) => (
                        <div key={charge.id} className="flex justify-between">
                          <span>{charge.description}</span>
                          <span>₦{charge.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₦{guestBill.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (10%):</span>
                      <span>₦{guestBill.tax_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>₦{guestBill.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-gray-500 border-t pt-4">
                    <p>Thank you for staying with us!</p>
                    <p>Visit us again soon.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};