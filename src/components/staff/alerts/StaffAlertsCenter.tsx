// @ts-nocheck
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffAlertsDashboard } from "./StaffAlertsDashboard";
import { AlertConfigurations } from "./AlertConfigurations";
import { AlertHistory } from "./AlertHistory";
import { NotificationChannels } from "./NotificationChannels";
import { ManagerDailySummary } from "@/components/manager/ManagerDailySummary";
import { NotificationAnalytics } from "@/components/analytics/NotificationAnalytics";
import { TemplatePreview } from "@/components/notifications/TemplatePreview";

export function StaffAlertsCenter() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Alerts & Notifications</h1>
        <p className="text-muted-foreground">
          Manage staff notifications, alerts, and communication preferences
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Alert Config</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="summary">Daily Summary</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <StaffAlertsDashboard />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <AlertConfigurations />
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <NotificationChannels />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <AlertHistory />
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <ManagerDailySummary />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <NotificationAnalytics />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <TemplatePreview />
        </TabsContent>
      </Tabs>
    </div>
  );
}