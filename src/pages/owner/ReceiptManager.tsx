import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReceiptSettings from "@/components/owner/config/ReceiptSettings";
import { ReceiptGenerator } from "@/components/frontdesk/ReceiptGenerator";
import { AuditReceiptLog } from "@/components/owner/audit/AuditReceiptLog";

export default function ReceiptManager() {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-3xl font-bold text-gradient">
          Receipt & Slip Management
        </h1>
        <p className="text-muted-foreground">
          Configure templates, generate receipts, and view audit logs
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Template Settings</TabsTrigger>
          <TabsTrigger value="generator">Receipt Generator</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <ReceiptSettings onDataChange={() => setHasChanges(true)} />
        </TabsContent>

        <TabsContent value="generator">
          <ReceiptGenerator />
        </TabsContent>

        <TabsContent value="audit">
          <AuditReceiptLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}