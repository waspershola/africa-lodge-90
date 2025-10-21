import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface HotelInfo {
  hotel_name: string;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface PrintOptions {
  copies?: number;
  paperSize?: 'thermal-58' | 'thermal-80' | 'a4';
  autoOpen?: boolean;
  showPreview?: boolean;
  hotelInfo?: HotelInfo;
  taxBreakdown?: Array<{
    label: string;
    rate: number;
    amount: number;
  }>;
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
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  
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
  
  // Hotel info
  hotelInfo?: HotelInfo;
  taxBreakdown?: Array<{
    label: string;
    rate: number;
    amount: number;
  }>;
}

export const useReceiptPrinter = () => {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printQueue, setPrintQueue] = useState<ReceiptData[]>([]);

  // Generate unique receipt number
  const generateReceiptNumber = (type: string): string => {
    const prefix = type.toUpperCase().charAt(0);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Generate verification URL
  const generateVerificationUrl = (receiptId: string, tenantId?: string): string => {
    const baseUrl = window.location.origin;
    const tenant = tenantId || 'default';
    return `${baseUrl}/verify/${tenant}/${receiptId}`;
  };

  // Create receipt data from transaction
  const createReceiptData = (
    type: ReceiptData['type'],
    transactionData: Partial<ReceiptData>,
    options: {
      cashier?: string;
      shiftId?: string;
      deviceId?: string;
      tenantId?: string;
    } = {}
  ): ReceiptData => {
    const now = new Date();
    const receiptId = `receipt_${Date.now()}`;
    
    return {
      id: receiptId,
      type,
      receiptNumber: generateReceiptNumber(type),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      cashier: options.cashier || 'Front Desk',
      shiftId: options.shiftId,
      deviceId: options.deviceId || 'FD-TERMINAL-1',
      
      // Required fields with defaults
      guestName: transactionData.guestName || 'Guest',
      roomNumber: transactionData.roomNumber || 'N/A',
      description: transactionData.description || 'Hotel Service',
      paymentMethod: transactionData.paymentMethod || 'Cash',
      subtotal: transactionData.subtotal || 0,
      totalAmount: transactionData.totalAmount || 0,
      amountPaid: transactionData.amountPaid || 0,
      
      // Optional fields
      ...transactionData,
      
      // Generate verification URL
      verificationUrl: generateVerificationUrl(receiptId, options.tenantId),
    };
  };

  // Print receipt using browser print API
  const printReceipt = async (
    receiptData: ReceiptData,
    options: PrintOptions = {}
  ): Promise<boolean> => {
    const {
      copies = 1,
      paperSize = 'thermal-80',
      autoOpen = true,
      showPreview = false,
      hotelInfo,
      taxBreakdown
    } = options;
    
    // Merge hotel info and tax breakdown into receipt data
    const enrichedReceiptData = {
      ...receiptData,
      hotelInfo: hotelInfo || receiptData.hotelInfo,
      taxBreakdown: taxBreakdown || receiptData.taxBreakdown
    };

    setIsPrinting(true);

    try {
      // Create print window
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups.');
      }

      // Generate print HTML
      const printHTML = generatePrintHTML(enrichedReceiptData, paperSize);
      
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load
      await new Promise(resolve => {
        printWindow.onload = resolve;
        setTimeout(resolve, 500); // Fallback timeout
      });

      if (showPreview) {
        // Just show preview, don't auto-print
        toast({
          title: "Receipt Preview",
          description: "Receipt preview opened in new window.",
        });
      } else {
        // Auto-print
        for (let i = 0; i < copies; i++) {
          printWindow.print();
          if (i < copies - 1) {
            // Small delay between copies
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Close print window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);

        toast({
          title: "Receipt Printed",
          description: `Receipt ${receiptData.receiptNumber} sent to printer${copies > 1 ? ` (${copies} copies)` : ''}.`,
        });
      }

      return true;
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to print receipt",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  // Generate HTML for printing
  const generatePrintHTML = (receiptData: ReceiptData, paperSize: string): string => {
    const width = paperSize === 'thermal-58' ? '58mm' : '80mm';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${receiptData.receiptNumber}</title>
      <style>
        @media print {
          @page {
            size: ${width} auto;
            margin: 2mm 0;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          margin: 0;
          padding: 2mm;
          width: ${width};
          background: white;
        }
        
        .receipt {
          text-align: left;
        }
        
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .small { font-size: 10px; }
        
        .header {
          text-align: center;
          margin-bottom: 5mm;
        }
        
        .separator {
          border-top: 1px dashed #000;
          margin: 2mm 0;
          height: 1px;
        }
        
        .row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
        }
        
        .qr-section {
          text-align: center;
          margin-top: 5mm;
        }
        
        .qr-placeholder {
          width: 15mm;
          height: 15mm;
          border: 1px solid #000;
          margin: 2mm auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          ${receiptData.hotelInfo?.logo_url ? `
            <img src="${receiptData.hotelInfo.logo_url}" 
                 alt="Hotel Logo" 
                 style="max-width: 40mm; max-height: 15mm; margin: 0 auto 2mm; display: block;" 
                 onerror="this.style.display='none'" />
          ` : ''}
          <div class="bold">${receiptData.hotelInfo?.hotel_name || 'HOTEL'}</div>
          ${receiptData.hotelInfo?.address ? `
            <div class="small">${receiptData.hotelInfo.address}</div>
          ` : ''}
          ${receiptData.hotelInfo?.city || receiptData.hotelInfo?.country ? `
            <div class="small">${[receiptData.hotelInfo?.city, receiptData.hotelInfo?.country].filter(Boolean).join(', ')}</div>
          ` : ''}
          ${receiptData.hotelInfo?.phone ? `
            <div class="small">Tel: ${receiptData.hotelInfo.phone}</div>
          ` : ''}
          ${receiptData.hotelInfo?.email ? `
            <div class="small">${receiptData.hotelInfo.email}</div>
          ` : ''}
        </div>
        
        <div class="separator"></div>
        
        <!-- Receipt Info -->
        <div class="center">
          <div class="bold">${getReceiptTitle(receiptData.type)}</div>
          <div>Receipt: ${receiptData.receiptNumber}</div>
          <div class="small">${receiptData.date} ${receiptData.time}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Guest Info -->
        <div class="row">
          <span>Guest:</span>
          <span class="bold">${receiptData.guestName}</span>
        </div>
        <div class="row">
          <span>Room:</span>
          <span class="bold">${receiptData.roomNumber}</span>
        </div>
        ${receiptData.checkInDate ? `
        <div class="row">
          <span>Check-in:</span>
          <span>${receiptData.checkInDate}</span>
        </div>
        ` : ''}
        ${receiptData.checkOutDate ? `
        <div class="row">
          <span>Check-out:</span>
          <span>${receiptData.checkOutDate}</span>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <!-- Items -->
        ${receiptData.items?.map(item => `
          <div>
            <div>${item.description}</div>
            <div class="row small">
              <span>${item.quantity} × ₦${item.unitPrice.toLocaleString()}</span>
              <span>₦${item.total.toLocaleString()}</span>
            </div>
          </div>
        `).join('') || `<div class="center">${receiptData.description}</div>`}
        
        <div class="separator"></div>
        
        <!-- Totals -->
        <div class="row">
          <span>Subtotal:</span>
          <span>₦${receiptData.subtotal.toLocaleString()}</span>
        </div>
        ${receiptData.taxBreakdown?.map(tax => `
        <div class="row small">
          <span>${tax.label} (${tax.rate}%):</span>
          <span>₦${tax.amount.toLocaleString()}</span>
        </div>
        `).join('') || (receiptData.tax ? `
        <div class="row small">
          <span>VAT (7.5%):</span>
          <span>₦${receiptData.tax.toLocaleString()}</span>
        </div>
        ` : '')}
        ${receiptData.serviceCharge ? `
        <div class="row small">
          <span>Service Charge:</span>
          <span>₦${receiptData.serviceCharge.toLocaleString()}</span>
        </div>
        ` : ''}
        <div class="separator"></div>
        <div class="row bold">
          <span>TOTAL:</span>
          <span>₦${receiptData.totalAmount.toLocaleString()}</span>
        </div>
        
        <div class="separator"></div>
        
        <!-- Payment -->
        <div class="row">
          <span>Payment:</span>
          <span>${receiptData.paymentMethod}</span>
        </div>
        <div class="row">
          <span>Amount Paid:</span>
          <span>₦${receiptData.amountPaid.toLocaleString()}</span>
        </div>
        ${receiptData.changeAmount ? `
        <div class="row">
          <span>Change:</span>
          <span>₦${receiptData.changeAmount.toLocaleString()}</span>
        </div>
        ` : ''}
        ${receiptData.balance ? `
        <div class="row">
          <span>Balance:</span>
          <span>₦${receiptData.balance.toLocaleString()}</span>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <!-- Staff Info -->
        <div class="row small">
          <span>Cashier:</span>
          <span>${receiptData.cashier}</span>
        </div>
        ${receiptData.shiftId ? `
        <div class="row small">
          <span>Shift:</span>
          <span>${receiptData.shiftId}</span>
        </div>
        ` : ''}
        
        ${receiptData.verificationUrl ? `
        <div class="qr-section">
          <div class="qr-placeholder">QR</div>
          <div class="small">Scan to verify</div>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <!-- Footer -->
        <div class="center small">
          <div class="bold">THANK YOU!</div>
          <div>CUSTOMER COPY</div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  // Helper function for receipt titles
  const getReceiptTitle = (type: string): string => {
    switch (type) {
      case 'check-in': return 'CHECK-IN RECEIPT';
      case 'check-out': return 'CHECK-OUT RECEIPT';
      case 'payment': return 'PAYMENT RECEIPT';
      case 'service': return 'SERVICE RECEIPT';
      case 'overstay': return 'OVERSTAY CHARGE';
      case 'deposit': return 'DEPOSIT RECEIPT';
      default: return 'RECEIPT';
    }
  };

  // Quick print functions for common scenarios
  const printCheckInReceipt = async (guestData: {
    guestName: string;
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    paymentMethod: string;
    totalAmount: number;
    amountPaid: number;
    notes?: string;
  }, options?: PrintOptions) => {
    const receiptData = createReceiptData('check-in', {
      ...guestData,
      description: 'Room Accommodation',
      subtotal: guestData.totalAmount,
    });
    
    return await printReceipt(receiptData, options);
  };

  const printPaymentReceipt = async (paymentData: {
    guestName: string;
    roomNumber: string;
    description: string;
    paymentMethod: string;
    totalAmount: number;
    amountPaid: number;
    changeAmount?: number;
    balance?: number;
    notes?: string;
  }, options?: PrintOptions) => {
    const receiptData = createReceiptData('payment', {
      ...paymentData,
      subtotal: paymentData.totalAmount,
    });
    
    return await printReceipt(receiptData, options);
  };

  const printServiceReceipt = async (serviceData: {
    guestName: string;
    roomNumber: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    paymentMethod: string;
    subtotal: number;
    tax?: number;
    serviceCharge?: number;
    totalAmount: number;
    amountPaid: number;
    notes?: string;
  }, options?: PrintOptions) => {
    const receiptData = createReceiptData('service', {
      ...serviceData,
      description: 'Hotel Services',
    });
    
    return await printReceipt(receiptData, options);
  };

  const printRoomReport = async (roomData: {
    roomNumber: string;
    roomType: string;
    roomName?: string;
    status: string;
    guestName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    folioBalance?: number;
    totalCharges?: number;
    totalPayments?: number;
    notes?: string;
  }, options?: PrintOptions) => {
    const receiptData = createReceiptData('service', {
      guestName: roomData.guestName || 'N/A',
      roomNumber: roomData.roomNumber,
      description: `Room Report - ${roomData.roomName || roomData.roomType}`,
      paymentMethod: 'N/A',
      subtotal: roomData.totalCharges || 0,
      totalAmount: roomData.folioBalance || 0,
      amountPaid: roomData.totalPayments || 0,
      balance: roomData.folioBalance,
      checkInDate: roomData.checkInDate,
      checkOutDate: roomData.checkOutDate,
      notes: roomData.notes || `Room Status: ${roomData.status.toUpperCase()}`,
      items: roomData.totalCharges ? [
        {
          description: `${roomData.roomType} - ${roomData.status.toUpperCase()}`,
          quantity: 1,
          unitPrice: roomData.totalCharges,
          total: roomData.totalCharges
        }
      ] : undefined
    });
    
    return await printReceipt(receiptData, options);
  };

  // Add to print queue for batch processing
  const addToQueue = (receiptData: ReceiptData) => {
    setPrintQueue(prev => [...prev, receiptData]);
  };

  // Process print queue
  const processQueue = async (options?: PrintOptions) => {
    for (const receipt of printQueue) {
      await printReceipt(receipt, options);
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setPrintQueue([]);
  };

  return {
    isPrinting,
    printQueue,
    createReceiptData,
    printReceipt,
    printCheckInReceipt,
    printPaymentReceipt,
    printServiceReceipt,
    printRoomReport,
    addToQueue,
    processQueue,
    generateReceiptNumber,
  };
};