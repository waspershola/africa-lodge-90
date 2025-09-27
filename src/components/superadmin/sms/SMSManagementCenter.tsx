import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SMSDashboard } from "./SMSDashboard";
import { ProviderSettings } from "./ProviderSettings";
import { CreditPoolManagement } from "./CreditPoolManagement";
import { GlobalTemplates } from "./GlobalTemplates";
import { SMSAnalytics } from "./SMSAnalytics";

export function SMSManagementCenter() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SMS Management</h1>
        <p className="text-muted-foreground">
          Manage SMS providers, templates, and global settings across all hotels
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="credits">Credit Pool</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <SMSDashboard />
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <ProviderSettings />
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <CreditPoolManagement />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <GlobalTemplates />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SMSAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}