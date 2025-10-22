import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, TrendingUp, MessageSquare, DollarSign, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UsageStats {
  totalSent: number;
  creditsUsed: number;
  creditsRemaining: number;
  averageCost: number;
  recentActivity: Array<{
    date: string;
    count: number;
    cost: number;
  }>;
  byEventType: Array<{
    event_type: string;
    count: number;
    percentage: number;
  }>;
}

export function HotelSMSUsage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hotel-sms-usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch SMS logs for this tenant
      const { data: logs, error: logsError } = await supabase
        .from('sms_logs')
        .select('created_at, event_type, credits_used, cost_per_credit, status')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Fetch credit balance
      const { data: credits, error: creditsError } = await supabase
        .from('sms_credits')
        .select('balance')
        .eq('tenant_id', user.id)
        .single();

      if (creditsError) throw creditsError;

      // Calculate stats
      const totalSent = logs?.length || 0;
      const creditsUsed = logs?.reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0;
      const totalCost = logs?.reduce((sum, log) => sum + ((log.credits_used || 0) * (log.cost_per_credit || 0)), 0) || 0;
      const averageCost = totalSent > 0 ? totalCost / totalSent : 0;

      // Group by date for chart (last 7 days)
      const last7Days = new Array(7).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const activityByDate = new Map<string, { count: number; cost: number }>();
      logs?.forEach(log => {
        const date = log.created_at.split('T')[0];
        if (last7Days.includes(date)) {
          const current = activityByDate.get(date) || { count: 0, cost: 0 };
          current.count++;
          current.cost += (log.credits_used || 0) * (log.cost_per_credit || 0);
          activityByDate.set(date, current);
        }
      });

      const recentActivity = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: activityByDate.get(date)?.count || 0,
        cost: activityByDate.get(date)?.cost || 0
      }));

      // Group by event type
      const eventCounts = new Map<string, number>();
      logs?.forEach(log => {
        if (log.event_type) {
          eventCounts.set(log.event_type, (eventCounts.get(log.event_type) || 0) + 1);
        }
      });

      const byEventType = Array.from(eventCounts.entries())
        .map(([event_type, count]) => ({
          event_type,
          count,
          percentage: (count / totalSent) * 100
        }))
        .sort((a, b) => b.count - a.count);

      return {
        totalSent,
        creditsUsed,
        creditsRemaining: credits?.balance || 0,
        averageCost,
        recentActivity,
        byEventType
      } as UsageStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading usage statistics...</div>;
  }

  const creditUsagePercentage = stats ? (stats.creditsUsed / (stats.creditsUsed + stats.creditsRemaining)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 100 messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.creditsUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.creditsRemaining.toLocaleString()} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.averageCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per SMS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Pool</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditUsagePercentage.toFixed(0)}%</div>
            <Progress value={creditUsagePercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Chart */}
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              7-Day Activity
            </CardTitle>
            <CardDescription>
              SMS volume over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats?.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Type Breakdown */}
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Usage by Event Type</CardTitle>
            <CardDescription>
              Distribution of SMS by event type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.byEventType.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No event data yet</p>
                </div>
              ) : (
                stats?.byEventType.map((event) => (
                  <div key={event.event_type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{event.event_type.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{event.count}</span>
                        <Badge variant="outline">{event.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <Progress value={event.percentage} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
