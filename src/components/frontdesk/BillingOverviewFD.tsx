// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Receipt,
  Download,
  Search,
  Filter,
  Eye,
  Printer
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useBilling } from "@/hooks/useBilling";
import { usePaymentMethodsContext } from "@/contexts/PaymentMethodsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";

interface PendingPayment {
  id: string;
  guestName: string;
  room: string;
  amount: number;
  type: 'room-charge' | 'deposit' | 'service' | 'extras';
  dueDate: Date;
  overdue: boolean;
  folioId: string;
  notes?: string;
}

interface CompletedPayment {
  id: string;
  guestName: string;
  room: string;
  amount: number;
  method: string;
  processedAt: Date;
  processedBy: string;
  transactionRef?: string;
}

interface DailySummary {
  date: string;
  totalCollected: number;
  totalPending: number;
  paymentMethods: Record<string, number>;
  transactionCount: number;
}

const mockPendingPayments: PendingPayment[] = [
  {
    id: '1',
    guestName: 'Sarah Johnson',
    room: '305',
    amount: 45000,
    type: 'room-charge',
    dueDate: new Date('2024-09-18T14:00:00'),
    overdue: false,
    folioId: 'F305-001'
  },
  {
    id: '2',
    guestName: 'Mike Chen',
    room: '201',
    amount: 15000,
    type: 'deposit',
    dueDate: new Date('2024-09-17T12:00:00'),
    overdue: true,
    folioId: 'F201-003',
    notes: 'Guest requested payment extension'
  },
  {
    id: '3',
    guestName: 'Amara Okafor',
    room: '150',
    amount: 8500,
    type: 'service',
    dueDate: new Date('2024-09-18T18:00:00'),
    overdue: false,
    folioId: 'F150-002'
  }
];

const mockCompletedPayments: CompletedPayment[] = [
  {
    id: '1',
    guestName: 'David Wilson',
    room: '410',
    amount: 52000,
    method: 'Moniepoint POS',
    processedAt: new Date('2024-09-18T09:30:00'),
    processedBy: 'Front Desk Staff',
    transactionRef: 'TXN-001234'
  },
  {
    id: '2',
    guestName: 'Lisa Brown',
    room: '302',
    amount: 12000,
    method: 'Cash',
    processedAt: new Date('2024-09-18T08:15:00'),
    processedBy: 'Front Desk Staff'
  },
  {
    id: '3',
    guestName: 'John Smith',
    room: '255',
    amount: 35000,
    method: 'Bank Transfer',
    processedAt: new Date('2024-09-18T07:45:00'),
    processedBy: 'Front Desk Staff',
    transactionRef: 'TXN-001235'
  }
];

const mockDailySummary: DailySummary = {
  date: '2024-09-18',
  totalCollected: 99000,
  totalPending: 68500,
  paymentMethods: {
    'Moniepoint POS': 52000,
    'Cash': 12000,
    'Bank Transfer': 35000
  },
  transactionCount: 3
};

