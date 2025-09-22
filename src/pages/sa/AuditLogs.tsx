import { AuditLogViewer } from '@/components/common/AuditLogViewer';
import { AuditLogExporter } from '@/components/sa/AuditLogExporter';

export default function AuditLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Audit Logs</h1>
        <p className="text-muted-foreground">
          Monitor all system activities and user actions across the platform
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <AuditLogViewer />
        <AuditLogExporter />
      </div>
    </div>
  );
}