import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import StaffDirectory from "@/components/owner/staff/StaffDirectory";
import RoleManagement from "@/components/owner/staff/RoleManagement";
import StaffInviteModal from "@/components/owner/staff/StaffInviteModal";

export default function StaffRoles() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Staff & Role Management</h1>
          <p className="text-muted-foreground">Manage your hotel staff and configure role permissions.</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="bg-gradient-primary shadow-luxury hover:shadow-hover">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <StaffDirectory />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>
      </Tabs>

      <StaffInviteModal 
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />
    </div>
  );
}