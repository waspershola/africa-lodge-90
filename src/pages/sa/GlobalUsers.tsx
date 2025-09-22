import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalUsers } from "@/hooks/useGlobalUsers";
import { GlobalUsersTable } from "@/components/sa/GlobalUsersTable";
import { CreateGlobalUserDialog } from "@/components/sa/CreateGlobalUserDialog";
import { callEdgeFunction } from "@/lib/api-utils";

export default function GlobalUsers() {
  const { data: users, isLoading, refetch } = useGlobalUsers();
  
  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    const result = await callEdgeFunction({
      functionName: 'suspend-user',
      body: {
        user_id: userId,
        action: suspend ? 'suspend' : 'unsuspend',
        reason: suspend ? 'Suspended by administrator' : 'Unsuspended by administrator'
      }
    });

    if (result.success) {
      toast.success(`User ${suspend ? 'suspended' : 'unsuspended'} successfully`);
      refetch();
    }
    // Error handling is done automatically by callEdgeFunction
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Users</h1>
          <p className="text-muted-foreground">Manage platform administrators and support staff</p>
        </div>
        <CreateGlobalUserDialog onSuccess={refetch} />
      </div>

      <GlobalUsersTable />
    </div>
  );
}