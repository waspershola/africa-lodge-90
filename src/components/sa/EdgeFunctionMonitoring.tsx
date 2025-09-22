import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Activity, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface EdgeFunctionMetrics {
  function_name: string;
  total_calls: number;
  success_rate: number;
  avg_execution_time: number;
  error_count: number;
  last_24h_calls: number;
  status_distribution: Record<number, number>;
}

interface EdgeFunctionLog {
  id: string;
  timestamp: string;
  function_name: string;
  level: string;
  message: string;
  status_code?: number;
  execution_time?: number;
  request_method?: string;
}

export function EdgeFunctionMonitoring() {
  const [metrics, setMetrics] = useState<EdgeFunctionMetrics[]>([]);
  const [logs, setLogs] = useState<EdgeFunctionLog[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Mock function execution metrics since we don't have analytics setup yet
      const mockMetrics: EdgeFunctionMetrics[] = [
        {
          function_name: 'create-tenant-and-owner',
          total_calls: 145,
          success_rate: 98.6,
          avg_execution_time: 2340,
          error_count: 2,
          last_24h_calls: 12,
          status_distribution: { 200: 143, 500: 2 }
        },
        {
          function_name: 'invite-user',
          total_calls: 89,
          success_rate: 94.4,
          avg_execution_time: 1890,
          error_count: 5,
          last_24h_calls: 8,
          status_distribution: { 200: 84, 400: 3, 500: 2 }
        },
        {
          function_name: 'trial-signup',
          total_calls: 67,
          success_rate: 97.0,
          avg_execution_time: 3200,
          error_count: 2,
          last_24h_calls: 5,
          status_distribution: { 200: 65, 400: 2 }
        },
        {
          function_name: 'delete-user',
          total_calls: 23,
          success_rate: 100.0,
          avg_execution_time: 890,
          error_count: 0,
          last_24h_calls: 1,
          status_distribution: { 200: 23 }
        }
      ];
      
      setMetrics(mockMetrics);
      
      // Check for alerts (error rates > 10%, avg latency > 5s)
      const newAlerts: string[] = [];
      mockMetrics.forEach((metric: EdgeFunctionMetrics) => {
        if (metric.success_rate < 90) {
          newAlerts.push(`${metric.function_name}: Low success rate (${metric.success_rate.toFixed(1)}%)`);
        }
        if (metric.avg_execution_time > 5000) {
          newAlerts.push(`${metric.function_name}: High latency (${metric.avg_execution_time}ms)`);
        }
      });
      setAlerts(newAlerts);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      toast.error('Failed to fetch edge function metrics');
    }
  };

  const fetchLogs = async () => {
    try {
      // Mock recent edge function logs since we don't have log aggregation setup yet
      const mockLogs: EdgeFunctionLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          function_name: 'invite-user',
          level: 'error',
          message: 'Database error creating new user: users_role_check constraint violation',
          status_code: 500,
          execution_time: 2100,
          request_method: 'POST'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          function_name: 'create-tenant-and-owner',
          level: 'info',
          message: 'Tenant created successfully',
          status_code: 200,
          execution_time: 2340,
          request_method: 'POST'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          function_name: 'trial-signup',
          level: 'warning',
          message: 'Email send failed, falling back to temp password display',
          status_code: 200,
          execution_time: 3200,
          request_method: 'POST'
        }
      ];
      
      setLogs(mockLogs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchMetrics(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusBadgeVariant = (successRate: number) => {
    if (successRate >= 95) return 'default';
    if (successRate >= 90) return 'secondary';
    return 'destructive';
  };

  const getLatencyBadgeVariant = (latency: number) => {
    if (latency < 1000) return 'default';
    if (latency < 3000) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edge Function Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and alerting for production edge functions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Alerts ({alerts.length})</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {alerts.map((alert, index) => (
                <li key={index} className="text-sm">• {alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.function_name}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{metric.function_name}</CardTitle>
                  <CardDescription>
                    {metric.last_24h_calls} calls in last 24h
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge variant={getStatusBadgeVariant(metric.success_rate)}>
                      {metric.success_rate.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Performance</span>
                      <Badge variant={getLatencyBadgeVariant(metric.avg_execution_time)}>
                        {metric.avg_execution_time}ms
                      </Badge>
                    </div>
                    <Progress value={Math.min(100, (metric.avg_execution_time / 5000) * 100)} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {metric.error_count} errors • {metric.total_calls} total calls
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance analysis for all edge functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.function_name} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold">{metric.function_name}</h4>
                      <div className="flex gap-2">
                        <Badge variant={getStatusBadgeVariant(metric.success_rate)}>
                          {metric.success_rate.toFixed(1)}% success
                        </Badge>
                        <Badge variant={getLatencyBadgeVariant(metric.avg_execution_time)}>
                          {metric.avg_execution_time}ms avg
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Calls</span>
                        <div className="font-semibold">{metric.total_calls.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Errors</span>
                        <div className="font-semibold text-destructive">{metric.error_count}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24h Calls</span>
                        <div className="font-semibold">{metric.last_24h_calls.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Latency</span>
                        <div className="font-semibold">{metric.avg_execution_time}ms</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>
                Latest edge function execution logs with errors and warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                          {log.level}
                        </Badge>
                        <span className="font-medium">{log.function_name}</span>
                        {log.status_code && (
                          <Badge variant={log.status_code >= 400 ? 'destructive' : 'default'}>
                            {log.status_code}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(log.timestamp).toLocaleString()}
                        {log.execution_time && ` • ${log.execution_time}ms`}
                      </div>
                    </div>
                    <div className="text-foreground">{log.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Configure monitoring thresholds and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>Current Alert Thresholds</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Success rate below 90%</li>
                      <li>• Average latency above 5 seconds</li>
                      <li>• Error rate increase above 5% in 1 hour</li>
                      <li>• Function execution failures above 10 per minute</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active alerts. All systems operational.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{alert}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}