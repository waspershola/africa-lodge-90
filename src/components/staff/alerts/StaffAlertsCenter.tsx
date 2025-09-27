import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffAlertsDashboard } from "./StaffAlertsDashboard";
import { AlertConfigurations } from "./AlertConfigurations";
import { AlertHistory } from "./AlertHistory";
import { NotificationChannels } from "./NotificationChannels";

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Alert Config</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
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
      </Tabs>
    </div>
  );
}