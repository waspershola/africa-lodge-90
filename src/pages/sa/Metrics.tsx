import React from 'react';
import { SystemMonitoring } from '@/components/sa/SystemMonitoring';
import { EdgeFunctionMonitoring } from '@/components/sa/EdgeFunctionMonitoring';
import { CanaryDeployment } from '@/components/sa/CanaryDeployment';
import { ProductionValidation } from '@/components/sa/ProductionValidation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Metrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Operations</h1>
        <p className="text-muted-foreground">
          Comprehensive production monitoring, deployment, and validation dashboard
        </p>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="validation">Production Validation</TabsTrigger>
          <TabsTrigger value="deployment">Canary Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="functions">
          <EdgeFunctionMonitoring />
        </TabsContent>

        <TabsContent value="validation">
          <ProductionValidation />
        </TabsContent>

        <TabsContent value="deployment">
          <CanaryDeployment />
        </TabsContent>
      </Tabs>
    </div>
  );
}