import { SystemOwnerManagement } from "@/components/superadmin/SystemOwnerManagement";

export default function SystemOwners() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Owners</h1>
          <p className="text-muted-foreground">Manage individual system owner accounts</p>
        </div>
      </div>

      <SystemOwnerManagement />
    </div>
  );
}