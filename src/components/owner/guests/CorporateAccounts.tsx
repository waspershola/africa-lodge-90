import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Search,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCorporateAccounts } from '@/hooks/useApi';

export default function CorporateAccounts() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: corporateAccounts = [], isLoading } = useCorporateAccounts();

  const filteredAccounts = corporateAccounts.filter(account =>
    account.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading corporate accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search corporate accounts by company name or contact person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Corporate Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Corporate Accounts Grid */}
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
                    <h3 className="text-xl font-bold">{account.companyName}</h3>
                    <p className="text-sm text-muted-foreground">{account.industry}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(account.status)}>
                        {account.status.toUpperCase()}
                      </Badge>
                      {account.billingType === 'centralized' && (
                        <Badge variant="outline">Centralized Billing</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Guests
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoices
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Contact Person</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{account.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{account.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{account.contactEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Account Statistics */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Account Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Guests:</span>
                      <span className="font-medium">{account.totalGuests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Bookings:</span>
                      <span className="font-medium">{account.activeBookings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Bookings:</span>
                      <span className="font-medium">{account.totalBookings}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Financial</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Revenue:</span>
                      <span className="font-medium">₦{(account.totalRevenue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outstanding:</span>
                      <span className={`font-medium ${
                        account.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₦{(account.outstandingBalance / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credit Limit:</span>
                      <span className="font-medium">₦{(account.creditLimit / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>

                {/* Contract Details */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Contract</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rate Type:</span>
                      <span className="font-medium capitalize">{account.rateType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-medium">{account.corporateDiscount}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Terms:</span>
                      <span className="font-medium">{account.paymentTerms} days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Recent Activity</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {account.recentBookings.slice(0, 3).map((booking, index) => (
                    <div key={index} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.guestName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Room {booking.room} • {booking.checkIn}
                      </div>
                      <div className="text-xs font-medium mt-1">
                        ₦{booking.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
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
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Invoice
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
            <div className="text-sm text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Start by adding your first corporate account'
              }
            </div>
            {!searchTerm && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Corporate Account
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}