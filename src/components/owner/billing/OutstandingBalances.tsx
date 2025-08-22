import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle,
  TrendingDown,
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  User,
  Building,
  CreditCard,
  Clock
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function OutstandingBalances() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  // Mock outstanding balances data
  const outstandingBalances = [
    {
      id: 'OUT-001',
      guestName: 'Michael Chen',
      room: '108',
      billId: 'BILL-003',
      totalAmount: 520000,
      paidAmount: 100000,
      balancedue: 420000,
      dueDate: new Date(2024, 7, 31),
      checkOutDate: new Date(2024, 7, 27),
      contactInfo: {
        email: 'michael.chen@email.com',
        phone: '+234 802 123 4567'
      },
      lastContactDate: new Date(2024, 7, 29),
      priority: 'high',
      notes: 'Guest promised to settle by end of month. Corporate booking.'
    },
    {
      id: 'OUT-002',
      guestName: 'David Thompson',
      room: '225',
      billId: 'BILL-007',
      totalAmount: 180000,
      paidAmount: 80000,
      balancedue: 100000,
      dueDate: new Date(2024, 8, 2),
      checkOutDate: new Date(2024, 7, 25),
      contactInfo: {
        email: 'david.thompson@email.com',
        phone: '+234 803 987 6543'
      },
      lastContactDate: new Date(2024, 7, 28),
      priority: 'medium',
      notes: 'Payment plan agreed - ₦50k weekly installments.'
    },
    {
      id: 'OUT-003',
      guestName: 'Jennifer Wilson',
      room: '340',
      billId: 'BILL-012',
      totalAmount: 95000,
      paidAmount: 45000,
      balancedue: 50000,
      dueDate: new Date(2024, 8, 5),
      checkOutDate: new Date(2024, 7, 30),
      contactInfo: {
        email: 'jennifer.wilson@email.com',
        phone: '+234 805 555 1234'
      },
      lastContactDate: null,
      priority: 'low',
      notes: 'First-time guest. Check-out was smooth, likely just delayed payment.'
    },
    {
      id: 'OUT-004',
      guestName: 'Robert Anderson',
      room: '415',
      billId: 'BILL-009',
      totalAmount: 750000,
      paidAmount: 200000,
      balancedue: 550000,
      dueDate: new Date(2024, 7, 28),
      checkOutDate: new Date(2024, 7, 24),
      contactInfo: {
        email: 'robert.anderson@email.com',
        phone: '+234 807 246 8135'
      },
      lastContactDate: new Date(2024, 7, 30),
      priority: 'urgent',
      notes: 'Multiple follow-ups sent. Guest not responding to calls or emails.'
    }
  ];

  const filteredBalances = outstandingBalances.filter(balance => {
    const matchesSearch = searchTerm === '' || 
      balance.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.room.includes(searchTerm) ||
      balance.billId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || balance.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Calculate summary stats
  const summary = {
    totalOutstanding: outstandingBalances.reduce((sum, balance) => sum + balance.balancedue, 0),
    totalGuests: outstandingBalances.length,
    urgentCases: outstandingBalances.filter(b => b.priority === 'urgent').length,
    averageBalance: outstandingBalances.reduce((sum, balance) => sum + balance.balancedue, 0) / outstandingBalances.length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysOverdue = (dueDate: Date) => {
    return Math.max(0, differenceInDays(new Date(), dueDate));
  };

  const handleSendReminder = (balance: any) => {
    console.log('Sending reminder to:', balance.guestName);
    // In a real app, this would integrate with email/SMS service
  };

  const handleCallGuest = (balance: any) => {
    console.log('Calling guest:', balance.contactInfo.phone);
    // In a real app, this might integrate with a calling service or log the contact attempt
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-danger">₦{(summary.totalOutstanding / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-muted-foreground">Total Outstanding</div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{summary.totalGuests}</div>
            <div className="text-sm text-muted-foreground">Guests with Balance</div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-danger">{summary.urgentCases}</div>
            <div className="text-sm text-muted-foreground">Urgent Cases</div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">₦{(summary.averageBalance / 1000).toFixed(0)}K</div>
            <div className="text-sm text-muted-foreground">Average Balance</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, room, or bill ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Bulk Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Balances List */}
      <div className="grid gap-4">
        {filteredBalances.map((balance) => {
          const daysOverdue = getDaysOverdue(balance.dueDate);
          
          return (
            <Card key={balance.id} className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-danger" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{balance.guestName}</div>
                      <div className="text-sm text-muted-foreground">Room {balance.room} • Bill {balance.billId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(balance.priority)}>
                      {balance.priority.toUpperCase()}
                    </Badge>
                    {daysOverdue > 0 && (
                      <Badge variant="destructive">
                        {daysOverdue} days overdue
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Balance Due</div>
                      <div className="text-lg font-bold text-danger">
                        ₦{balance.balancedue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Due Date</div>
                      <div className="text-sm text-muted-foreground">
                        {format(balance.dueDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Check-out</div>
                      <div className="text-sm text-muted-foreground">
                        {format(balance.checkOutDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Last Contact</div>
                      <div className="text-sm text-muted-foreground">
                        {balance.lastContactDate ? format(balance.lastContactDate, 'MMM d, yyyy') : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Payment Progress</span>
                    <span className="text-sm text-muted-foreground">
                      ₦{balance.paidAmount.toLocaleString()} / ₦{balance.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-danger"
                      style={{ 
                        width: `${(balance.paidAmount / balance.totalAmount) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{balance.contactInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{balance.contactInfo.phone}</span>
                  </div>
                </div>

                {/* Notes */}
                {balance.notes && (
                  <div className="bg-muted/50 rounded p-3 mb-4">
                    <div className="text-sm font-medium mb-1">Notes:</div>
                    <div className="text-sm text-muted-foreground">{balance.notes}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSendReminder(balance)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCallGuest(balance)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Guest
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    View Bill
                  </Button>

                  <Button variant="outline" size="sm">
                    Payment Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBalances.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">No outstanding balances found</div>
            <div className="text-sm text-muted-foreground">
              {searchTerm || filterPriority !== 'all' 
                ? 'No balances match your current search criteria' 
                : 'All guests have paid their bills in full!'
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}