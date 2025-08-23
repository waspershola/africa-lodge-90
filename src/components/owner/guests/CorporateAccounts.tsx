import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2,
  Search,
  Plus,
  Users,
  CreditCard,
  Eye,
  Save,
  X,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';

export default function CorporateAccounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    billingType: 'centralized',
    creditLimit: '',
    notes: ''
  });

  // Mock corporate accounts data
  const corporateAccounts = [
    {
      id: 'corp-1',
      company: 'Tech Solutions Ltd',
      contactPerson: 'John Smith',
      email: 'billing@techsolutions.com',
      phone: '+234 901 234 5678',
      status: 'active',
      guestCount: 25,
      totalBookings: 156,
      totalRevenue: 12500000,
      outstandingBalance: 250000,
      billingType: 'centralized'
    },
    {
      id: 'corp-2',
      company: 'Global Consulting',
      contactPerson: 'Sarah Johnson',
      email: 'accounts@globalconsulting.com',
      phone: '+234 902 345 6789',
      status: 'active',
      guestCount: 18,
      totalBookings: 89,
      totalRevenue: 8900000,
      outstandingBalance: 0,
      billingType: 'individual'
    }
  ];

  const filteredAccounts = corporateAccounts.filter(account =>
    account.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAccount = () => {
    // Handle account creation
    console.log('Creating account:', newAccount);
    setShowNewAccount(false);
    setNewAccount({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      billingType: 'centralized',
      creditLimit: '',
      notes: ''
    });
  };

  const handleViewAccount = (account: any) => {
    setSelectedAccount(account);
    setShowAccountDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'suspended': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending': return 'bg-warning/10 text-warning-foreground border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="luxury-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search corporate accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowNewAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Corporate Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{account.company}</h3>
                    <p className="text-sm text-muted-foreground">Contact: {account.contactPerson}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(account.status)} variant="outline">
                        {account.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {account.billingType.toUpperCase()} BILLING
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Guests</div>
                  <div className="text-2xl font-bold">{account.guestCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Bookings</div>
                  <div className="text-2xl font-bold">{account.totalBookings}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-xl font-bold">₦{(account.totalRevenue / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                  <div className={`text-xl font-bold ${account.outstandingBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                    ₦{(account.outstandingBalance / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewAccount(account)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  View Guests
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">No corporate accounts found</div>
            <Button onClick={() => setShowNewAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Corporate Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Account Dialog */}
      {showNewAccount && (
        <Dialog open={true} onOpenChange={() => setShowNewAccount(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Add New Corporate Account
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input
                    value={newAccount.contactPerson}
                    onChange={(e) => setNewAccount({...newAccount, contactPerson: e.target.value})}
                    placeholder="Primary contact name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({...newAccount, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={newAccount.address}
                  onChange={(e) => setNewAccount({...newAccount, address: e.target.value})}
                  placeholder="Company address"
                  className="min-h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Billing Type</Label>
                  <Select value={newAccount.billingType} onValueChange={(value) => setNewAccount({...newAccount, billingType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="centralized">Centralized Billing</SelectItem>
                      <SelectItem value="individual">Individual Invoices</SelectItem>
                      <SelectItem value="departmental">Department-wise Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Credit Limit (₦)</Label>
                  <Input
                    type="number"
                    value={newAccount.creditLimit}
                    onChange={(e) => setNewAccount({...newAccount, creditLimit: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newAccount.notes}
                  onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                  placeholder="Additional notes about the account"
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateAccount}>
                <Save className="h-4 w-4 mr-2" />
                Create Account
              </Button>
              <Button variant="outline" onClick={() => setShowNewAccount(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Account Details Dialog */}
      {showAccountDetails && selectedAccount && (
        <Dialog open={true} onOpenChange={() => setShowAccountDetails(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedAccount.company} - Account Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <Card className="luxury-card">
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Contact: {selectedAccount.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAccount.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedAccount.status)} variant="outline">
                      {selectedAccount.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {selectedAccount.billingType.toUpperCase()} BILLING
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <Card className="luxury-card">
                  <CardHeader>
                    <CardTitle>Account Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Bookings</span>
                      <span className="font-bold">{selectedAccount.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Guests</span>
                      <span className="font-bold">{selectedAccount.guestCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-bold">₦{selectedAccount.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding Balance</span>
                      <span className="font-bold text-destructive">₦{selectedAccount.outstandingBalance.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="luxury-card">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>Last booking: Room 205 (Jan 20, 2024)</div>
                    <div>Payment received: ₦180,000 (Jan 18, 2024)</div>
                    <div>New guest added: Sarah Johnson (Jan 15, 2024)</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  View Guests
                </Button>
                <Button variant="outline" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing History
                </Button>
              </div>
              <Button onClick={() => setShowAccountDetails(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}