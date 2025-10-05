-- Set up cron job for automatic notification escalation
-- This requires pg_cron extension which should be enabled in Supabase

-- Create a cron job that runs every minute to check for unacknowledged notifications
-- Note: Replace 'YOUR_PROJECT_URL' and 'YOUR_ANON_KEY' with actual values

SELECT cron.schedule(
  'escalate-notifications-every-minute',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url:='https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/notification-escalation',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);