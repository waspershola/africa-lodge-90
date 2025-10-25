// @ts-nocheck
// Phase 4: Wallet Management Dashboard for Managers/Owners
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  ArrowUpCircle, 
  Search,
  Download,
  ArrowLeft
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface WalletStats {
  totalBalance: number;
  totalGuests: number;
  recentTransactions: number;
  topWallets: Array<{
    guest_id: string;
    guest_name: string;
    balance: number;
  }>;
}

export function WalletManagementDashboard() {
  const { tenant, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch wallet statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['wallet-stats', tenant?.tenant_id],
    queryFn: async () => {
      const { data: wallets, error } = await supabase
        .from('guest_wallets')
        .select(`
          id,
          guest_id,
          balance,
          guests!inner (
            first_name,
            last_name
          )
        `)
        .eq('tenant_id', tenant?.tenant_id)
        .order('balance', { ascending: false });

      if (error) throw error;

      const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
      const topWallets = wallets.slice(0, 10).map(w => ({
        guest_id: w.guest_id,
        guest_name: `${(w.guests as any).first_name} ${(w.guests as any).last_name}`,
        balance: Number(w.balance)
      }));

      return {
        totalBalance,
        totalGuests: wallets.length,
        recentTransactions: 0, // TODO: Count from wallet_transactions
        topWallets
      } as WalletStats;
    },
    enabled: !!tenant?.tenant_id
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Wallet Management
        </h2>
        <p className="text-muted-foreground">
          Monitor and manage guest wallet balances
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Total Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats?.totalBalance.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Liability across all guest wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Active Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalGuests || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Guests with wallet balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recentTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transactions this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Wallets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />
              Top Wallet Balances
            </CardTitle>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {stats?.topWallets
                .filter(wallet => 
                  wallet.guest_name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((wallet, index) => (
                  <div
                    key={wallet.guest_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{wallet.guest_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Guest ID: {wallet.guest_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        ₦{wallet.balance.toLocaleString()}
                      </p>
                      <Button size="sm" variant="ghost" className="h-6 text-xs mt-1">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              // Navigate to appropriate dashboard based on role
              if (user?.role === 'FRONT_DESK') {
                navigate('/front-desk');
              } else if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
                navigate('/dashboard');
              } else {
                navigate('/dashboard');
              }
            }}
            className="w-full md:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
      </div>
    </div>
  );
}
