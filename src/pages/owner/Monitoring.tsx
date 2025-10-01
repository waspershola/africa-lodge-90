/**
 * Phase 6: Monitoring & Observability Page
 * Central location for system health and performance metrics
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceDashboard } from '@/components/owner/monitoring/PerformanceDashboard';
import { SystemHealthDashboard } from '@/components/owner/monitoring/SystemHealthDashboard';
import { Activity, BarChart3 } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor system health, performance metrics, and background jobs
        </p>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <SystemHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
