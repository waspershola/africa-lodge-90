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
import { useDebtTracking } from "@/hooks/useDebtTracking";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

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

export default function GuestDebtTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { enabledMethods } = usePaymentMethods();
  const { 
    debts, 
    loading, 
    error, 
    recordPayment, 
    totalOutstanding, 
    overdueCases, 
    activeCases, 
    avgDaysOverdue 
  } = useDebtTracking();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.room_number.includes(searchTerm) ||
                         debt.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculated values are now provided by the hook

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

  const handleRecordPayment = async () => {
    if (!selectedDebt || !paymentAmount || !paymentMethod) return;

    try {
      const amount = parseFloat(paymentAmount);
      await recordPayment(selectedDebt.id, amount, paymentMethod, paymentNotes);

      setIsAddingPayment(false);
      setPaymentAmount('');
      setPaymentMethod('');
      setPaymentNotes('');
      setSelectedDebt(null);

      toast({
        title: "Payment recorded",
        description: `${formatPrice(amount)} payment has been recorded for ${selectedDebt.guest_name}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      });
    }
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
              {activeCases}
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
              {avgDaysOverdue}
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
                        <div className="font-medium">{debt.guest_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {debt.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{debt.room_number}</TableCell>
                    <TableCell>{formatPrice(debt.total_debt)}</TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatPrice(debt.outstanding_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{debt.payment_mode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={debt.days_overdue > 7 ? "destructive" : "secondary"}>
                        {debt.days_overdue} days
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
                  <div className="text-sm font-medium">Guest: {selectedDebt.guest_name}</div>
                  <div className="text-sm text-muted-foreground">Room: {selectedDebt.room_number}</div>
                  <div className="text-lg font-bold text-red-600">
                    Outstanding: {formatPrice(selectedDebt.outstanding_amount)}
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
                    {enabledMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
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
            <Button onClick={handleRecordPayment} disabled={!paymentAmount || !paymentMethod}>
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}