export const BillingOverviewFD = () => {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { billingStats, folioBalances, payments, loading } = useBilling();
  const { formatPrice } = useCurrency();
  const { getMethodById } = usePaymentMethodsContext();

  // Fetch staff names for payments
  const { data: staffMap } = useQuery({
    queryKey: ['payment-staff-names', tenant?.tenant_id],
    queryFn: async () => {
      const staffIds = payments
        .map(p => p.processed_by)
        .filter((id): id is string => !!id);
      const uniqueStaffIds = [...new Set(staffIds)];
      
      if (uniqueStaffIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('id', uniqueStaffIds);
      
      if (error) throw error;
      
      return data.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {} as Record<string, string>);
    },
    enabled: !!tenant?.tenant_id && payments.length > 0,
  });

  // Convert folio balances to pending payments format
  const pendingPayments: PendingPayment[] = folioBalances
    .filter(f => f.balance > 0)
    .map(f => ({
      id: f.folio_id,
      guestName: f.guest_name,
      room: f.room_number,
      amount: f.balance,
      type: 'room-charge' as const,
      dueDate: new Date(),
      overdue: f.status === 'overdue',
      folioId: f.folio_number
    }));

  // Convert payments to completed format with payment method names and staff names
  const completedPayments: CompletedPayment[] = payments.map(p => {
    const method = p.payment_method_id ? getMethodById(p.payment_method_id) : null;
    const staffName = p.processed_by ? (staffMap?.[p.processed_by] || 'Unknown Staff') : 'System';
    return {
      id: p.id,
      guestName: (p as any).folios?.reservations?.guest_name || 'Unknown Guest',
      room: (p as any).folios?.reservations?.rooms?.room_number || 'N/A',
      amount: p.amount,
      method: method?.name || p.payment_method || 'Unknown',
      processedAt: new Date(p.created_at),
      processedBy: staffName,
      transactionRef: p.reference
    };
  });

  // Calculate daily summary from real data - grouping all payment methods
  const dailySummaryPaymentMethods = payments
    .filter(p => new Date(p.created_at).toDateString() === new Date().toDateString())
    .reduce((acc, p) => {
      const method = p.payment_method_id ? getMethodById(p.payment_method_id) : null;
      const methodName = method?.name || p.payment_method || 'Unknown';
      acc[methodName] = (acc[methodName] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

  const dailySummary: DailySummary = {
    date: new Date().toISOString().split('T')[0],
    totalCollected: Object.values(dailySummaryPaymentMethods).reduce((sum, amount) => sum + amount, 0),
    totalPending: folioBalances.filter(f => f.balance > 0).reduce((sum, f) => sum + f.balance, 0),
    paymentMethods: dailySummaryPaymentMethods,
    transactionCount: payments.filter(p => 
      new Date(p.created_at).toDateString() === new Date().toDateString()
    ).length
  };

  const getPaymentTypeColor = (type: PendingPayment['type']) => {
    switch (type) {
      case 'room-charge': return 'bg-blue-100 text-blue-800';
      case 'deposit': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      case 'extras': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPendingPayments = pendingPayments.filter(payment => {
    const matchesSearch = payment.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.room.includes(searchTerm);
    const matchesFilter = paymentFilter === 'all' || 
                         (paymentFilter === 'overdue' && payment.overdue) ||
                         (paymentFilter === 'today' && !payment.overdue);
    return matchesSearch && matchesFilter;
  });

  const filteredCompletedPayments = completedPayments.filter(payment => 
    payment.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.room.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-success">
                  {loading ? '...' : formatPrice(dailySummary.totalCollected)}
                </div>
                <div className="text-sm text-muted-foreground">Collected Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-warning">
                  {loading ? '...' : formatPrice(dailySummary.totalPending)}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {dailySummary.transactionCount}
                </div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {pendingPayments.filter(p => p.overdue).length}
                </div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="overdue">Overdue Only</SelectItem>
                <SelectItem value="today">Due Today</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({filteredPendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filteredCompletedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="summary">Daily Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredPendingPayments.map((payment) => (
            <Card key={payment.id} className={payment.overdue ? 'border-red-200 bg-red-50/20' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{payment.guestName}</h3>
                      <Badge variant="outline">Room {payment.room}</Badge>
                      <Badge className={getPaymentTypeColor(payment.type)}>
                        {payment.type.replace('-', ' ').toUpperCase()}
                      </Badge>
                      {payment.overdue && (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          OVERDUE
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatPrice(payment.amount)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Due: {payment.dueDate.toLocaleDateString()}</span>
                      <span>Folio: {payment.folioId}</span>
                      {payment.notes && <span>Notes: {payment.notes}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Folio
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Collect Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredCompletedPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{payment.guestName}</h3>
                      <Badge variant="outline">Room {payment.room}</Badge>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        PAID
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-green-600 mb-1">
                      {formatPrice(payment.amount)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Method: {payment.method}</span>
                      <span>Time: {payment.processedAt.toLocaleTimeString()}</span>
                      <span>By: {payment.processedBy}</span>
                      {payment.transactionRef && <span>Ref: {payment.transactionRef}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dailySummary.paymentMethods).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="font-medium">{method}</span>
                      <div className="text-right">
                        <div className="font-bold">{formatPrice(amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {((amount / dailySummary.totalCollected) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Due Today:</span>
                    <span className="font-bold">
                      {formatPrice(dailySummary.totalCollected + dailySummary.totalPending)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collected:</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(dailySummary.totalCollected)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-bold text-yellow-600">
                      {formatPrice(dailySummary.totalPending)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Collection Rate:</span>
                      <span className="font-bold text-primary">
                        {((dailySummary.totalCollected / (dailySummary.totalCollected + dailySummary.totalPending)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};