-- ============================================================================
-- QUICK TEST QUERIES FOR SESSION MANAGEMENT
-- ============================================================================
-- Run these queries to verify the session management is working correctly

-- Query 1: Recent Sessions (Run after scanning)
-- Expected: device_fingerprint should NOT be NULL for new sessions
SELECT 
  session_id,
  LEFT(device_fingerprint, 12) as device_fp,
  is_active,
  TO_CHAR(created_at, 'HH24:MI:SS') as time,
  qr_code_id
FROM guest_sessions
WHERE created_at > now() - interval '10 minutes'
ORDER BY created_at DESC;

-- Query 2: Session Audit Log (Run after rescanning)
-- Expected: See 'session_created', 'session_resumed', or 'session_invalidated' events
SELECT 
  event_type,
  LEFT(device_fingerprint, 12) as device_fp,
  reason,
  TO_CHAR(created_at, 'HH24:MI:SS') as time
FROM qr_session_audit
WHERE created_at > now() - interval '10 minutes'
ORDER BY created_at DESC;

-- Query 3: Active Sessions by QR Code
-- Shows which sessions are currently active for each QR code
SELECT 
  qc.label as qr_label,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN gs.is_active = true THEN 1 END) as active_sessions,
  MAX(gs.created_at) as last_scan
FROM guest_sessions gs
JOIN qr_codes qc ON gs.qr_code_id = qc.id
WHERE gs.created_at > now() - interval '1 hour'
GROUP BY qc.id, qc.label
ORDER BY last_scan DESC;

-- Query 4: Session Health Check
-- Overall health of the session management system
SELECT 
  COUNT(*) as total_sessions_24h,
  COUNT(CASE WHEN device_fingerprint IS NOT NULL THEN 1 END) as with_fingerprint,
  COUNT(CASE WHEN device_fingerprint IS NULL THEN 1 END) as without_fingerprint,
  ROUND(100.0 * COUNT(CASE WHEN device_fingerprint IS NOT NULL THEN 1 END) / COUNT(*), 2) as fingerprint_percentage
FROM guest_sessions
WHERE created_at > now() - interval '24 hours';

-- Query 5: Requests by Session Status
-- Shows requests from both active and inactive sessions
SELECT 
  qr.request_type,
  qr.status,
  gs.is_active as session_active,
  TO_CHAR(qr.created_at, 'HH24:MI:SS') as request_time
FROM qr_requests qr
JOIN guest_sessions gs ON qr.session_id = gs.session_id
WHERE qr.created_at > now() - interval '1 hour'
ORDER BY qr.created_at DESC;

-- Query 6: Multi-Device Detection
-- Shows if multiple devices are accessing the same QR code
SELECT 
  qc.label as qr_label,
  COUNT(DISTINCT gs.device_fingerprint) as unique_devices,
  COUNT(*) as total_scans,
  MAX(gs.created_at) as last_scan
FROM guest_sessions gs
JOIN qr_codes qc ON gs.qr_code_id = qc.id
WHERE gs.created_at > now() - interval '24 hours'
  AND gs.device_fingerprint IS NOT NULL
GROUP BY qc.id, qc.label
HAVING COUNT(DISTINCT gs.device_fingerprint) > 1
ORDER BY unique_devices DESC;

-- Query 7: Session History for Specific QR Code
-- Replace 'YOUR_QR_TOKEN' with actual token
-- Shows complete session lifecycle for debugging
SELECT 
  gs.session_id,
  LEFT(gs.device_fingerprint, 12) as device,
  gs.is_active,
  qsa.event_type,
  qsa.reason,
  TO_CHAR(gs.created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM guest_sessions gs
LEFT JOIN qr_session_audit qsa ON qsa.guest_session_uuid = gs.id
JOIN qr_codes qc ON gs.qr_code_id = qc.id
WHERE qc.qr_token = 'YOUR_QR_TOKEN'
  AND gs.created_at > now() - interval '24 hours'
ORDER BY gs.created_at DESC;

-- Query 8: Duplicate Active Sessions (Should be 0!)
-- Finds QR codes with multiple active sessions (indicates a bug)
SELECT 
  qc.label as qr_label,
  COUNT(*) as active_session_count,
  STRING_AGG(LEFT(gs.device_fingerprint, 12), ', ') as devices
FROM guest_sessions gs
JOIN qr_codes qc ON gs.qr_code_id = qc.id
WHERE gs.is_active = true
  AND gs.expires_at > now()
GROUP BY qc.id, qc.label
HAVING COUNT(*) > 1;
