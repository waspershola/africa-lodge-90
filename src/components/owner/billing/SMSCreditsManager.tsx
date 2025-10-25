// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Plus, TrendingUp, AlertTriangle, History } from 'lucide-react';
import { useAddons } from '@/hooks/useAddons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import type { SMSLog, SMSUsageStats } from '@/types/billing';
import { formatDistanceToNow } from 'date-fns';

export const SMSCreditsManager: React.FC = () => {
  const { smsCredits, loading, topUpSMSCredits, refresh } = useAddons();
  const { tenant } = useAuth();
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [usageStats, setUsageStats] = useState<SMSUsageStats | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadSMSLogs = async () => {
    if (!tenant?.tenant_id) return;

    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSmsLogs((data || []) as SMSLog[]);
    } catch (err: any) {
      console.error('Error loading SMS logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const calculateUsageStats = (logs: SMSLog[]): SMSUsageStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const todayLogs = logs.filter(log => new Date(log.created_at) >= today && log.source_type === 'usage');
    const monthLogs = logs.filter(log => new Date(log.created_at) >= thisMonth && log.source_type === 'usage');
    
    const totalSent = logs.filter(log => log.status === 'sent' && log.source_type === 'usage').length;
    const totalFailed = logs.filter(log => log.status === 'failed' && log.source_type === 'usage').length;
    const creditsUsedToday = todayLogs.reduce((sum, log) => sum + log.credits_used, 0);
    const creditsUsedThisMonth = monthLogs.reduce((sum, log) => sum + log.credits_used, 0);
    
    const daysInMonth = now.getDate();
    const averageDailyUsage = daysInMonth > 0 ? creditsUsedThisMonth / daysInMonth : 0;
    const daysLeftInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysInMonth;
    const projectedMonthlyUsage = creditsUsedThisMonth + (averageDailyUsage * daysLeftInMonth);

    return {
      total_sent: totalSent,
      total_failed: totalFailed,
      credits_used_today: creditsUsedToday,
      credits_used_this_month: creditsUsedThisMonth,
      average_daily_usage: averageDailyUsage,
      projected_monthly_usage: projectedMonthlyUsage
    };
  };

  useEffect(() => {
    loadSMSLogs();
  }, [tenant?.tenant_id]);

  useEffect(() => {
    if (smsLogs.length > 0) {
      setUsageStats(calculateUsageStats(smsLogs));
    }
  }, [smsLogs]);

  const handleQuickTopUp = (credits: number) => {
    topUpSMSCredits(credits);
  };

  const getBalanceStatus = () => {
    if (!smsCredits) return { status: 'unknown', color: 'gray' };
    
    const balance = smsCredits.balance;
    if (balance <= 10) return { status: 'critical', color: 'red' };
    if (balance <= 50) return { status: 'low', color: 'yellow' };
    if (balance <= 100) return { status: 'medium', color: 'blue' };
    return { status: 'good', color: 'green' };
  };

  const balanceStatus = getBalanceStatus();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SMS Credits Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {smsCredits?.balance?.toLocaleString() || '0'}
              </div>
              <Badge variant={balanceStatus.color === 'red' ? 'destructive' : 'default'}>
                {balanceStatus.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              SMS credits available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.credits_used_this_month?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits used • Avg: {Math.round(usageStats?.average_daily_usage || 0)}/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats ? 
                Math.round((usageStats.total_sent / (usageStats.total_sent + usageStats.total_failed)) * 100) || 0
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              {usageStats?.total_sent || 0} sent, {usageStats?.total_failed || 0} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Alert */}
      {balanceStatus.status === 'critical' && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Critical: Low SMS Balance</h3>
                <p className="text-sm text-muted-foreground">
                  You have only {smsCredits?.balance || 0} SMS credits remaining. Top up now to avoid service interruption.
                </p>
              </div>
              <Button onClick={() => handleQuickTopUp(500)} className="bg-gradient-primary">
                Quick Top-up
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Projection */}
      {usageStats && smsCredits && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Projection</CardTitle>
            <CardDescription>
              Based on your current usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Projected monthly usage</span>
                  <span>{Math.round(usageStats.projected_monthly_usage)} credits</span>
                </div>
                <Progress 
                  value={Math.min((usageStats.projected_monthly_usage / smsCredits.balance) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              {usageStats.projected_monthly_usage > smsCredits.balance && (
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>You may run out of credits before month end</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Top-up Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Top-up</CardTitle>
          <CardDescription>
            Add SMS credits instantly to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[100, 500, 1000, 2500].map((credits) => (
              <Button
                key={credits}
                variant="outline"
                onClick={() => handleQuickTopUp(credits)}
                disabled={loading}
                className="flex flex-col h-auto py-4"
              >
                <div className="font-semibold">{credits.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  ₦{(credits * 0.5).toLocaleString()}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-4 h-4 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your latest SMS credit transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded flex-1"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : smsLogs.length > 0 ? (
            <div className="space-y-3">
              {smsLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={log.credits_used < 0 ? 'default' : 'secondary'}>
                        {log.source_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-medium">
                        {log.credits_used < 0 ? '+' : '-'}{Math.abs(log.credits_used)} credits
                      </span>
                    </div>
                    {log.purpose && (
                      <p className="text-xs text-muted-foreground mt-1">{log.purpose}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </div>
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No SMS activity yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};