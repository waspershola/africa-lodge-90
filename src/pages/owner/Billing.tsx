import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Receipt, 
  DollarSign, 
  FileText,
  Download,
  Mail,
  Printer,
  Plus,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import BillsManagement from '@/components/owner/billing/BillsManagement';
import PaymentsOverview from '@/components/owner/billing/PaymentsOverview';
import InvoicesManager from '@/components/owner/billing/InvoicesManager';
import OutstandingBalances from '@/components/owner/billing/OutstandingBalances';
import { useBilling } from '@/hooks/useBilling';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('bills');

  const { billingStats, loading } = useBilling();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gradient">
            Billing & Payments
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage reservations billing, payments, and invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gradient-primary" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₦{loading ? '...' : ((billingStats?.totalRevenue || 0) / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-muted-foreground">Today's Revenue</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>+15.2% from yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-warning-foreground" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{loading ? '...' : billingStats?.pendingPayments || 0}</div>
                <div className="text-sm text-muted-foreground">Pending Payments</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                23 reservations pending
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{loading ? '...' : billingStats?.totalInvoices || 0}</div>
                <div className="text-sm text-muted-foreground">Total Invoices</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                This month
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-danger" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₦{loading ? '...' : ((billingStats?.outstandingBalance || 0) / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground">Outstanding</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                Across all guests
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Cashflow */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Today's Cashflow by Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="h-6 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                </div>
              ))
            ) : billingStats?.todaysCashflow && Object.keys(billingStats.todaysCashflow).length > 0 ? (
              Object.entries(billingStats.todaysCashflow).map(([method, amount]) => (
                <div key={method} className="text-center">
                  <div className="text-lg font-bold">₦{(amount / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground capitalize">{method}</div>
                  <div className="h-2 bg-muted rounded mt-2">
                    <div 
                      className="h-full bg-gradient-primary rounded"
                      style={{ 
                        width: `${(amount / Math.max(...Object.values(billingStats.todaysCashflow))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-5 text-center text-muted-foreground py-4">
                No payment data for today
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bills">Bills Management</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
        </TabsList>

        <TabsContent value="bills">
          <BillsManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsOverview />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesManager />
        </TabsContent>

        <TabsContent value="outstanding">
          <OutstandingBalances />
        </TabsContent>
      </Tabs>
    </div>
  );
}