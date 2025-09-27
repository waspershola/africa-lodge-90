import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelSMSDashboard } from "./HotelSMSDashboard";
import { HotelSMSTemplates } from "./HotelSMSTemplates";
import { HotelSMSCredits } from "./HotelSMSCredits";
import { HotelSMSHistory } from "./HotelSMSHistory";
import { HotelSMSSettings } from "./HotelSMSSettings";

export function HotelSMSManagement() {
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
          <TabsTrigger value="history">History</TabsTrigger>
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

        <TabsContent value="history" className="space-y-6">
          <HotelSMSHistory />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <HotelSMSSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}