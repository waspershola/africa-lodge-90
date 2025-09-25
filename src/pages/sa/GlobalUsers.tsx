import { GlobalUsersTable } from "@/components/sa/GlobalUsersTable";
import { CreateGlobalUserDialog } from '@/components/sa/CreateGlobalUserDialog';
import { TestCreateUserButton } from '@/components/sa/TestCreateUserButton';

export default function GlobalUsers() {
  console.log('GlobalUsers component rendered at:', new Date().toISOString());
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Users</h1>
          <p className="text-muted-foreground">Manage platform administrators and support staff</p>
        </div>
        <div className="flex items-center gap-2">
          <TestCreateUserButton />
          <CreateGlobalUserDialog />
        </div>
      </div>

      <GlobalUsersTable />
    </div>
  );
}