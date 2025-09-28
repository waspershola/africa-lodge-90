import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";

interface ReceiptTemplateProps {
  receiptData: ReceiptData;
  hotelInfo?: HotelInfo;
  showQR?: boolean;
}

interface HotelInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  logo?: string;
}

interface ReceiptData {
  id: string;
  type: 'check-in' | 'check-out' | 'payment' | 'service' | 'overstay' | 'deposit';
  receiptNumber: string;
  date: string;
  time: string;
  cashier: string;
  shiftId?: string;
  deviceId?: string;
  
  // Guest info
  guestName: string;
  roomNumber: string;
  
  // Transaction details
  description: string;
  items?: ReceiptItem[];
  
  // Payment info
  paymentMethod: string;
  subtotal: number;
  tax?: number;
  serviceCharge?: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount?: number;
  balance?: number;
  
  // Additional info
  checkInDate?: string;
  checkOutDate?: string;
  notes?: string;
  
  // QR verification
  verificationUrl?: string;
}

interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Default hotel info - would come from tenant settings
const DEFAULT_HOTEL_INFO: HotelInfo = {
  name: "Luxury Hotel Pro",
  address: "123 Business District, Lagos, Nigeria",
  phone: "+234 800 LUXURY (589879)",
  email: "info@luxuryhotelpro.com",
  website: "www.luxuryhotelpro.com"
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ receiptData, hotelInfo = DEFAULT_HOTEL_INFO, showQR = true }, ref) => {
    const { formatPrice } = useCurrency();
    
    const getReceiptTitle = () => {
      switch (receiptData.type) {
        case 'check-in': return 'CHECK-IN RECEIPT';
        case 'check-out': return 'CHECK-OUT RECEIPT';
        case 'payment': return 'PAYMENT RECEIPT';
        case 'service': return 'SERVICE CHARGE RECEIPT';
        case 'overstay': return 'OVERSTAY CHARGE RECEIPT';
        case 'deposit': return 'DEPOSIT RECEIPT';
        default: return 'RECEIPT';
      }
    };

    const getReceiptColor = () => {
      switch (receiptData.type) {
        case 'check-in': return 'bg-green-50 border-green-200';
        case 'check-out': return 'bg-blue-50 border-blue-200';
        case 'payment': return 'bg-purple-50 border-purple-200';
        case 'service': return 'bg-orange-50 border-orange-200';
        case 'overstay': return 'bg-red-50 border-red-200';
        case 'deposit': return 'bg-yellow-50 border-yellow-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    };

    return (
      <div ref={ref} className="receipt-container max-w-sm mx-auto">
        <Card className={`${getReceiptColor()} font-mono text-sm`}>
          <CardContent className="p-4 space-y-4">
            {/* Hotel Header */}
            <div className="text-center space-y-1">
              {hotelInfo.logo && (
                <img 
                  src={hotelInfo.logo} 
                  alt={hotelInfo.name}
                  className="h-12 mx-auto mb-2"
                />
              )}
              <h1 className="font-bold text-lg uppercase">{hotelInfo.name}</h1>
              <p className="text-xs">{hotelInfo.address}</p>
              <p className="text-xs">{hotelInfo.phone}</p>
              {hotelInfo.email && <p className="text-xs">{hotelInfo.email}</p>}
            </div>

            <Separator />

            {/* Receipt Type & Number */}
            <div className="text-center space-y-1">
              <Badge variant="outline" className="text-xs font-bold">
                {getReceiptTitle()}
              </Badge>
              <p className="font-bold">Receipt No: {receiptData.receiptNumber}</p>
              <p className="text-xs">{receiptData.date} • {receiptData.time}</p>
            </div>

            <Separator />

            {/* Guest & Room Info */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Guest:</span>
                <span className="font-medium">{receiptData.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-medium">{receiptData.roomNumber}</span>
              </div>
              {receiptData.checkInDate && (
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span>{receiptData.checkInDate}</span>
                </div>
              )}
              {receiptData.checkOutDate && (
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{receiptData.checkOutDate}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Transaction Details */}
            <div className="space-y-2">
              <h3 className="font-bold text-center">TRANSACTION DETAILS</h3>
              
              {/* Items List */}
              {receiptData.items && receiptData.items.length > 0 ? (
                <div className="space-y-1">
                  {receiptData.items.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs">{item.description}</span>
                      </div>
                      <div className="flex justify-between text-xs ml-2">
                        <span>{item.quantity} × {formatPrice(item.unitPrice)}</span>
                        <span>{formatPrice(item.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-xs">
                  {receiptData.description}
                </div>
              )}

              <Separator className="my-2" />

              {/* Amount Breakdown */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(receiptData.subtotal)}</span>
                </div>
                
                {receiptData.tax && receiptData.tax > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>VAT (7.5%):</span>
                    <span>{formatPrice(receiptData.tax)}</span>
                  </div>
                )}
                
                {receiptData.serviceCharge && receiptData.serviceCharge > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Service Charge:</span>
                    <span>{formatPrice(receiptData.serviceCharge)}</span>
                  </div>
                )}

                <Separator />
                
                <div className="flex justify-between font-bold">
                  <span>TOTAL AMOUNT:</span>
                  <span>{formatPrice(receiptData.totalAmount)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">{receiptData.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>{formatPrice(receiptData.amountPaid)}</span>
                </div>
                
                {receiptData.changeAmount && receiptData.changeAmount > 0 && (
                  <div className="flex justify-between font-bold text-green-600">
                    <span>Change:</span>
                    <span>{formatPrice(receiptData.changeAmount)}</span>
                  </div>
                )}
                
                {receiptData.balance && receiptData.balance > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Outstanding:</span>
                    <span>{formatPrice(receiptData.balance)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {receiptData.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs"><strong>Notes:</strong></p>
                  <p className="text-xs">{receiptData.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Staff & System Info */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receiptData.cashier}</span>
              </div>
              {receiptData.shiftId && (
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span>{receiptData.shiftId}</span>
                </div>
              )}
              {receiptData.deviceId && (
                <div className="flex justify-between">
                  <span>Terminal:</span>
                  <span>{receiptData.deviceId}</span>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            {showQR && receiptData.verificationUrl && (
              <>
                <Separator />
                <div className="text-center space-y-2">
                  <div className="bg-white p-2 inline-block border">
                    {/* QR Code would be generated here */}
                    <div className="w-16 h-16 bg-black flex items-center justify-center text-white text-xs">
                      QR
                    </div>
                  </div>
                  <p className="text-xs">Scan to verify receipt online</p>
                  <p className="text-xs break-all">{receiptData.verificationUrl}</p>
                </div>
              </>
            )}

            {/* Footer */}
            <Separator />
            <div className="text-center space-y-1">
              <p className="text-xs font-bold">THANK YOU FOR CHOOSING {hotelInfo.name.toUpperCase()}</p>
              <p className="text-xs">Have a wonderful stay!</p>
              {hotelInfo.website && (
                <p className="text-xs">{hotelInfo.website}</p>
              )}
            </div>

            {/* Duplicate Copy Indicator */}
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                CUSTOMER COPY
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);