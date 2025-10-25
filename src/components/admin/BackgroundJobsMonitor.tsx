import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BackgroundJobLog {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed' | 'skipped';
  rows_affected: number;
  error_message: string | null;
  execution_time_ms: number | null;
  metadata: Record<string, any>;
}

export function BackgroundJobsMonitor() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['background-job-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('background_job_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as BackgroundJobLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: { variant: 'default', className: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive', className: '' },
      running: { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      skipped: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
    };

    const config = variants[status] || variants.success;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getJobStats = () => {
    if (!logs) return { total: 0, success: 0, failed: 0, running: 0, skipped: 0 };

    return logs.reduce(
      (acc, log) => {
        acc.total++;
        acc[log.status as keyof typeof acc]++;
        return acc;
      },
      { total: 0, success: 0, failed: 0, running: 0, skipped: 0 }
    );
  };

  const stats = getJobStats();

  if (isLoading) {
    return <div>Loading background jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.success}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.running}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Execution History</CardTitle>
          <CardDescription>Recent background job executions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs?.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(log.status)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{log.job_name}</p>
                      {getStatusBadge(log.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Started {formatDistanceToNow(new Date(log.started_at))} ago
                    </p>
                    {log.completed_at && (
                      <p className="text-sm text-muted-foreground">
                        Completed in {log.execution_time_ms}ms
                      </p>
                    )}
                    {log.rows_affected > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Affected {log.rows_affected} rows
                      </p>
                    )}
                    {log.error_message && (
                      <p className="text-sm text-red-600">Error: {log.error_message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {logs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No background jobs have been executed yet</p>
                <p className="text-sm mt-2">
                  Enable the background jobs feature flag to start automated tasks
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
