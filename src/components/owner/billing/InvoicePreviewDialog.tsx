import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  Mail,
  Printer,
  FileText,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface InvoicePreviewDialogProps {
  invoice: any;
  onClose: () => void;
}

export default function InvoicePreviewDialog({ invoice, onClose }: InvoicePreviewDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'partial': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-danger text-danger-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Preview - {invoice.id}
            </span>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Content */}
        <div className="bg-white text-black p-8 rounded-lg border" style={{ fontFamily: 'system-ui' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">{invoice.hotelInfo.name}</h1>
              </div>
              <div className="text-sm text-gray-600">
                <div>{invoice.hotelInfo.address}</div>
                <div>Phone: {invoice.hotelInfo.phone}</div>
                <div>Email: {invoice.hotelInfo.email}</div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary mb-2">INVOICE</h2>
              <div className="text-sm">
                <div><strong>Invoice #:</strong> {invoice.id}</div>
                <div><strong>Issue Date:</strong> {format(invoice.issueDate, 'MMM dd, yyyy')}</div>
                <div><strong>Due Date:</strong> {format(invoice.dueDate, 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
              <div className="text-sm">
                <div className="font-medium text-base">{invoice.guestName}</div>
                <div>Room {invoice.room}</div>
                <div>Reservation: {invoice.billId}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Stay Details:</h3>
              <div className="text-sm">
                <div>Check-in: {format(new Date(invoice.lineItems[0]?.checkIn || invoice.issueDate), 'MMM dd, yyyy')}</div>
                <div>Check-out: {format(new Date(invoice.lineItems[0]?.checkOut || invoice.dueDate), 'MMM dd, yyyy')}</div>
                <div>Duration: {Math.ceil((new Date(invoice.dueDate).getTime() - new Date(invoice.issueDate).getTime()) / (1000 * 60 * 60 * 24))} night(s)</div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-primary">
                  <th className="text-left py-3 px-2 font-semibold">Description</th>
                  <th className="text-center py-3 px-2 font-semibold w-20">Qty</th>
                  <th className="text-right py-3 px-2 font-semibold w-32">Unit Price</th>
                  <th className="text-right py-3 px-2 font-semibold w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-2">{item.description}</td>
                    <td className="text-center py-3 px-2">{item.quantity}</td>
                    <td className="text-right py-3 px-2">₦{item.unitPrice.toLocaleString()}</td>
                    <td className="text-right py-3 px-2 font-medium">₦{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span>Subtotal:</span>
                <span>₦{invoice.lineItems.reduce((sum: number, item: any) => sum + item.total, 0).toLocaleString()}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Total Amount:</span>
                <span>₦{invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-success font-medium">
                <span>Amount Paid:</span>
                <span>₦{invoice.paidAmount.toLocaleString()}</span>
              </div>
              <Separator className="my-2" />
              <div className={`flex justify-between py-2 font-bold text-lg ${
                (invoice.amount - invoice.paidAmount) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                <span>Balance Due:</span>
                <span>₦{(invoice.amount - invoice.paidAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-4">Payment History</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Reference</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{format(payment.date, 'MMM dd, yyyy')}</td>
                      <td className="py-2 capitalize">{payment.method}</td>
                      <td className="py-2">{payment.reference}</td>
                      <td className="text-right py-2">₦{payment.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
            <div>Thank you for choosing {invoice.hotelInfo.name}</div>
            <div className="mt-2">For any queries regarding this invoice, please contact us at {invoice.hotelInfo.email}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email Invoice
          </Button>
          <div className="flex-1" />
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}