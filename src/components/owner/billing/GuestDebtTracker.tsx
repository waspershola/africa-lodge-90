import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserX, Clock, CreditCard, AlertTriangle, Phone, Mail, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface GuestDebt {
  id: string;
  guestName: string;
  room: string;
  phone: string;
  email: string;
  totalDebt: number;
  outstandingAmount: number;
  paymentMode: string;
  checkInDate: string;
  checkOutDate: string;
  daysOverdue: number;
  status: 'active' | 'overdue' | 'critical' | 'resolved';
  transactions: {
    id: string;
    date: string;
    type: 'charge' | 'payment';
    amount: number;
    description: string;
    paymentMethod?: string;
  }[];
  notes?: string;
}

const mockGuestDebts: GuestDebt[] = [
  {
    id: '1',
    guestName: 'John Doe',
    room: '305',
    phone: '+234 803 123 4567',
    email: 'john.doe@email.com',
    totalDebt: 45000,
    outstandingAmount: 25000,
    paymentMode: 'Pay Later',
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-18',
    daysOverdue: 5,
    status: 'overdue',
    transactions: [
      { id: '1', date: '2024-01-15', type: 'charge', amount: 45000, description: 'Room charges (3 nights)' },
      { id: '2', date: '2024-01-18', type: 'payment', amount: 20000, description: 'Partial payment', paymentMethod: 'Cash' }
    ],
    notes: 'Guest promised to pay remaining balance by end of week'
  },
  {
    id: '2',
    guestName: 'Sarah Wilson',
    room: '201',
    phone: '+234 805 987 6543',
    email: 'sarah.w@email.com',
    totalDebt: 75000,
    outstandingAmount: 75000,
    paymentMode: 'Debtor Account',
    checkInDate: '2024-01-10',
    checkOutDate: '2024-01-14',
    daysOverdue: 12,
    status: 'critical',
    transactions: [
      { id: '3', date: '2024-01-10', type: 'charge', amount: 60000, description: 'Room charges (4 nights)' },
      { id: '4', date: '2024-01-12', type: 'charge', amount: 15000, description: 'Extra services' }
    ],
    notes: 'Corporate account - pending company approval'
  }
];

export default function GuestDebtTracker() {
  const [debts, setDebts] = useState<GuestDebt[]>(mockGuestDebts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDebt, setSelectedDebt] = useState<GuestDebt | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.room.includes(searchTerm) ||
                         debt.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = debts.reduce((sum, debt) => sum + debt.outstandingAmount, 0);
  const overdueCases = debts.filter(debt => debt.status === 'overdue' || debt.status === 'critical').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recordPayment = () => {
    if (!selectedDebt || !paymentAmount || !paymentMethod) return;

    const amount = parseFloat(paymentAmount);
    const newTransaction = {
      id: `payment-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'payment' as const,
      amount,
      description: paymentNotes || 'Payment received',
      paymentMethod
    };

    setDebts(prevDebts =>
      prevDebts.map(debt => {
        if (debt.id === selectedDebt.id) {
          const newOutstanding = Math.max(0, debt.outstandingAmount - amount);
          return {
            ...debt,
            outstandingAmount: newOutstanding,
            status: newOutstanding === 0 ? 'resolved' as const : debt.status,
            transactions: [...debt.transactions, newTransaction]
          };
        }
        return debt;
      })
    );

    setIsAddingPayment(false);
    setPaymentAmount('');
    setPaymentMethod('');
    setPaymentNotes('');
    setSelectedDebt(null);

    toast({
      title: "Payment recorded",
      description: `${formatPrice(amount)} payment has been recorded for ${selectedDebt.guestName}.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPrice(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">Across all debtors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overdueCases}</div>
            <p className="text-xs text-muted-foreground">Requiring follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Debtors</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {debts.filter(d => d.status !== 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">Current cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Days Overdue</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(debts.reduce((sum, debt) => sum + debt.daysOverdue, 0) / debts.length) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Debt Management</CardTitle>
          <CardDescription>Track and manage guest debts and payment collections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by guest name, room, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:max-w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Total Debt</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{debt.guestName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {debt.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{debt.room}</TableCell>
                    <TableCell>{formatPrice(debt.totalDebt)}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatPrice(debt.outstandingAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{debt.paymentMode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={debt.daysOverdue > 7 ? "destructive" : "secondary"}>
                        {debt.daysOverdue} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(debt.status)}>
                        {debt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setIsAddingPayment(true);
                          }}
                          disabled={debt.status === 'resolved'}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Guest: {selectedDebt.guestName}</div>
                  <div className="text-sm text-muted-foreground">Room: {selectedDebt.room}</div>
                  <div className="text-lg font-bold text-red-600">
                    Outstanding: {formatPrice(selectedDebt.outstandingAmount)}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount received"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="moniepoint-pos">Moniepoint POS</SelectItem>
                    <SelectItem value="opay-pos">Opay POS</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paystack">Paystack Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes (Optional)</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this payment..."
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingPayment(false)}>
              Cancel
            </Button>
            <Button onClick={recordPayment} disabled={!paymentAmount || !paymentMethod}>
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}