// @ts-nocheck
/**
 * Phase 6: System Health Dashboard
 * Displays background job status and system health metrics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, RefreshCw, Activity } from 'lucide-react';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/common/LoadingState';
import { formatDistanceToNow } from 'date-fns';

interface BackgroundJobLog {
  id: string;
  job_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  rows_affected: number;
  error_message: string | null;
  metadata: Record<string, any>;
}

export function SystemHealthDashboard() {
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['background-job-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('background_job_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BackgroundJobLog[];
    },
    // Phase 3: Removed polling - real-time updates handle freshness
  });

  if (isLoading) {
    return <LoadingState message="Loading system health..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load system health"
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  // Group jobs by name to show latest status
  const jobsByName = jobs?.reduce((acc, job) => {
    if (!acc[job.job_name] || new Date(job.started_at) > new Date(acc[job.job_name].started_at)) {
      acc[job.job_name] = job;
    }
    return acc;
  }, {} as Record<string, BackgroundJobLog>);

  const latestJobs = Object.values(jobsByName || {});
  const failedJobs = jobs?.filter(j => j.status === 'failed').slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Background jobs and automated processes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Job Status */}
      <Card>
        <CardHeader>
          <CardTitle>Active Background Jobs</CardTitle>
          <CardDescription>Latest execution status for each job type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latestJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {job.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {job.status === 'failed' && (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  {job.status === 'running' && (
                    <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                  )}
                  {job.status === 'skipped' && (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  
                  <div>
                    <p className="font-medium">{job.job_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {job.execution_time_ms && (
                    <span className="text-sm text-muted-foreground">
                      {job.execution_time_ms}ms
                    </span>
                  )}
                  {job.rows_affected > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {job.rows_affected} rows
                    </span>
                  )}
                  <Badge
                    variant={
                      job.status === 'success'
                        ? 'default'
                        : job.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}

            {latestJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No background jobs executed yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Failures</CardTitle>
            <CardDescription>Jobs that failed execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedJobs.map((job) => (
                <div key={job.id} className="p-4 border border-destructive/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{job.job_name}</p>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
                    </span>
                  </div>
                  {job.error_message && (
                    <p className="text-sm text-destructive">{job.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
