import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText,
  Download,
  Mail,
  Printer,
  Search,
  Eye,
  Plus,
  Calendar,
  User,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import InvoicePreviewDialog from './InvoicePreviewDialog';

export default function InvoicesManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Mock invoices data
  const mockInvoices = [
    {
      id: 'INV-2024-001',
      billId: 'BILL-001',
      guestName: 'John Smith',
      room: '205',
      issueDate: new Date(2024, 7, 22),
      dueDate: new Date(2024, 7, 29),
      amount: 450000,
      paidAmount: 200000,
      status: 'partial',
      hotelInfo: {
        name: 'Luxury Grand Hotel',
        address: '123 Victoria Island, Lagos, Nigeria',
        phone: '+234 1 234 5678',
        email: 'billing@luxurygrand.com',
        logo: '/hotel-logo.png'
      },
      lineItems: [
        { description: 'Deluxe Room - 3 nights', quantity: 3, unitPrice: 120000, total: 360000 },
        { description: 'VAT (7.5%)', quantity: 1, unitPrice: 27000, total: 27000 },
        { description: 'Service Charge (10%)', quantity: 1, unitPrice: 36000, total: 36000 },
        { description: 'Minibar', quantity: 1, unitPrice: 15000, total: 15000 },
        { description: 'Laundry', quantity: 1, unitPrice: 12000, total: 12000 }
      ],
      payments: [
        { date: new Date(2024, 7, 22), amount: 200000, method: 'card', reference: 'TXN123456' }
      ]
    },
    {
      id: 'INV-2024-002',
      billId: 'BILL-002',
      guestName: 'Sarah Wilson',
      room: '312',
      issueDate: new Date(2024, 7, 23),
      dueDate: new Date(2024, 7, 30),
      amount: 285000,
      paidAmount: 285000,
      status: 'paid',
      hotelInfo: {
        name: 'Luxury Grand Hotel',
        address: '123 Victoria Island, Lagos, Nigeria',
        phone: '+234 1 234 5678',
        email: 'billing@luxurygrand.com',
        logo: '/hotel-logo.png'
      },
      lineItems: [
        { description: 'Standard Room - 3 nights', quantity: 3, unitPrice: 80000, total: 240000 },
        { description: 'VAT (7.5%)', quantity: 1, unitPrice: 18000, total: 18000 },
        { description: 'Service Charge (10%)', quantity: 1, unitPrice: 24000, total: 24000 },
        { description: 'Room Service', quantity: 1, unitPrice: 3000, total: 3000 }
      ],
      payments: [
        { date: new Date(2024, 7, 23), amount: 285000, method: 'transfer', reference: 'BANK789' }
      ]
    },
    {
      id: 'INV-2024-003',
      billId: 'BILL-003',
      guestName: 'Michael Chen',
      room: '108',
      issueDate: new Date(2024, 7, 24),
      dueDate: new Date(2024, 7, 31),
      amount: 520000,
      paidAmount: 100000,
      status: 'overdue',
      hotelInfo: {
        name: 'Luxury Grand Hotel',
        address: '123 Victoria Island, Lagos, Nigeria',
        phone: '+234 1 234 5678',
        email: 'billing@luxurygrand.com',
        logo: '/hotel-logo.png'
      },
      lineItems: [
        { description: 'Suite - 3 nights', quantity: 3, unitPrice: 150000, total: 450000 },
        { description: 'VAT (7.5%)', quantity: 1, unitPrice: 33750, total: 33750 },
        { description: 'Service Charge (10%)', quantity: 1, unitPrice: 45000, total: 45000 },
        { description: 'Conference Room', quantity: 1, unitPrice: 25000, total: 25000 }
      ],
      payments: [
        { date: new Date(2024, 7, 24), amount: 100000, method: 'cash', reference: 'CASH001' }
      ]
    }
  ];

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.room.includes(searchTerm) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'partial': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-danger text-danger-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoicePreview(true);
  };

  const handleEmailInvoice = (invoice: any) => {
    // Mock email functionality
    console.log('Emailing invoice:', invoice.id);
    // In a real app, this would integrate with an email service
  };

  const handleDownloadInvoice = (invoice: any) => {
    // Mock PDF generation and download
    console.log('Downloading invoice PDF:', invoice.id);
    // In a real app, this would generate and download a PDF
  };

  return (
    <div className="space-y-6">
      {/* Invoice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{mockInvoices.length}</div>
            <div className="text-sm text-muted-foreground">Total Invoices</div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {mockInvoices.filter(inv => inv.status === 'paid').length}
            </div>
            <div className="text-sm text-muted-foreground">Paid</div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {mockInvoices.filter(inv => inv.status === 'partial').length}
            </div>
            <div className="text-sm text-muted-foreground">Partial</div>
          </CardContent>
        </Card>
        <Card className="luxury-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-danger">
              {mockInvoices.filter(inv => inv.status === 'overdue').length}
            </div>
            <div className="text-sm text-muted-foreground">Overdue</div>
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
                placeholder="Search invoices by guest name, room, or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Bulk Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="luxury-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{invoice.id}</div>
                    <div className="text-sm text-muted-foreground">{invoice.guestName} • Room {invoice.room}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.toUpperCase()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Issue Date</div>
                    <div className="text-sm text-muted-foreground">
                      {format(invoice.issueDate, 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Due Date</div>
                    <div className="text-sm text-muted-foreground">
                      {format(invoice.dueDate, 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Total Amount</div>
                    <div className="text-sm text-muted-foreground">
                      ₦{invoice.amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Balance Due</div>
                    <div className={`text-sm font-semibold ${
                      (invoice.amount - invoice.paidAmount) > 0 ? 'text-danger' : 'text-success'
                    }`}>
                      ₦{(invoice.amount - invoice.paidAmount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Payment Progress</span>
                  <span className="text-sm text-muted-foreground">
                    ₦{invoice.paidAmount.toLocaleString()} / ₦{invoice.amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      invoice.status === 'paid' ? 'bg-success' : 
                      invoice.status === 'overdue' ? 'bg-danger' : 'bg-warning'
                    }`}
                    style={{ 
                      width: `${(invoice.paidAmount / invoice.amount) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadInvoice(invoice)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEmailInvoice(invoice)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Invoice
                </Button>
                
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                
                <Button variant="outline" size="sm">
                  Send Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">No invoices found</div>
            <div className="text-sm text-muted-foreground">
              No invoices match your current search criteria
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Preview Dialog */}
      {showInvoicePreview && selectedInvoice && (
        <InvoicePreviewDialog
          invoice={selectedInvoice}
          onClose={() => setShowInvoicePreview(false)}
        />
      )}
    </div>
  );
}