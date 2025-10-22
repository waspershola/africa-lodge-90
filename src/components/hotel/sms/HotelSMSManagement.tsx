import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotelSMSDashboard } from "./HotelSMSDashboard";
import { SMSTemplateManager } from "@/components/owner/SMSTemplateManager";
import { HotelSMSCredits } from "./HotelSMSCredits";
import { SMSActivityLog } from "./SMSActivityLog";
import { HotelSMSSettings } from "./HotelSMSSettings";
import { HotelSMSUsage } from "./HotelSMSUsage";

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
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <HotelSMSDashboard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <SMSTemplateManager />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <HotelSMSUsage />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <SMSActivityLog />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <HotelSMSSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
