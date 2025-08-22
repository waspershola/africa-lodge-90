import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Receipt,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import BillDetailsDialog from './BillDetailsDialog';
import AddChargeDialog from './AddChargeDialog';
import RecordPaymentDialog from './RecordPaymentDialog';

export default function BillsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  // Mock bills data linked to reservations
  const mockBills = [
    {
      id: 'BILL-001',
      reservationId: 'RES-001',
      guestName: 'John Smith',
      room: '205',
      checkIn: new Date(2024, 7, 22),
      checkOut: new Date(2024, 7, 25),
      status: 'pending',
      totalAmount: 450000,
      paidAmount: 200000,
      balancedue: 250000,
      lineItems: [
        { type: 'Room', description: 'Deluxe Room - 3 nights', quantity: 3, unitPrice: 120000, total: 360000 },
        { type: 'Tax', description: 'VAT (7.5%)', quantity: 1, unitPrice: 27000, total: 27000 },
        { type: 'Service', description: 'Service Charge (10%)', quantity: 1, unitPrice: 36000, total: 36000 },
        { type: 'Extra', description: 'Minibar', quantity: 1, unitPrice: 15000, total: 15000 },
        { type: 'Extra', description: 'Laundry', quantity: 1, unitPrice: 12000, total: 12000 }
      ],
      payments: [
        { id: 'PAY-001', date: new Date(2024, 7, 22), amount: 200000, method: 'card', reference: 'TXN123456' }
      ],
      discounts: [],
      createdAt: new Date(2024, 7, 22)
    },
    {
      id: 'BILL-002',
      reservationId: 'RES-002',
      guestName: 'Sarah Wilson',
      room: '312',
      checkIn: new Date(2024, 7, 23),
      checkOut: new Date(2024, 7, 26),
      status: 'paid',
      totalAmount: 285000,
      paidAmount: 285000,
      balancedue: 0,
      lineItems: [
        { type: 'Room', description: 'Standard Room - 3 nights', quantity: 3, unitPrice: 80000, total: 240000 },
        { type: 'Tax', description: 'VAT (7.5%)', quantity: 1, unitPrice: 18000, total: 18000 },
        { type: 'Service', description: 'Service Charge (10%)', quantity: 1, unitPrice: 24000, total: 24000 },
        { type: 'Extra', description: 'Room Service', quantity: 1, unitPrice: 3000, total: 3000 }
      ],
      payments: [
        { id: 'PAY-002', date: new Date(2024, 7, 23), amount: 285000, method: 'transfer', reference: 'BANK789' }
      ],
      discounts: [],
      createdAt: new Date(2024, 7, 23)
    },
    {
      id: 'BILL-003',
      reservationId: 'RES-003',
      guestName: 'Michael Chen',
      room: '108',
      checkIn: new Date(2024, 7, 24),
      checkOut: new Date(2024, 7, 27),
      status: 'overdue',
      totalAmount: 520000,
      paidAmount: 100000,
      balancedue: 420000,
      lineItems: [
        { type: 'Room', description: 'Suite - 3 nights', quantity: 3, unitPrice: 150000, total: 450000 },
        { type: 'Tax', description: 'VAT (7.5%)', quantity: 1, unitPrice: 33750, total: 33750 },
        { type: 'Service', description: 'Service Charge (10%)', quantity: 1, unitPrice: 45000, total: 45000 },
        { type: 'Extra', description: 'Conference Room', quantity: 1, unitPrice: 25000, total: 25000 }
      ],
      payments: [
        { id: 'PAY-003', date: new Date(2024, 7, 24), amount: 100000, method: 'cash', reference: 'CASH001' }
      ],
      discounts: [
        { type: 'Corporate Discount', percentage: 10, amount: -33750 }
      ],
      createdAt: new Date(2024, 7, 24)
    }
  ];

  const filteredBills = mockBills.filter(bill =>
    bill.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.room.includes(searchTerm) ||
    bill.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewBill = (bill: any) => {
    setSelectedBill(bill);
    setShowBillDetails(true);
  };

  const handleAddCharge = (bill: any) => {
    setSelectedBill(bill);
    setShowAddCharge(true);
  };

  const handleRecordPayment = (bill: any) => {
    setSelectedBill(bill);
    setShowRecordPayment(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills by guest name, room, or bill ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <div className="grid gap-4">
        {filteredBills.map((bill) => (
          <Card key={bill.id} className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{bill.id}</div>
                    <div className="text-sm text-muted-foreground">{bill.guestName} • Room {bill.room}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(bill.status)}>
                    {bill.status.toUpperCase()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Check-in</div>
                    <div className="text-sm text-muted-foreground">
                      {format(bill.checkIn, 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Nights</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.ceil((bill.checkOut.getTime() - bill.checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Total Amount</div>
                    <div className="text-sm text-muted-foreground">
                      ₦{bill.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Balance Due</div>
                    <div className={`text-sm font-semibold ${
                      bill.balancedue > 0 ? 'text-danger' : 'text-success'
                    }`}>
                      ₦{bill.balancedue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Payment Progress</span>
                  <span className="text-sm text-muted-foreground">
                    ₦{bill.paidAmount.toLocaleString()} / ₦{bill.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      bill.status === 'paid' ? 'bg-success' : 
                      bill.status === 'overdue' ? 'bg-danger' : 'bg-warning'
                    }`}
                    style={{ 
                      width: `${(bill.paidAmount / bill.totalAmount) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAddCharge(bill)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
                
                {bill.balancedue > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRecordPayment(bill)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                
                <Button variant="outline" size="sm">
                  Print Invoice
                </Button>
                <Button variant="outline" size="sm">
                  Email Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      {showBillDetails && selectedBill && (
        <BillDetailsDialog
          bill={selectedBill}
          onClose={() => setShowBillDetails(false)}
        />
      )}

      {showAddCharge && selectedBill && (
        <AddChargeDialog
          bill={selectedBill}
          onClose={() => setShowAddCharge(false)}
        />
      )}

      {showRecordPayment && selectedBill && (
        <RecordPaymentDialog
          bill={selectedBill}
          onClose={() => setShowRecordPayment(false)}
        />
      )}
    </div>
  );
}