import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, AlertCircle, Search, Filter } from "lucide-react";

interface PaymentStatus {
  id: string;
  reservationNumber: string;
  guestName: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'failed' | 'partial';
  paymentMethod: string;
  confirmedBy?: string;
  confirmedAt?: string;
  notes?: string;
  reference?: string;
}

const mockPaymentStatuses: PaymentStatus[] = [
  {
    id: '1',
    reservationNumber: 'RES-20240927-001',
    guestName: 'John Doe',
    amount: 75000,
    status: 'confirmed',
    paymentMethod: 'Bank Transfer',
    confirmedBy: 'Front Desk Staff',
    confirmedAt: '2024-09-27 10:30 AM',
    reference: 'TXN-123456789'
  },
  {
    id: '2',
    reservationNumber: 'RES-20240927-002',
    guestName: 'Jane Smith',
    amount: 120000,
    status: 'pending',
    paymentMethod: 'Mobile Money',
    notes: 'Awaiting confirmation from guest'
  },
  {
    id: '3',
    reservationNumber: 'RES-20240927-003',
    guestName: 'Mike Johnson',
    amount: 85000,
    status: 'partial',
    paymentMethod: 'Cash + Card',
    notes: 'Paid ₦50,000 cash, ₦35,000 pending'
  }
];

export default function PaymentStatusTracker() {
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>(mockPaymentStatuses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusIcon = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const filteredStatuses = paymentStatuses.filter(status => {
    const matchesSearch = status.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         status.reservationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || status.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const confirmPayment = (id: string) => {
    setPaymentStatuses(prev => prev.map(status => 
      status.id === id 
        ? { ...status, status: 'confirmed' as const, confirmedAt: new Date().toLocaleString(), confirmedBy: 'Current User' }
        : status
    ));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paymentStatuses.filter(s => s.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {paymentStatuses.filter(s => s.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {paymentStatuses.filter(s => s.status === 'partial').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {paymentStatuses.filter(s => s.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payment Status Tracking</CardTitle>
              <CardDescription>
                Track and confirm guest payment statuses for reservations
              </CardDescription>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or reservation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredStatuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(status.status)}
                  <div>
                    <p className="font-medium">{status.guestName}</p>
                    <p className="text-sm text-muted-foreground">{status.reservationNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">₦{status.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{status.paymentMethod}</p>
                  </div>
                  
                  <Badge className={getStatusColor(status.status)}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </Badge>
                  
                  {status.status === 'pending' && (
                    <Button
                      onClick={() => confirmPayment(status.id)}
                      size="sm"
                      variant="outline"
                    >
                      Confirm Payment
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}