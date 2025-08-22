import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt,
  Download,
  Mail,
  Printer,
  Calendar,
  User,
  Building,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

interface BillDetailsDialogProps {
  bill: any;
  onClose: () => void;
}

export default function BillDetailsDialog({ bill, onClose }: BillDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'text-green-600';
      case 'card': return 'text-blue-600';
      case 'transfer': return 'text-purple-600';
      case 'pos': return 'text-orange-600';
      case 'wallet': return 'text-pink-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Details - {bill.id}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(bill.status)}>
                {bill.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Guest & Reservation Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Guest Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {bill.guestName}</div>
                <div><span className="font-medium">Room:</span> {bill.room}</div>
                <div><span className="font-medium">Reservation ID:</span> {bill.reservationId}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Stay Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Check-in:</span> {format(bill.checkIn, 'MMM d, yyyy')}</div>
                <div><span className="font-medium">Check-out:</span> {format(bill.checkOut, 'MMM d, yyyy')}</div>
                <div><span className="font-medium">Nights:</span> {Math.ceil((bill.checkOut.getTime() - bill.checkIn.getTime()) / (1000 * 60 * 60 * 24))}</div>
                <div><span className="font-medium">Bill Date:</span> {format(bill.createdAt, 'MMM d, yyyy')}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Bill Details
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Unit Price</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lineItems.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-muted-foreground capitalize">{item.type}</div>
                        </div>
                      </td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">₦{item.unitPrice.toLocaleString()}</td>
                      <td className="text-right p-3 font-medium">₦{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Discounts */}
            {bill.discounts && bill.discounts.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Discounts Applied</h4>
                {bill.discounts.map((discount: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-success/10 rounded">
                    <span className="text-sm">{discount.type} ({discount.percentage}%)</span>
                    <span className="font-medium text-success">₦{Math.abs(discount.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Total Summary */}
            <div className="mt-4 bg-muted/50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{bill.lineItems.reduce((sum: number, item: any) => sum + item.total, 0).toLocaleString()}</span>
                </div>
                {bill.discounts && bill.discounts.length > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Total Discounts:</span>
                    <span>-₦{bill.discounts.reduce((sum: number, discount: any) => sum + Math.abs(discount.amount), 0).toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>₦{bill.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Amount Paid:</span>
                  <span>₦{bill.paidAmount.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between font-bold ${
                  bill.balancedue > 0 ? 'text-danger' : 'text-success'
                }`}>
                  <span>Balance Due:</span>
                  <span>₦{bill.balancedue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment History */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment History
            </h3>
            {bill.payments && bill.payments.length > 0 ? (
              <div className="space-y-2">
                {bill.payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">₦{payment.amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(payment.date, 'MMM d, yyyy')} • 
                        <span className={`capitalize ml-1 ${getPaymentMethodColor(payment.method)}`}>
                          {payment.method}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ref: {payment.reference}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payments recorded yet
              </div>
            )}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}