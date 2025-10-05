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
import { useBillingData } from '@/hooks/data/useBillingData';

export default function BillsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  const { bills, isLoading } = useBillingData();

  const filteredBills = bills.filter(bill =>
    bill.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.room_number?.includes(searchTerm) ||
    bill.folio_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading bills...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-success text-success-foreground';
      case 'open': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (bill: any) => {
    if (bill.status === 'closed') return 'PAID';
    if (bill.balance === 0) return 'PAID';
    if (bill.balance > 0) return 'PENDING';
    return 'OPEN';
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
        {filteredBills.map((bill) => {
          const checkInDate = bill.check_in_date ? new Date(bill.check_in_date) : null;
          const checkOutDate = bill.check_out_date ? new Date(bill.check_out_date) : null;
          const nights = checkInDate && checkOutDate 
            ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          
          return (
            <Card key={bill.id} className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{bill.folio_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {bill.guest_name || 'Unknown Guest'} • Room {bill.room_number || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(bill.status)}>
                      {getStatusLabel(bill)}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleViewBill(bill)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {checkInDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Check-in</div>
                        <div className="text-sm text-muted-foreground">
                          {format(checkInDate, 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {nights > 0 && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Nights</div>
                        <div className="text-sm text-muted-foreground">
                          {nights} nights
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Total Charges</div>
                      <div className="text-sm text-muted-foreground">
                        ₦{bill.total_charges.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Balance</div>
                      <div className={`text-sm font-semibold ${
                        bill.balance > 0 ? 'text-danger' : 'text-success'
                      }`}>
                        ₦{Math.abs(bill.balance).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Payment Progress</span>
                    <span className="text-sm text-muted-foreground">
                      ₦{bill.total_payments.toLocaleString()} / ₦{bill.total_charges.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        bill.balance === 0 ? 'bg-success' : 
                        bill.status === 'closed' ? 'bg-success' : 'bg-warning'
                      }`}
                      style={{ 
                        width: `${bill.total_charges > 0 ? (bill.total_payments / bill.total_charges) * 100 : 0}%` 
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
                    disabled={bill.status === 'closed'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Charge
                  </Button>
                  
                  {bill.balance > 0 && bill.status === 'open' && (
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
          );
        })}
      </div>

      {filteredBills.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">No bills found</div>
            <div className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search' : 'Bills will appear here once reservations are created'}
            </div>
          </CardContent>
        </Card>
      )}

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