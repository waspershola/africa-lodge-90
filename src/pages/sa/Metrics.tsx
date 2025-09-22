import React from 'react';
import { SystemMonitoring } from '@/components/sa/SystemMonitoring';
import { EdgeFunctionMonitoring } from '@/components/sa/EdgeFunctionMonitoring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Metrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Monitoring</h1>
        <p className="text-muted-foreground">
          Comprehensive system monitoring and observability dashboard
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="functions">
          <EdgeFunctionMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}