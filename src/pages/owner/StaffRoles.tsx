import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffDirectory from "@/components/owner/staff/StaffDirectory";
import RoleManagement from "@/components/owner/staff/RoleManagement";

export default function StaffRoles() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Staff & Role Management</h1>
        <p className="text-muted-foreground">Manage your hotel staff and configure role permissions.</p>
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
    </div>
  );
}