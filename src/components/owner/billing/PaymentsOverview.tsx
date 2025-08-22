import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsOverview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('today');

  // Mock payments data
  const mockPayments = [
    {
      id: 'PAY-001',
      billId: 'BILL-001',
      guestName: 'John Smith',
      room: '205',
      amount: 200000,
      method: 'card',
      reference: 'TXN123456',
      date: new Date(2024, 7, 22, 14, 30),
      status: 'completed'
    },
    {
      id: 'PAY-002',
      billId: 'BILL-002',
      guestName: 'Sarah Wilson',
      room: '312',
      amount: 285000,
      method: 'transfer',
      reference: 'BANK789',
      date: new Date(2024, 7, 22, 16, 45),
      status: 'completed'
    },
    {
      id: 'PAY-003',
      billId: 'BILL-003',
      guestName: 'Michael Chen',
      room: '108',
      amount: 100000,
      method: 'cash',
      reference: 'CASH001',
      date: new Date(2024, 7, 22, 10, 15),
      status: 'completed'
    },
    {
      id: 'PAY-004',
      billId: 'BILL-004',
      guestName: 'Emily Davis',
      room: '420',
      amount: 180000,
      method: 'pos',
      reference: 'POS456789',
      date: new Date(2024, 7, 22, 18, 20),
      status: 'completed'
    },
    {
      id: 'PAY-005',
      billId: 'BILL-005',
      guestName: 'Robert Johnson',
      room: '115',
      amount: 95000,
      method: 'wallet',
      reference: 'WALLET987',
      date: new Date(2024, 7, 22, 12, 10),
      status: 'pending'
    }
  ];

  // Summary data
  const paymentSummary = {
    totalToday: mockPayments.reduce((sum, payment) => sum + payment.amount, 0),
    totalCount: mockPayments.length,
    byMethod: mockPayments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>)
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      payment.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.room.includes(searchTerm) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
    
    return matchesSearch && matchesMethod;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800 border-green-200';
      case 'card': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transfer': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pos': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'wallet': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(paymentSummary.byMethod).map(([method, amount]) => (
          <Card key={method} className="luxury-card">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-lg font-bold">₦{(amount / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground capitalize">{method}</div>
                <Badge className={`mt-2 ${getMethodColor(method)}`}>
                  {mockPayments.filter(p => p.method === method).length} payments
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments by guest, room, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Bank Transfer</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
                <SelectItem value="wallet">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Today's Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success">₦{(paymentSummary.totalToday / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-muted-foreground">Total Collected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{paymentSummary.totalCount}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">₦{Math.round(paymentSummary.totalToday / paymentSummary.totalCount / 1000)}K</div>
              <div className="text-sm text-muted-foreground">Average Transaction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <div className="font-semibold">{payment.guestName}</div>
                    <div className="text-sm text-muted-foreground">
                      Room {payment.room} • {payment.reference}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">₦{payment.amount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(payment.date, 'MMM d, HH:mm')}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <Badge className={getMethodColor(payment.method)}>
                      {payment.method.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>

                  <Button variant="outline" size="sm">
                    View Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payments found for the selected criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}