import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelSMSDashboard } from "./HotelSMSDashboard";
import { HotelSMSTemplates } from "./HotelSMSTemplates";
import { HotelSMSCredits } from "./HotelSMSCredits";
import { HotelSMSLogs } from "./HotelSMSLogs";
import { HotelSMSSettings } from "./HotelSMSSettings";

export function HotelSMSCenter() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SMS Management</h1>
        <p className="text-muted-foreground">
          Manage SMS templates, notifications, and communication settings
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="logs">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <HotelSMSDashboard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <HotelSMSTemplates />
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <HotelSMSCredits />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <HotelSMSLogs />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <HotelSMSSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}