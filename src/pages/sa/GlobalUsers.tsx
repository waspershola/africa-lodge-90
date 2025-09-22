import React from 'react';
import { GlobalUsersTable } from '@/components/sa/GlobalUsersTable';

export default function GlobalUsers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Users</h1>
          <p className="text-muted-foreground">Manage platform administrators and support staff</p>
        </div>
      </div>

      <GlobalUsersTable />
    </div>
  );
}