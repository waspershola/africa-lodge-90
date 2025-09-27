import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Users, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface GlobalStats {
  totalSMSSent: number;
  totalCreditsRemaining: number;
  averageDeliveryRate: number;
  activeProviders: number;
  topHotels: Array<{
    hotel_name: string;
    total_sent: number;
  }>;
  providerHealth: Array<{
    name: string;
    health_status: string;
    delivery_rate: number;
  }>;
}

export function SMSDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      // Fetch SMS logs for total sent
      const { data: logs } = await supabase
        .from('sms_logs')
        .select('tenant_id, credits_used')
        .eq('status', 'sent');

      // Fetch total credits across all tenants
      const { data: credits } = await supabase
        .from('sms_credits')
        .select('balance, tenant_id');

      // Fetch provider health
      const { data: providers } = await supabase
        .from('sms_providers')
        .select('name, health_status, delivery_rate, is_enabled');

      // Calculate stats
      const totalSMSSent = logs?.length || 0;
      const totalCreditsRemaining = credits?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;
      const activeProviders = providers?.filter(p => p.is_enabled).length || 0;
      const averageDeliveryRate = providers?.reduce((sum, p) => sum + (p.delivery_rate || 0), 0) / (providers?.length || 1) || 0;

      // Calculate top hotels by actual usage
      const tenantUsage = new Map<string, { name: string; usage: number }>();
      
      // Get tenant info first
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('tenant_id, hotel_name');
      
      const tenantMap = new Map(tenantData?.map(t => [t.tenant_id, t.hotel_name]) || []);
      
      // Calculate usage per tenant
      logs?.forEach(log => {
        const hotelName = tenantMap.get(log.tenant_id) || 'Unknown Hotel';
        const current = tenantUsage.get(log.tenant_id) || { name: hotelName, usage: 0 };
        current.usage += log.credits_used || 1;
        tenantUsage.set(log.tenant_id, current);
      });
      
      // Convert to array and sort by usage
      const topHotels = Array.from(tenantUsage.values())
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5)
        .map(hotel => ({
          hotel_name: hotel.name,
          total_sent: hotel.usage
        }));

      setStats({
        totalSMSSent,
        totalCreditsRemaining,
        averageDeliveryRate,
        activeProviders,
        topHotels,
        providerHealth: providers || []
      });
    } catch (error) {
      console.error('Error fetching global stats:', error);
      toast.error("Failed to load SMS statistics");
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading SMS statistics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSMSSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All hotels combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreditsRemaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Platform pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageDeliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProviders}</div>
            <p className="text-xs text-muted-foreground">
              Enabled and configured
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Hotels by Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Top Hotels by SMS Usage</CardTitle>
            <CardDescription>
              Hotels with highest SMS volume this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topHotels.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No SMS usage data yet</p>
                </div>
              ) : (
                stats?.topHotels.map((hotel, index) => (
                  <div key={hotel.hotel_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{hotel.hotel_name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {hotel.total_sent.toLocaleString()} SMS
                    </span>
                  </div>
                )) || []
              )}
            </div>
          </CardContent>
        </Card>

        {/* Provider Health */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Health Status</CardTitle>
            <CardDescription>
              Current status of SMS providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.providerHealth.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No provider data available</p>
                </div>
              ) : (
                stats?.providerHealth.map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getHealthIcon(provider.health_status)}
                      <span className="font-medium">{provider.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {provider.delivery_rate}% delivery
                      </span>
                      <Badge 
                        variant={
                          provider.health_status === 'healthy' ? 'default' :
                          provider.health_status === 'degraded' ? 'secondary' : 'destructive'
                        }
                      >
                        {provider.health_status}
                      </Badge>
                    </div>
                  </div>
                )) || []
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}