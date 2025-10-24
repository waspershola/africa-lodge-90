-- Enable RLS on qr_session_audit table
ALTER TABLE qr_session_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view session audit logs for their tenant
CREATE POLICY "Staff can view session audit logs"
ON qr_session_audit
FOR SELECT
USING (can_access_tenant(tenant_id));

-- Policy: System can insert audit logs (used by the validate function)
CREATE POLICY "System can insert audit logs"
ON qr_session_audit
FOR INSERT
WITH CHECK (true);

COMMENT ON POLICY "Staff can view session audit logs" ON qr_session_audit IS
'Allows staff members to view session audit logs for their tenant for debugging purposes';

COMMENT ON POLICY "System can insert audit logs" ON qr_session_audit IS
'Allows the database functions to insert audit log entries during session lifecycle events';
