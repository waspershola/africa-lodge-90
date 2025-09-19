import { AuditLogViewer } from '@/components/common/AuditLogViewer';

export default function AuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Audit Logs</h1>
        <p className="text-muted-foreground">
          Monitor all system activities and user actions across the platform
        </p>
      </div>
      
      <AuditLogViewer />
    </div>
  );
}